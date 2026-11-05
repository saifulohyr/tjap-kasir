// Web Crypto API HMAC-SHA256 based token verification (Edge + Node.js compatible)

const DEFAULT_SECRET = 'tjap-kasir-secret-fallback-key-2026'

async function getCryptoKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  return crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createAuthToken(payload = 'staff'): Promise<string> {
  const secret = process.env.AUTH_SECRET || DEFAULT_SECRET
  const key = await getCryptoKey(secret)
  const enc = new TextEncoder()
  const timestamp = Date.now().toString()
  const data = `${payload}:${timestamp}`
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  const signature = bufferToHex(signatureBuffer)
  return `${data}.${signature}`
}

export async function verifyAuthToken(token: string): Promise<boolean> {
  try {
    if (!token) return false
    const parts = token.split('.')
    if (parts.length !== 2) return false
    
    const [data, signature] = parts
    const secret = process.env.AUTH_SECRET || DEFAULT_SECRET
    const key = await getCryptoKey(secret)
    const enc = new TextEncoder()
    
    // Check expiry (7 days)
    const [payload, timestamp] = data.split(':')
    if (!payload || !timestamp) return false
    const tokenTime = parseInt(timestamp, 10)
    const maxAge = 7 * 24 * 60 * 60 * 1000
    if (Date.now() - tokenTime > maxAge) return false

    // Verify signature
    const expectedSigBuffer = await crypto.subtle.sign('HMAC', key, enc.encode(data))
    const expectedSig = bufferToHex(expectedSigBuffer)
    return signature === expectedSig
  } catch {
    return false
  }
}

export function verifyPin(pin: string): boolean {
  const expectedPin = process.env.CASHIER_PIN || '8691'
  return pin === expectedPin
}
