import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, process.env.DATA_DIR || '/data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');

// Ensure data directory exists
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log('📁 Created data directory:', DATA_DIR);
  }
}

// Read settings from file
function readSettings() {
  ensureDataDir();
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      console.log('⚠️ Settings file does not exist yet');
      return {};
    }
    const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading settings:', error);
    return {};
  }
}

// Write settings to file with verification
function writeSettings(settings) {
  try {
    ensureDataDir();
    
    console.log('💾 Writing settings to disk...');
    console.log('📦 Settings data:', JSON.stringify(settings, null, 2));
    
    // Write directly to file
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    
    // Verify the file was written correctly by reading it back
    const verifyData = fs.readFileSync(SETTINGS_FILE, 'utf8');
    JSON.parse(verifyData);
    
    console.log('✅ Settings saved successfully to:', SETTINGS_FILE);
    return true;
  } catch (error) {
    console.error('❌ Error writing settings:', error);
    return false;
  }
}

const router = express.Router();

// GET all settings
router.get('/', (req, res) => {
  console.log('📡 GET /api/settings');
  try {
    const settings = readSettings();
    console.log('✅ Returning settings');
    res.json(settings);
  } catch (error) {
    console.error('❌ Error in GET /api/settings:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// GET single setting
router.get('/:id', (req, res) => {
  try {
    const settings = readSettings();
    if (settings[req.params.id] !== undefined) {
      res.json({ [req.params.id]: settings[req.params.id] });
    } else {
      res.status(404).json({ error: 'Setting not found' });
    }
  } catch (error) {
    console.error('❌ Error in GET /api/settings/:id:', error);
    res.status(500).json({ error: 'Failed to read setting' });
  }
});

// PUT - update entire settings object
router.put('/', (req, res) => {
  console.log('📝 ========================================');
  console.log('📝 Received settings update request');
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  console.log('📝 ========================================');
  
  try {
    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ Invalid request body - expected object');
      return res.status(400).json({ error: 'Invalid settings data - expected object' });
    }
    
    // Write directly to disk
    const success = writeSettings(req.body);
    
    if (success) {
      // Read back to verify
      const verifiedSettings = readSettings();
      console.log('✅ Settings saved and verified');
      console.log('📝 Final settings on disk:', JSON.stringify(verifiedSettings, null, 2));
      console.log('📝 ========================================');
      
      // Broadcast to ALL clients via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.emit('data-updated', { 
          collection: 'settings', 
          data: verifiedSettings,
          timestamp: Date.now()
        });
        console.log('📡 Settings broadcasted to all connected clients');
      } else {
        console.warn('⚠️ WebSocket instance not found in app');
      }
      
      res.json({ 
        success: true, 
        message: 'Settings updated', 
        settings: verifiedSettings 
      });
    } else {
      console.error('❌ Failed to save settings - writeSettings returned false');
      console.log('📝 ========================================');
      res.status(500).json({ error: 'Failed to save settings to disk' });
    }
  } catch (error) {
    console.error('❌ Error in PUT /api/settings:', error);
    console.log('📝 ========================================');
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// PUT - update specific setting by id
router.put('/:id', (req, res) => {
  try {
    const settings = readSettings();
    if (settings[req.params.id] === undefined) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    settings[req.params.id] = req.body.value !== undefined ? req.body.value : req.body;
    
    if (writeSettings(settings)) {
      // Broadcast to ALL clients via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.emit('data-updated', { 
          collection: 'settings', 
          data: settings,
          timestamp: Date.now()
        });
        console.log('📡 Settings broadcasted to all connected clients');
      }
      res.json({ success: true, message: 'Setting updated' });
    } else {
      res.status(500).json({ error: 'Failed to update setting' });
    }
  } catch (error) {
    console.error('❌ Error in PUT /api/settings/:id:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

// DELETE - reset to defaults (remove the setting)
router.delete('/:id', (req, res) => {
  try {
    const settings = readSettings();
    if (settings[req.params.id] === undefined) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    delete settings[req.params.id];
    
    if (writeSettings(settings)) {
      // Broadcast to ALL clients via WebSocket
      const io = req.app.get('io');
      if (io) {
        io.emit('data-updated', { 
          collection: 'settings', 
          data: settings,
          timestamp: Date.now()
        });
        console.log('📡 Settings broadcasted to all connected clients');
      }
      res.json({ success: true, message: 'Setting deleted' });
    } else {
      res.status(500).json({ error: 'Failed to delete setting' });
    }
  } catch (error) {
    console.error('❌ Error in DELETE /api/settings/:id:', error);
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
});

export default router;
