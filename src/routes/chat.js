import express from 'express';
import jwtAuth from '../middleware/jwtAuth.js';
import ownerAuth from '../middleware/ownerAuth.js';
import fs from 'fs';
import path from 'path';
import { safeWriteJSON } from '../lib/fileUtils.js';

const router = express.Router();
const DB_FILE = path.resolve(process.cwd(), 'data', 'chat_db.json');

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) {
    return { messages: [] };
  }
}

function writeDB(db) {
  try {
    safeWriteJSON(DB_FILE, db);
  } catch (e) {
    console.error('chat write error', e);
  }
}

// Send a message: { fromUserId, toUserId, text }
router.post('/send', jwtAuth, ownerAuth({ body: 'fromUserId' }), (req, res) => {
  try {
    const { fromUserId, toUserId, text } = req.body;
    if (!fromUserId || !toUserId || !text) return res.status(400).json({ error: 'fromUserId, toUserId and text required' });
    const db = readDB();
    const msg = { id: `m-${Date.now()}`, from: String(fromUserId), to: String(toUserId), text, createdAt: new Date().toISOString(), read: false };
    db.messages = db.messages || [];
    db.messages.push(msg);
    writeDB(db);
    res.json({ ok: true, message: msg });
  } catch (e) {
    console.error('chat send error', e);
    res.status(500).json({ error: 'send failed', detail: e?.message });
  }
});

// Get messages between two users: ?userId & ?otherUserId
router.get('/messages', jwtAuth, ownerAuth({ query: 'userId' }), (req, res) => {
  const userId = req.query.userId;
  const otherUserId = req.query.otherUserId;
  if (!userId || !otherUserId) return res.status(400).json({ error: 'userId and otherUserId required' });
  const db = readDB();
  const msgs = (db.messages || []).filter(m => (m.from === String(userId) && m.to === String(otherUserId)) || (m.from === String(otherUserId) && m.to === String(userId))).sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(msgs);
});

// List conversations for a user (unique other participants with last message)
router.get('/conversations', jwtAuth, ownerAuth({ query: 'userId' }), (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const db = readDB();
  const map = {};
  (db.messages || []).forEach(m => {
    if (m.from === String(userId)) {
      map[m.to] = map[m.to] || [];
      map[m.to].push(m);
    } else if (m.to === String(userId)) {
      map[m.from] = map[m.from] || [];
      map[m.from].push(m);
    }
  });
  const convos = Object.keys(map).map(otherId => {
    const list = map[otherId].sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
    const last = list[list.length-1];
    return { otherUserId: otherId, lastMessage: last };
  }).sort((a,b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));
  res.json(convos);
});

export default router;
