/**
 * Red de seguridad de redacción para exportaciones (08-seguridad-privacidad.md:
 * "cualquier exportación de datos debe redactar campos configurados"). Los
 * mensajes de `Finding` nunca deberían contener un token completo -el motor
 * no los construye así-, pero esta función redacta igualmente cualquier
 * cadena con forma de JWT (tres segmentos base64url separados por puntos)
 * como defensa en profundidad antes de exportar.
 */
const JWT_SHAPE_PATTERN = /[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]*/g

export function redactJwtLikeStrings(text: string): string {
  return text.replace(JWT_SHAPE_PATTERN, '[token redactado]')
}

export function redactDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return redactJwtLikeStrings(value) as unknown as T
  }
  if (Array.isArray(value)) {
    const items = value as readonly unknown[]
    const mapped: unknown[] = items.map((item) => redactDeep(item))
    return mapped as unknown as T
  }
  if (value !== null && typeof value === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = redactDeep(val)
    }
    return result as unknown as T
  }
  return value
}
