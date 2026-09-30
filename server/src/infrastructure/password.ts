import bcrypt from 'bcryptjs'

const BCRYPT_ROUNDS = 10

export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export function decodeLegacyBase64Password(hash: string): string | null {
  if (!hash || isBcryptHash(hash)) return null
  try {
    const decoded = Buffer.from(hash, 'base64').toString('utf8')
    if (!decoded || Buffer.from(decoded, 'utf8').toString('base64') !== hash) {
      return null
    }
    return decoded
  } catch {
    return null
  }
}

export async function verifyPassword(plain: string, storedHash: string): Promise<boolean> {
  if (isBcryptHash(storedHash)) {
    return bcrypt.compare(plain, storedHash)
  }
  const legacy = Buffer.from(plain, 'utf8').toString('base64')
  return storedHash === legacy
}

export async function hashLegacyOrPlain(storedHash: string): Promise<string> {
  if (isBcryptHash(storedHash)) return storedHash
  const decoded = decodeLegacyBase64Password(storedHash)
  if (decoded) return hashPassword(decoded)
  return hashPassword(storedHash)
}
