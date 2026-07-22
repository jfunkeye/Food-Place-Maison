import { readJSON, writeJSON } from '../index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, process.env.DATA_DIR || '../data');

export const createCRUDController = (collection, defaultData = []) => {
  const filePath = path.join(DATA_DIR, `${collection}.json`);

  if (!fs.existsSync(filePath)) {
    writeJSON(filePath, defaultData);
  }

  return {
    getAll: (req, res) => {
      const data = readJSON(filePath) || [];
      res.json(data);
    },

    getOne: (req, res) => {
      const data = readJSON(filePath) || [];
      const item = data.find(item => item.id === req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Item not found' });
      }
      res.json(item);
    },

    create: (req, res) => {
      const data = readJSON(filePath) || [];
      const newItem = { 
        ...req.body, 
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` 
      };
      data.push(newItem);
      if (writeJSON(filePath, data)) {
        res.status(201).json(newItem);
      } else {
        res.status(500).json({ error: 'Failed to create item' });
      }
    },

    update: (req, res) => {
      const data = readJSON(filePath) || [];
      const index = data.findIndex(item => item.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Item not found' });
      }
      data[index] = { ...data[index], ...req.body, id: req.params.id };
      if (writeJSON(filePath, data)) {
        res.json(data[index]);
      } else {
        res.status(500).json({ error: 'Failed to update item' });
      }
    },

    replaceAll: (req, res) => {
      if (Array.isArray(req.body)) {
        if (writeJSON(filePath, req.body)) {
          res.json({ success: true, message: `${collection} updated` });
        } else {
          res.status(500).json({ error: 'Failed to update collection' });
        }
      } else if (typeof req.body === 'object' && req.body !== null) {
        if (writeJSON(filePath, req.body)) {
          res.json({ success: true, message: `${collection} updated` });
        } else {
          res.status(500).json({ error: 'Failed to update collection' });
        }
      } else {
        return res.status(400).json({ error: 'Expected array or object' });
      }
    },

    delete: (req, res) => {
      const data = readJSON(filePath) || [];
      const filtered = data.filter(item => item.id !== req.params.id);
      if (filtered.length === data.length) {
        return res.status(404).json({ error: 'Item not found' });
      }
      if (writeJSON(filePath, filtered)) {
        res.json({ success: true, message: 'Item deleted' });
      } else {
        res.status(500).json({ error: 'Failed to delete item' });
      }
    }
  };
};