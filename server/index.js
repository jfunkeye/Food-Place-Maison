import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

import { readJSON, writeJSON } from './utils/fileHelpers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

import mealsRoutes from './routes/meals.js';
import categoriesRoutes from './routes/categories.js';
import extrasRoutes from './routes/extras.js';
import settingsRoutes from './routes/settings.js';
import reviewsRoutes from './routes/reviews.js';
import galleryRoutes from './routes/gallery.js';
import loginRoutes from './routes/login.js';

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [ 'https://food-place-maison.vercel.app', 'http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.options('*', cors());
app.use(express.json({ limit: '50mb' }));

const DATA_DIR = path.join(__dirname, process.env.DATA_DIR || 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Register routes
app.use('/api/meals', mealsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/extras', extrasRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reviews', reviewsRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/login', loginRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    status: 'Server is running!', 
    timestamp: new Date().toISOString(),
    dataDir: DATA_DIR,
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

// Debug settings endpoint
app.get('/api/debug/settings', (req, res) => {
  const settingsPath = path.join(DATA_DIR, 'settings.json');
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      res.json({
        fileExists: true,
        content: JSON.parse(data),
        filePath: settingsPath
      });
    } else {
      res.json({
        fileExists: false,
        message: 'Settings file does not exist',
        filePath: settingsPath
      });
    }
  } catch (error) {
    res.status(500).json({
      error: error.message,
      filePath: settingsPath
    });
  }
});

// Bulk import/export
app.post('/api/restore', (req, res) => {
  const { meals, categories, extras, settings, reviews, gallery } = req.body;
  const DATA_FILES = {
    meals: path.join(DATA_DIR, 'menu.json'),
    categories: path.join(DATA_DIR, 'categories.json'),
    extras: path.join(DATA_DIR, 'extras.json'),
    settings: path.join(DATA_DIR, 'settings.json'),
    reviews: path.join(DATA_DIR, 'reviews.json'),
    gallery: path.join(DATA_DIR, 'gallery.json'),
  };
  
  try {
    if (meals) writeJSON(DATA_FILES.meals, meals);
    if (categories) writeJSON(DATA_FILES.categories, categories);
    if (extras) writeJSON(DATA_FILES.extras, extras);
    if (settings) writeJSON(DATA_FILES.settings, settings);
    if (reviews) writeJSON(DATA_FILES.reviews, reviews);
    if (gallery) writeJSON(DATA_FILES.gallery, gallery);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('data-updated', { collection: 'meals', data: meals });
      io.emit('data-updated', { collection: 'categories', data: categories });
      io.emit('data-updated', { collection: 'extras', data: extras });
      io.emit('data-updated', { collection: 'settings', data: settings });
      io.emit('data-updated', { collection: 'reviews', data: reviews });
      io.emit('data-updated', { collection: 'gallery', data: gallery });
    }
    
    res.json({ success: true, message: 'All data restored' });
  } catch (error) {
    console.error('Restore error:', error);
    res.status(500).json({ error: 'Failed to restore data' });
  }
});

app.get('/api/export', (req, res) => {
  const DATA_FILES = {
    meals: path.join(DATA_DIR, 'menu.json'),
    categories: path.join(DATA_DIR, 'categories.json'),
    extras: path.join(DATA_DIR, 'extras.json'),
    settings: path.join(DATA_DIR, 'settings.json'),
    reviews: path.join(DATA_DIR, 'reviews.json'),
    gallery: path.join(DATA_DIR, 'gallery.json'),
  };
  
  const data = {};
  Object.entries(DATA_FILES).forEach(([key, filePath]) => {
    data[key] = readJSON(filePath) || [];
  });
  res.json(data);
});

// WebSocket setup
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

app.use((req, res, next) => {
  req.io = io;
  next();
});

const connectedClients = new Set();

io.on('connection', (socket) => {
  connectedClients.add(socket.id);

  socket.on('data-changed', ({ collection, data, timestamp }) => {
    const DATA_FILES = {
      meals: path.join(DATA_DIR, 'menu.json'),
      categories: path.join(DATA_DIR, 'categories.json'),
      extras: path.join(DATA_DIR, 'extras.json'),
      settings: path.join(DATA_DIR, 'settings.json'),
      reviews: path.join(DATA_DIR, 'reviews.json'),
      gallery: path.join(DATA_DIR, 'gallery.json'),
    };
    
    const filePath = DATA_FILES[collection];
    if (filePath) {
      const success = writeJSON(filePath, data);
      if (success) {
        io.emit('data-updated', { 
          collection, 
          data, 
          timestamp: timestamp || Date.now(),
          source: socket.id 
        });
      } else {
        socket.emit('data-error', { 
          collection, 
          message: `Failed to save ${collection} to disk` 
        });
      }
    } else {
      socket.emit('data-error', { 
        collection, 
        message: `Unknown collection: ${collection}` 
      });
    }
  });

  socket.on('refresh-data', async ({ collection }) => {
    try {
      const DATA_FILES = {
        meals: path.join(DATA_DIR, 'menu.json'),
        categories: path.join(DATA_DIR, 'categories.json'),
        extras: path.join(DATA_DIR, 'extras.json'),
        settings: path.join(DATA_DIR, 'settings.json'),
        reviews: path.join(DATA_DIR, 'reviews.json'),
        gallery: path.join(DATA_DIR, 'gallery.json'),
      };
      
      const filePath = DATA_FILES[collection];
      if (filePath && fs.existsSync(filePath)) {
        const data = readJSON(filePath);
        socket.emit('data-updated', { 
          collection, 
          data,
          timestamp: Date.now(),
          source: 'server-refresh'
        });
      }
    } catch (error) {
      console.error(`Error refreshing ${collection}:`, error);
      socket.emit('data-error', { 
        collection, 
        message: `Error refreshing ${collection}` 
      });
    }
  });

  socket.on('disconnect', () => {
    connectedClients.delete(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
