/**
 * Currency utilities for Kleenah.
 * Handles formatting across African + global currencies.
 */

export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'RF' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'DA' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'DT' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
] as const

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]['code']

/**
 * Format a numeric amount as a currency string.
 * Falls back gracefully if the locale doesn't support the currency.
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  } catch {
    // Fallback: symbol + formatted number
    const symbol =
      SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency
    return `${symbol}${amount.toFixed(2)}`
  }
}

/**
 * Parse a currency string back to a number.
 * Strips all non-numeric characters except decimal separator.
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Get the currency symbol for a given code.
 */
export function getCurrencySymbol(code: string): string {
  return SUPPORTED_CURRENCIES.find((c) => c.code === code)?.symbol ?? code
}
