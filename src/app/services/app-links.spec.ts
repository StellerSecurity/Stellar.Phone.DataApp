import { internalAppRoute } from './app-links';
describe('first-party top-up navigation', () => {
  it('keeps official links inside the local app', () => {
    expect(internalAppRoute('https://data.stellarsecurity.com/topup/example', 'http://localhost:4173', 'topup')).toBe('/topup/example');
    expect(internalAppRoute('https://data.stellarsecurity.com/topup-checkout?order_id=example', 'http://localhost:4173', 'checkout')).toBe('/topup-checkout?order_id=example');
  });
  it('does not rewrite external origins or unrelated routes', () => {
    expect(internalAppRoute('https://example.com/topup/other', 'http://localhost:4173', 'topup')).toBe('');
    expect(internalAppRoute('https://data.stellarsecurity.com/other', 'http://localhost:4173', 'checkout')).toBe('');
    expect(internalAppRoute('/topup/a/nested', 'http://localhost:4173', 'topup')).toBe('');
  });
});
