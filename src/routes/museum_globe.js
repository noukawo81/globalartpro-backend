import express from 'express';
import fs from 'fs';
import path from 'path';
import { safeWriteJSON } from '../lib/fileUtils.js';
import jwtAuth from '../middleware/jwtAuth.js';

const router = express.Router();
const DB_FILE = path.resolve(process.cwd(), 'data', 'museum_globe.json');

function readGlobe() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeGlobe(db) {
  try {
    safeWriteJSON(DB_FILE, db);
  } catch (e) {
    console.error('museum_globe write error', e);
  }
}

function requireCurator(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authorization required' });
  const role = req.user.role || null;
  if (role !== 'curator' && role !== 'admin') return res.status(403).json({ error: 'forbidden: curator role required' });
  return next();
}

// GET /api/museum/globe
router.get('/', (req, res) => {
  const { circle, q } = req.query || {};
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  const offset = parseInt(req.query.offset) || 0;
  let items = readGlobe() || [];
  if (circle) {
    const c = String(circle).toLowerCase();
    items = items.filter(i => String(i.circle || '').toLowerCase() === c);
  }
  if (q) {
    const qq = String(q).toLowerCase();
    items = items.filter(i => (i.title || '').toLowerCase().includes(qq) || (i.description || '').toLowerCase().includes(qq) || (i.origin || '').toLowerCase().includes(qq));
  }
  const total = items.length;
  const page = items.slice(offset, offset + limit);
  res.json({ total, items: page });
});

// GET /api/museum/globe/:id
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const items = readGlobe();
  const found = items.find(i => String(i.id) === String(id));
  if (!found) return res.status(404).json({ error: 'not found' });
  res.json({ item: found });
});

// Admin endpoints
router.post('/', jwtAuth, requireCurator, (req, res) => {
  const payload = req.body || {};
  if (!payload.title || !payload.circle || !payload.media || !payload.media.length) return res.status(400).json({ error: 'title, circle and media required' });
  const items = readGlobe();
  const id = payload.id || `g-${Date.now()}`;
  const item = { id, ...payload };
  items.push(item);
  writeGlobe(items);
  res.status(201).json({ ok: true, item });
});

router.put('/:id', jwtAuth, requireCurator, (req, res) => {
  const id = req.params.id;
  const payload = req.body || {};
  const items = readGlobe();
  const idx = items.findIndex(i => String(i.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  items[idx] = { ...items[idx], ...payload, id };
  writeGlobe(items);
  res.json({ ok: true, item: items[idx] });
});

router.delete('/:id', jwtAuth, requireCurator, (req, res) => {
  const id = req.params.id;
  let items = readGlobe();
  const idx = items.findIndex(i => String(i.id) === String(id));
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const removed = items.splice(idx, 1)[0];
  writeGlobe(items);
  res.json({ ok: true, removed });
});

export default router;
