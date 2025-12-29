import request from 'supertest';
import app from '../../src/index.js';

describe('Marketplace fees and distribution', () => {
  test('Buying an item applies platform (5%) and network (1.2%) fees and credits accounts accordingly', async () => {
    // Create buyer
    const r1 = await request(app).post('/api/auth/register').send({ name: 'Buyer Test', email: `buyer${Date.now()}@test`, password: 'password', role: 'visitor' });
    const tokenBuyer = r1.body?.token;
    const buyerId = r1.body?.user?.id;

    // Create seller (artist)
    const r2 = await request(app).post('/api/auth/register').send({ name: 'Seller Test', email: `seller${Date.now()}@test`, password: 'password', role: 'artist' });
    const tokenSeller = r2.body?.token;
    const sellerId = r2.body?.user?.id;

    // Ensure buyer has balance in ARTC
    await request(app).post('/api/wallet/recharge').set('Authorization', `Bearer ${tokenBuyer}`).send({ userId: buyerId, amount: 100 });

    // Seller lists a product
    const list = await request(app).post('/api/marketplace/list').set('Authorization', `Bearer ${tokenSeller}`).send({ artistId: sellerId, mediaId: 'm-1', title: 'For Sale', price: 10, baseCurrency: 'USD' });
    expect(list.status).toBe(201);
    const productId = list.body?.listing?.id;

    // Buyer buys the product for 10 ARTC
    const buy = await request(app).post('/api/marketplace/buy').set('Authorization', `Bearer ${tokenBuyer}`).send({ userId: buyerId, sellerId, productId, amount: 10, token: 'ARTC' });
    expect(buy.status).toBe(200);
    expect(buy.body).toBeTruthy();
    expect(buy.body.fees).toBeTruthy();

    const { platformFee, networkFee, sellerProceeds } = buy.body.fees;
    // Expected values
    const expectedPlatform = +(10 * 0.05).toFixed(6);
    const expectedNetwork = +(10 * 0.012).toFixed(6);
    const expectedSeller = +(10 - expectedPlatform - expectedNetwork).toFixed(6);

    expect(platformFee).toBeCloseTo(expectedPlatform);
    expect(networkFee).toBeCloseTo(expectedNetwork);
    expect(sellerProceeds).toBeCloseTo(expectedSeller);

    // Check balances
    const buyerBal = await request(app).get('/api/wallet/balance').set('Authorization', `Bearer ${tokenBuyer}`).query({ userId: buyerId });
    const sellerBal = await request(app).get('/api/wallet/balance').set('Authorization', `Bearer ${tokenSeller}`).query({ userId: sellerId });
    const platformBal = await request(app).get('/api/wallet/balance').set('Authorization', `Bearer ${tokenSeller}`).query({ userId: 'platform' });
    const networkBal = await request(app).get('/api/wallet/balance').set('Authorization', `Bearer ${tokenSeller}`).query({ userId: 'network' });

    expect(buyerBal.body.balances.ARTC).toBeLessThanOrEqual(90);
    expect(sellerBal.body.balances.ARTC).toBeCloseTo(sellerProceeds);
    expect(platformBal.body.balances.ARTC).toBeCloseTo(platformFee);
    expect(networkBal.body.balances.ARTC).toBeCloseTo(networkFee);
  });
});
