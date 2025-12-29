import request from 'supertest';
import app from '../../src/index.js';

describe('CSP / security headers (dev expectations)', () => {
  test('GET /api/museum/globe should not include CSP report-only header in non-production (test env)', async () => {
    const res = await request(app).get('/api/museum/globe');
    expect(res.status).toBe(200);
    const headers = Object.keys(res.headers).map(h => h.toLowerCase());
    // Ensure noisy report-only headers are not present in dev/test
    expect(headers).not.toContain('content-security-policy-report-only');
    expect(headers).not.toContain('content-security-policy');
  });
});