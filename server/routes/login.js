import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the root directory (one level up from server)
// This matches what index.js does
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

// Also try loading from current directory as fallback
// This handles cases where the server is run from different locations
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  // Try loading from the root directory
  dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
}

const router = express.Router();

// Read login credentials from environment variables ONLY
function readLogin() {
  try {
    // Force reload the environment variables
    const username = process.env.ADMIN_USERNAME;
    const password = process.env.ADMIN_PASSWORD;
    
    console.log('🔍 [login.js] Checking environment variables:');
    console.log('   __dirname:', __dirname);
    console.log('   .env path attempted:', path.join(__dirname, '..', '..', '.env'));
    console.log('   ADMIN_USERNAME:', username ? '✅ Set' : '❌ Not set');
    console.log('   ADMIN_PASSWORD:', password ? '✅ Set' : '❌ Not set');
    
    if (!username || !password) {
      console.error('❌ ADMIN_USERNAME or ADMIN_PASSWORD is not set in environment variables');
      return null;
    }
    
    console.log('✅ Using admin credentials from environment variables');
    return { username, password };
  } catch (error) {
    console.error('❌ Error reading login from environment:', error);
    return null;
  }
}

// GET - Check if login is configured
router.get('/', (req, res) => {
  console.log('📡 GET /api/login');
  try {
    const login = readLogin();
    if (!login) {
      return res.status(404).json({ 
        success: false, 
        message: 'Login configuration not found. Please set ADMIN_USERNAME and ADMIN_PASSWORD in .env file.' 
      });
    }
    res.json({ username: login.username });
  } catch (error) {
    console.error('❌ Error in GET /api/login:', error);
    res.status(500).json({ error: 'Failed to read login data' });
  }
});

// POST - Verify login credentials
router.post('/verify', (req, res) => {
  console.log('📡 POST /api/login/verify');
  console.log('📝 Request body:', req.body);
  
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }
    
    const login = readLogin();
    if (!login) {
      return res.status(404).json({ 
        success: false, 
        message: 'Login configuration not found. Please set ADMIN_USERNAME and ADMIN_PASSWORD in .env file.' 
      });
    }
    
    const isValid = username === login.username && password === login.password;
    
    if (isValid) {
      console.log('✅ Login successful for user:', username);
      res.json({ 
        success: true, 
        message: 'Login successful',
        username: login.username
      });
    } else {
      console.log('❌ Login failed - Invalid credentials for user:', username);
      res.status(401).json({ 
        success: false, 
        message: 'Invalid username or password' 
      });
    }
  } catch (error) {
    console.error('❌ Error in POST /api/login/verify:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// POST - Check if login credentials are configured
router.post('/status', (req, res) => {
  console.log('📡 POST /api/login/status');
  
  try {
    const login = readLogin();
    
    if (login && login.username && login.password) {
      res.json({ 
        configured: true,
        valid: true,
        username: login.username,
        source: 'environment-variables'
      });
    } else {
      res.json({ 
        configured: false,
        valid: false,
        message: 'ADMIN_USERNAME and ADMIN_PASSWORD must be set in environment variables (.env file)',
        source: 'environment-variables',
        help: 'Add these to your .env file: ADMIN_USERNAME=admin ADMIN_PASSWORD=your_password'
      });
    }
  } catch (error) {
    console.error('❌ Error in POST /api/login/status:', error);
    res.status(500).json({ 
      configured: false,
      valid: false,
      message: 'Server error' 
    });
  }
});

export default router;