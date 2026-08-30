import { autoTopupPayableAmountCents } from './auto-topup-pricing';

describe('autoTopupPayableAmountCents', () => {
  it('uses the authoritative fee-inclusive total', () => {
    expect(autoTopupPayableAmountCents({
      amount_cents: 1000,
      service_fee_cents: 15,
      total_amount_cents: 1015,
    })).toBe(1015);
  });

  it('derives a total from base and fee for a mixed-version response', () => {
    expect(autoTopupPayableAmountCents({
      amount_cents: 99,
      service_fee_cents: 100,
      total_amount_cents: null,
    })).toBe(199);
  });

  it('falls back to the base amount for an older API response', () => {
    expect(autoTopupPayableAmountCents({ amount_cents: 538 })).toBe(538);
  });
});
