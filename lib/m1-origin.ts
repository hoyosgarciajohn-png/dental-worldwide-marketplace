/** Validate the original HTTP authority; NextRequest normalizes loopback URL hosts. */
export function trustedLocalRequest(request: Pick<Request, 'headers' | 'url'>, origin: string, requireOrigin = true) {
  const expected = new URL(origin);
  if (expected.hostname !== '127.0.0.1') return false;
  // Forwarded headers are not trusted in this loopback-only M1 environment.
  return request.headers.get('host') === expected.host
    && new URL(request.url).protocol === expected.protocol
    && (!requireOrigin || request.headers.get('origin') === expected.origin);
}
