import request from 'supertest';
import app from '../src/index.js';

async function run() {
  console.log('[debug] start');
  const r1 = await request(app).post('/api/auth/register').send({ name: 'Buyer Debug', email: `buyer-debug-${Date.now()}@test`, password: 'password', role: 'visitor' });
  console.log('[debug] buyer register', r1.status, r1.body?.user?.id);
  const tokenBuyer = r1.body?.token, buyerId = r1.body?.user?.id;

  const r2 = await request(app).post('/api/auth/register').send({ name: 'Seller Debug', email: `seller-debug-${Date.now()}@test`, password: 'password', role: 'artist' });
  console.log('[debug] seller register', r2.status, r2.body?.user?.id);
  const tokenSeller = r2.body?.token, sellerId = r2.body?.user?.id;

  const r3 = await request(app).post('/api/wallet/recharge').set('Authorization', `Bearer ${tokenBuyer}`).send({ userId: buyerId, amount: 100 });
  console.log('[debug] recharge', r3.status, r3.body);

  const list = await request(app).post('/api/marketplace/list').set('Authorization', `Bearer ${tokenSeller}`).send({ artistId: sellerId, mediaId: 'm-1', title: 'For Sale', price: 10, baseCurrency: 'USD' });
  console.log('[debug] list', list.status, list.body?.listing?.id);

  const buy = await request(app).post('/api/marketplace/buy').set('Authorization', `Bearer ${tokenBuyer}`).send({ userId: buyerId, sellerId, productId: list.body?.listing?.id, amount: 10, token: 'ARTC' });
  console.log('[debug] buy', buy.status, buy.body);

  process.exit(0);
}

run().catch(e => {
  console.error('[debug] error', e && e.stack);
  process.exit(1);
});