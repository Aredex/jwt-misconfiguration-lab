import { describe, expect, it } from 'vitest'
import {
  base64UrlDecodeToBytes,
  base64UrlDecodeToString,
  base64UrlEncodeFromBytes,
  base64UrlEncodeFromString,
} from '../../src/domain/base64url'

describe('base64url', () => {
  it('codifica y decodifica una cadena de ida y vuelta', () => {
    const original = '{"alg":"HS256","typ":"JWT"}'
    const encoded = base64UrlEncodeFromString(original)
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
    expect(base64UrlDecodeToString(encoded)).toBe(original)
  })

  it('produce bytes idénticos a los originales', () => {
    const bytes = new Uint8Array([0, 1, 2, 253, 254, 255])
    const encoded = base64UrlEncodeFromBytes(bytes)
    const decoded = base64UrlDecodeToBytes(encoded)
    expect(Array.from(decoded)).toEqual(Array.from(bytes))
  })

  it('lanza un error ante una longitud base64url inválida', () => {
    expect(() => base64UrlDecodeToBytes('a')).toThrow()
  })
})
