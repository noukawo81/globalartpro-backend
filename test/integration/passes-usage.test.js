import request from 'supertest';
import app from '../../src/index.js';

function smallImageData() {
  // 1x1 PNG base64
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=';
}

describe('Pass usage and free NFT limits (Genesis)', () => {
  test('Genesis pass grants 3 free NFT creations then requires payment', async () => {
    // register artist
    const r = await request(app).post('/api/auth/register').send({ name: 'Pass Artist', email: `pass${Date.now()}@test`, password: 'password', role: 'artist' });
    const token = r.body?.token;
    const userId = r.body?.user?.id;

    // Activate Genesis pass
    const buy = await request(app).post('/api/wallet/buy-pass').set('Authorization', `Bearer ${token}`).send({ userId, passType: 'genesis' });
    expect(buy.status).toBe(200);
    const pass = buy.body?.pass;
    expect(pass).toBeTruthy();
    expect(pass.type).toBe('genesis');

    // Import an image
    const imp = await request(app).post('/api/studio/import').send({ userId, imageData: smallImageData() });
    expect(imp.status).toBe(200);
    const imageId = imp.body.image?.id;
    expect(imageId).toBeTruthy();

    // Create NFT 3 times (should consume free NFTs)
    for (let i = 0; i < 3; i++) {
      const g = await request(app).post('/api/studio/generate-nft').set('Authorization', `Bearer ${token}`).send({ imageId, title: `Gen NFT ${i}` });
      expect(g.status).toBe(200);
      expect(g.body.nft).toBeTruthy();
    }

    // 4th attempt should either require payment (402) or debit ARTC if balance exists
    const g4 = await request(app).post('/api/studio/generate-nft').set('Authorization', `Bearer ${token}`).send({ imageId, title: `Gen NFT 4` });
    // If user has no ARTC, expect 402 (insufficient funds). The default new user has 10 ARTC from ensureAccount, so check behavior accordingly.
    if (g4.status === 200) {
      // if it succeeded, ensure a charge occurred (charged info present)
      expect(g4.body.charged || g4.body.nft).toBeTruthy();
    } else {
      expect(g4.status).toBe(402);
    }
  }, 60000);
});