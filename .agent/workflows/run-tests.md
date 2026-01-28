---
description: Run all tests to verify code quality
---

# Run All Tests

Execute these commands to verify the codebase is healthy:

// turbo-all

1. Run unit tests:
```bash
npm test
```
Expected: 21 tests passing

2. Run E2E tests:
```bash
npm run test:e2e
```
Expected: 19 tests passing

3. Run build check:
```bash
npm run build
```
Expected: Build succeeds without errors

## Summary
- Total tests: 40 (21 unit + 19 E2E)
- All must pass before deploying
