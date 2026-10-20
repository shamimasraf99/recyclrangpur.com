/**
 * Unit Test: Bengali Number & Currency Formatting
 * Ensures numbers and currency symbols render correctly for Bangladeshi users.
 */

export function convertToBengaliDigits(number: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return number
    .toString()
    .replace(/\d/g, (d) => bengaliDigits[parseInt(d, 10)]);
}

export function formatBDT(amount: number, locale: 'bn' | 'en' = 'bn'): string {
  const formattedNumber = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0
  }).format(amount);

  if (locale === 'bn') {
    return `৳ ${convertToBengaliDigits(formattedNumber)}`;
  }
  return `৳ ${formattedNumber}`;
}

describe('Bengali Formatting Utilities', () => {
  test('converts western numerals to bengali numerals', () => {
    expect(convertToBengaliDigits(1234567890)).toBe('১২৩৪৫৬৭৮৯০');
  });

  test('formats BDT currency with South Asian comma grouping and symbol', () => {
    expect(formatBDT(150000, 'bn')).toBe('৳ ১,৫০,০০০');
    expect(formatBDT(150000, 'en')).toBe('৳ 1,50,000');
  });
});
