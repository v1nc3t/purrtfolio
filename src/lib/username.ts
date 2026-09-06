export const USERNAME_STORAGE_KEY = 'purrtfolio.username'

const MAX_USERNAME_LENGTH = 32

export function sanitizeUsernameInput(value: string): string {
  return value.replace(/\s/g, '').slice(0, MAX_USERNAME_LENGTH)
}

export function normalizeUsername(value: string): string {
  return sanitizeUsernameInput(value)
}

export function readSessionUsername(): string | null {
  try {
    const stored = sessionStorage.getItem(USERNAME_STORAGE_KEY)
    const username = stored ? normalizeUsername(stored) : ''
    return username || null
  } catch {
    return null
  }
}

export function writeSessionUsername(username: string): void {
  try {
    sessionStorage.setItem(USERNAME_STORAGE_KEY, username)
  } catch {
    // sessionStorage can throw in locked-down / private contexts
  }
}
