import type { AutoTopupStatus } from './data-service-api.service';

type AutoTopupPricing = Pick<
  AutoTopupStatus,
  'amount_cents' | 'service_fee_cents' | 'total_amount_cents'
>;

function cents(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : null;
}

export function autoTopupPayableAmountCents(status: AutoTopupPricing | null): number | null {
  if (!status) {
    return null;
  }

  const total = cents(status.total_amount_cents);
  if (total !== null) {
    return total;
  }

  const amount = cents(status.amount_cents);
  const fee = cents(status.service_fee_cents);
  if (amount !== null && fee !== null) {
    return amount + fee;
  }

  return amount;
}
