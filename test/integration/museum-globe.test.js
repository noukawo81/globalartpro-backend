import request from 'supertest';
import app from '../../src/index.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/middleware/jwtAuth.js';

function makeToken(id, role = 'curator') {
  return jwt.sign({ id, role }, JWT_SECRET);
}

describe('Museum Globe API', () => {
  test('GET /api/museum/globe returns list with total >= 10', async () => {
    const res = await request(app).get('/api/museum/globe');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(10);
    expect(Array.isArray(res.body.items)).toBeTruthy();
  });

  test('GET /api/museum/globe?circle=Racines filters results', async () => {
    const res = await request(app).get('/api/museum/globe').query({ circle: 'Racines' });
    expect(res.status).toBe(200);
    expect(res.body.items.every(i => i.circle === 'Racines')).toBeTruthy();
  });

  test('GET /api/museum/globe/:id returns an item', async () => {
    const list = await request(app).get('/api/museum/globe');
    const id = list.body.items[0].id;
    const r = await request(app).get(`/api/museum/globe/${id}`);
    expect(r.status).toBe(200);
    expect(r.body.item).toBeDefined();
    expect(r.body.item.id).toBe(id);
  });

  test('POST /api/museum/globe requires curator role', async () => {
    const payload = { title: 'Test Art', circle: 'Futur', media: [{ type: 'image', url: '/data/test.jpg' }] };
    const resNoAuth = await request(app).post('/api/museum/globe').send(payload);
    expect(resNoAuth.status).toBe(401);

    const token = makeToken('cur-1', 'curator');
    const resAuth = await request(app).post('/api/museum/globe').set('Authorization', `Bearer ${token}`).send(payload);
    expect(resAuth.status).toBe(201);
    expect(resAuth.body.item).toBeTruthy();
    // cleanup
    const createdId = resAuth.body.item.id;
    await request(app).delete(`/api/museum/globe/${createdId}`).set('Authorization', `Bearer ${token}`);
  }, 60000);
});
