export function apiErrorStatus(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as { statusCode?: unknown; status?: unknown }
  const status = candidate.statusCode ?? candidate.status
  return typeof status === 'number' ? status : undefined
}

// A guard/proxy rejection of a retry says nothing about whether an earlier
// attempt committed. Keep its UUID until the business endpoint answers.
export function isConfirmedOperationRejection(error: unknown): boolean {
  const status = apiErrorStatus(error)
  if (status === 403 && error && typeof error === 'object' && 'data' in error) {
    const data = error.data
    if (data && typeof data === 'object' && 'code' in data && data.code === 'PROMOTION_NOT_ALLOWED') return true
  }
  return status !== undefined && status >= 400 && status < 500 &&
    ![401, 403, 407, 408, 425, 429].includes(status)
}
