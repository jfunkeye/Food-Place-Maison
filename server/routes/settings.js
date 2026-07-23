import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('Created data directory:', DATA_DIR);
  }
}

function readSettings() {
  ensureDataDir();
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      console.log('Settings file does not exist');
      return {};
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return parsed || {};
  } catch (error) {
    console.error('Error reading settings:', error);
    return {};
  }
}

function writeSettings(settings) {
  try {
    ensureDataDir();
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    console.log('Settings saved successfully');
    return true;
  } catch (error) {
    console.error('Error writing settings:', error);
    return false;
  }
}

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const settings = readSettings();
    res.json(settings);
  } catch (error) {
    console.error('Error in GET /api/settings:', error);
    res.json({});
  }
});

router.get('/:id', (req, res) => {
  try {
    const settings = readSettings();
    if (settings[req.params.id] !== undefined) {
      res.json({ [req.params.id]: settings[req.params.id] });
    } else {
      res.status(404).json({ error: 'Setting not found' });
    }
  } catch (error) {
    console.error('Error in GET /api/settings/:id:', error);
    res.status(500).json({ error: 'Failed to read setting' });
  }
});

router.put('/', (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Invalid settings data - expected object' });
    }
    
    const success = writeSettings(req.body);
    
    if (success) {
      const verifiedSettings = readSettings();
      
      const io = req.app.get('io');
      if (io) {
        io.emit('data-updated', { 
          collection: 'settings', 
          data: verifiedSettings,
          timestamp: Date.now()
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Settings updated', 
        settings: verifiedSettings 
      });
    } else {
      res.status(500).json({ error: 'Failed to save settings to disk' });
    }
  } catch (error) {
    console.error('Error in PUT /api/settings:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.put('/:id', (req, res) => {
  try {
    const settings = readSettings();
    if (settings[req.params.id] === undefined) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    settings[req.params.id] = req.body.value !== undefined ? req.body.value : req.body;
    
    if (writeSettings(settings)) {
      const io = req.app.get('io');
      if (io) {
        io.emit('data-updated', { 
          collection: 'settings', 
          data: settings,
          timestamp: Date.now()
        });
      }
      res.json({ success: true, message: 'Setting updated' });
    } else {
      res.status(500).json({ error: 'Failed to update setting' });
    }
  } catch (error) {
    console.error('Error in PUT /api/settings/:id:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const settings = readSettings();
    if (settings[req.params.id] === undefined) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    delete settings[req.params.id];
    
    if (writeSettings(settings)) {
      const io = req.app.get('io');
      if (io) {
        io.emit('data-updated', { 
          collection: 'settings', 
          data: settings,
          timestamp: Date.now()
        });
      }
      res.json({ success: true, message: 'Setting deleted' });
    } else {
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  } catch (error) {
    console.error('Error in DELETE /api/settings/:id:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

export default router;
