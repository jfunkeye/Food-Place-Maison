import express from 'express';
import { createCRUDController } from '../controllers/crudController.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const defaultDataPath = path.join(DATA_DIR, 'reviews.json');
let defaultData = [];
try {
  const data = fs.readFileSync(defaultDataPath, 'utf8');
  defaultData = JSON.parse(data);
} catch (error) {
  console.error('Error loading default reviews data:', error);
}

const router = express.Router();
const controller = createCRUDController('reviews', defaultData);

router.get('/', controller.getAll);
router.get('/:id', controller.getOne);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.put('/', controller.replaceAll);
router.delete('/:id', controller.delete);

export default router;