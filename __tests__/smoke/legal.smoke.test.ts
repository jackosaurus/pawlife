/**
 * Smoke test: live privacy policy URL must return HTTP 200.
 *
 * App Store submission silently rejects builds whose privacy URL is
 * unreachable. This test catches breakage (DNS, GitHub Pages outage,
 * accidental URL change) before we hit submission.
 *
 * Excluded from the default `npx jest` run because it depends on the
 * network. Run on demand:
 *   npx jest __tests__/smoke
 *   npm run test:smoke
 */
import { PRIVACY_POLICY_URL } from '@/constants/legal';

jest.setTimeout(10_000);

/**
 * Issue a HEAD request and resolve with the status code. Uses the
 * global `fetch` when available (Node 18+, Expo runtime); falls back
 * to `node:https` otherwise so the test stays robust across envs.
 */
async function headStatus(url: string): Promise<number> {
  if (typeof fetch === 'function') {
    const res = await fetch(url, { method: 'HEAD' });
    return res.status;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const https = require('node:https');
  return await new Promise<number>((resolve, reject) => {
    const req = https.request(url, { method: 'HEAD' }, (res: { statusCode?: number }) => {
      resolve(res.statusCode ?? 0);
    });
    req.on('error', reject);
    req.end();
  });
}

describe('legal smoke tests', () => {
  it('privacy policy URL returns 200', async () => {
    const status = await headStatus(PRIVACY_POLICY_URL);
    expect(status).toBe(200);
  });
});
