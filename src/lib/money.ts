/**
 * Money helpers. All amounts are integer minor units (cents). No floating-point math on money.
 * Safe to import from client components.
 */

const MINOR_DIGITS: Record<string, number> = { USD: 2, EUR: 2, GBP: 2, PHP: 2, AUD: 2, CAD: 2, JPY: 0 };

export function minorDigits(currency: string): number {
  return MINOR_DIGITS[currency.toUpperCase()] ?? 2;
}

export function assertMinor(amount: number): number {
  if (!Number.isSafeInteger(amount)) throw new Error(`Money must be an integer number of minor units, got ${amount}`);
  return amount;
}

/** Format for humans: 150000 USD → "$1,500.00" (display only). */
export function formatMoney(amountMinor: number | null | undefined, currency = "USD"): string {
  if (amountMinor == null) return "—";
  const digits = minorDigits(currency);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amountMinor / 10 ** digits);
}

/** Compact display for dashboards: 150000 → "$1.5K" */
export function formatMoneyCompact(amountMinor: number, currency = "USD"): string {
  const major = amountMinor / 10 ** minorDigits(currency);
  return new Intl.NumberFormat("en-US", { style: "currency", currency, notation: "compact", maximumFractionDigits: 1 }).format(major);
}

/**
 * Exact string for PayPal API "value" fields, using integer/string math only:
 * 75000 USD → "750.00", 5 USD → "0.05", 1200 JPY → "1200".
 */
export function toPayPalValue(amountMinor: number, currency = "USD"): string {
  assertMinor(amountMinor);
  if (amountMinor < 0) throw new Error("PayPal amounts must be non-negative");
  const digits = minorDigits(currency);
  if (digits === 0) return String(amountMinor);
  const s = String(amountMinor).padStart(digits + 1, "0");
  return `${s.slice(0, -digits)}.${s.slice(-digits)}`;
}

/** Parse PayPal "value" strings back to minor units exactly: "750.00" → 75000. */
export function fromPayPalValue(value: string, currency = "USD"): number {
  const digits = minorDigits(currency);
  const m = /^(\d+)(?:\.(\d+))?$/.exec(value.trim());
  if (!m) throw new Error(`Invalid money value "${value}"`);
  const fracRaw = m[2] ?? "";
  if (fracRaw.length > digits) throw new Error(`Too many decimal places in "${value}" for ${currency}`);
  const frac = fracRaw.padEnd(digits, "0");
  return assertMinor(Number(m[1]) * 10 ** digits + (digits ? Number(frac) : 0));
}

/** Parse user-entered major units ("1,500" / "1500.5") into minor units. */
export function parseMajorInput(input: string, currency = "USD"): number | null {
  const cleaned = input.replace(/[,$\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return fromPayPalValue(cleaned, currency);
}

/** Integer percentage of an amount, rounded half-up to the minor unit. */
export function percentOf(amountMinor: number, percent: number): number {
  assertMinor(amountMinor);
  if (!Number.isInteger(percent) || percent < 0 || percent > 100) throw new Error("percent must be an integer 0-100");
  return Math.floor((amountMinor * percent + 50) / 100);
}
