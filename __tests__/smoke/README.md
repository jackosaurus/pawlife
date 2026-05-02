# Smoke tests

These tests hit **live URLs** and depend on the network. They are
**excluded from the default `npx jest` run** so offline development
and any future CI runs without internet stay green.

## Running

```bash
npm run test:smoke   # recommended — overrides the ignore pattern
```

The smoke directory is in `testPathIgnorePatterns`, so a bare
`npx jest __tests__/smoke` matches zero tests. The npm script
overrides the ignore list. If invoking jest directly, pass:

```bash
npx jest __tests__/smoke \
  --testPathIgnorePatterns=/node_modules/ \
  --testPathIgnorePatterns=/.claude/
```

## What's here

- `legal.smoke.test.ts` — asserts `PRIVACY_POLICY_URL`
  (`constants/legal.ts`) returns HTTP 200. App Store submission
  silently rejects builds with an unreachable privacy link, so this
  guards against DNS / GitHub Pages / accidental URL changes.

## Pre-App-Store-submission checklist

Run `npm run test:smoke` before every TestFlight / App Store
submission. A red smoke test = do not submit.
