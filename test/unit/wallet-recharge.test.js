import request from 'supertest';
import app from '../../src/index.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../src/middleware/jwtAuth.js';

function makeToken(id, role = 'artist') {
  return jwt.sign({ id, role }, JWT_SECRET);
}

describe('Wallet recharge behaviour', () => {
  test('POST /api/wallet/recharge sets ARTC balance (replaces, not adds)', async () => {
    const userId = 'recharge-user-1';
    const token = makeToken(userId);

    // ensure initial balance (ensureAccount should create it)
    const bal1 = await request(app).get('/api/wallet/balance').set('Authorization', `Bearer ${token}`).query({ userId });
    expect(bal1.statusCode).toBe(200);
    expect(bal1.body.balances).toBeDefined();
    expect(bal1.body.balances.ARTC).toBeDefined();

    // Set recharge to 50
    const r = await request(app).post('/api/wallet/recharge').set('Authorization', `Bearer ${token}`).send({ userId, amount: 50 });
    expect(r.statusCode).toBe(200);
    expect(r.body.ok).toBeTruthy();
    expect(r.body.amount).toBe(50);
    expect(r.body.balance.ARTC).toBe(50);

    // Recharge again with smaller amount -> should replace (set) to 10
    const r2 = await request(app).post('/api/wallet/recharge').set('Authorization', `Bearer ${token}`).send({ userId, amount: 10 });
    expect(r2.statusCode).toBe(200);
    expect(r2.body.ok).toBeTruthy();
    expect(r2.body.amount).toBe(10);
    expect(r2.body.balance.ARTC).toBe(10);
  });
});
