import { decodeJwt } from './jwt';

// Helper: create a fake JWT with the given payload
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-signature`;
}

describe('decodeJwt', () => {
  it('decodes a valid JWT payload', () => {
    const payload = {
      sub: 'marko.petrovic@banka.rs',
      role: 'ADMIN',
      active: true,
      exp: 9999999999,
      iat: 1000000000,
    };
    const token = makeJwt(payload);
    const result = decodeJwt(token);

    expect(result).not.toBeNull();
    expect(result!.sub).toBe('marko.petrovic@banka.rs');
    expect(result!.role).toBe('ADMIN');
    expect(result!.active).toBe(true);
    expect(result!.exp).toBe(9999999999);
    expect(result!.iat).toBe(1000000000);
  });

  it('returns null for an invalid token (not base64)', () => {
    expect(decodeJwt('not-a-valid-jwt')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(decodeJwt('')).toBeNull();
  });

  it('returns null for a token with invalid JSON in payload', () => {
    const header = btoa('{"alg":"HS256"}');
    const body = btoa('this is not json');
    expect(decodeJwt(`${header}.${body}.sig`)).toBeNull();
  });

  it('handles base64url characters (- and _)', () => {
    // Create payload with characters that produce base64url encoding
    const payload = { sub: 'test@test.com', role: 'CLIENT', active: true, exp: 1, iat: 1 };
    const json = JSON.stringify(payload);
    // Standard base64 then convert to base64url
    const base64 = btoa(json);
    const base64url = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const header = btoa('{"alg":"HS256"}');
    const token = `${header}.${base64url}.sig`;

    const result = decodeJwt(token);
    expect(result).not.toBeNull();
    expect(result!.sub).toBe('test@test.com');
  });

  it('decodes JWT with CLIENT role', () => {
    const payload = { sub: 'klijent@banka.rs', role: 'CLIENT', active: false, exp: 100, iat: 50 };
    const result = decodeJwt(makeJwt(payload));
    expect(result).not.toBeNull();
    expect(result!.role).toBe('CLIENT');
    expect(result!.active).toBe(false);
  });

  it('decodes JWT with EMPLOYEE role', () => {
    const payload = { sub: 'zaposleni@banka.rs', role: 'EMPLOYEE', active: true, exp: 200, iat: 100 };
    const result = decodeJwt(makeJwt(payload));
    expect(result).not.toBeNull();
    expect(result!.role).toBe('EMPLOYEE');
  });
});
