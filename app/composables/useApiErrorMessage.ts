export const useApiErrorMessage = () => {
  const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
    if (error && typeof error === 'object' && 'data' in error) {
      const apiError = error as { data?: unknown; statusMessage?: string; message?: string }

      if (typeof apiError.data === 'string') {
        return apiError.data
      }

      if (apiError.data && typeof apiError.data === 'object' && 'message' in apiError.data) {
        const message = (apiError.data as { message?: string | string[] }).message
        return Array.isArray(message) ? message.join(', ') : message ?? fallbackMessage
      }

      return apiError.statusMessage ?? apiError.message ?? fallbackMessage
    }

    return error instanceof Error ? error.message : fallbackMessage
  }

  return {
    getApiErrorMessage
  }
}
