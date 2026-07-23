import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const commonJsRequire = createRequire(import.meta.url);

describe('serverless runtime dependencies', () => {
  it('loads the Firebase authentication graph through CommonJS', () => {
    expect(() => commonJsRequire('jwks-rsa')).not.toThrow();
    expect(() => commonJsRequire('firebase-admin/app')).not.toThrow();
    expect(() => commonJsRequire('firebase-admin/auth')).not.toThrow();
    expect(() => commonJsRequire('firebase-admin/firestore')).not.toThrow();
  });
});
