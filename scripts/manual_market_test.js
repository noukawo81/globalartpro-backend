import request from 'supertest';
import app from '../src/index.js';

(async function(){
  try {
    const r1 = await request(app).post('/api/auth/register').send({ name: 'Buyer Test', email: `buyer${Date.now()}@test`, password: 'password', role: 'visitor' });
    const tokenBuyer = r1.body?.token;
    const buyerId = r1.body?.user?.id;

    const r2 = await request(app).post('/api/auth/register').send({ name: 'Seller Test', email: `seller${Date.now()}@test`, password: 'password', role: 'artist' });
    const tokenSeller = r2.body?.token;
    const sellerId = r2.body?.user?.id;

    console.log('created buyer', buyerId, 'seller', sellerId);

    await request(app).post('/api/wallet/recharge').set('Authorization', `Bearer ${tokenBuyer}`).send({ userId: buyerId, amount: 100 });

    const list = await request(app).post('/api/marketplace/list').set('Authorization', `Bearer ${tokenSeller}`).send({ artistId: sellerId, mediaId: 'm-1', title: 'For Sale', price: 10, baseCurrency: 'USD' });
    console.log('list status', list.status, 'body', list.body);
    const productId = list.body?.listing?.id || 'prod-1';

    const buy = await request(app).post('/api/marketplace/buy').set('Authorization', `Bearer ${tokenBuyer}`).send({ userId: buyerId, sellerId, productId, amount: 10, token: 'ARTC' });
    console.log('buy status', buy.status, 'body', buy.body);
  } catch (e) {
    console.error('manual run error', e && e.stack ? e.stack : e);
  }
})();
