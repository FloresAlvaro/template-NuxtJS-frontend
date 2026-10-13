export function apiErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as { statusCode?: unknown; status?: unknown }
  const status = candidate.statusCode ?? candidate.status
  return typeof status === 'number' ? status : undefined
}
