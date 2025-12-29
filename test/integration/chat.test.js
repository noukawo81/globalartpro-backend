import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

describe('Chat API', () => {
  const alice = 'alice';
  const bob = 'bob';
  const aliceToken = jwt.sign({ id: alice }, JWT_SECRET);
  const bobToken = jwt.sign({ id: bob }, JWT_SECRET);

  beforeAll(async () => {
    // Ensure data directory exists and start fresh DB file
    const fs = await import('fs');
    const path = await import('path');
    const dbFile = path.resolve(process.cwd(), 'data', 'chat_db.json');
    try { fs.rmSync(dbFile); } catch (e) {}
  });

  test('POST /api/chat/send and GET messages between users', async () => {
    // Alice sends message to Bob
    const res1 = await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ fromUserId: alice, toUserId: bob, text: 'Hello Bob' });
    expect(res1.statusCode).toBe(200);
    expect(res1.body.ok).toBe(true);
    expect(res1.body.message.text).toBe('Hello Bob');

    // Bob sends reply
    const res2 = await request(app)
      .post('/api/chat/send')
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ fromUserId: bob, toUserId: alice, text: 'Hi Alice' });
    expect(res2.statusCode).toBe(200);

    // Alice fetches messages with Bob
    const res3 = await request(app)
      .get('/api/chat/messages')
      .set('Authorization', `Bearer ${aliceToken}`)
      .query({ userId: alice, otherUserId: bob });
    expect(res3.statusCode).toBe(200);
    expect(Array.isArray(res3.body)).toBe(true);
    expect(res3.body.length).toBeGreaterThanOrEqual(2);
    expect(res3.body.map(m => m.text)).toEqual(expect.arrayContaining(['Hello Bob', 'Hi Alice']));
  });
});
