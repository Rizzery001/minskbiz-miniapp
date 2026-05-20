export function normalizePhone(raw: string): string {
  const trimmed = raw.trim()
  const hasPlus = trimmed.startsWith('+')
  const digits = trimmed.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}

export function isPhoneValid(raw: string): boolean {
  const normalized = normalizePhone(raw)
  const digits = normalized.replace(/\D/g, '')
  return digits.length >= 7
}
