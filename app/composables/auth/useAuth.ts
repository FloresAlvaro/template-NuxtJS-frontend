import { apiErrorStatus } from '~/utils/api-error'
import type { AuthUser } from '~/types/auth'
export const useAuth = () => {
  const api = useApi()
  const user = useState<AuthUser | null>('auth-user', () => null)
  const refresh = async () => {
    try {
      user.value = await api<AuthUser>('/auth/me')
    } catch (error: unknown) {
      if (apiErrorStatus(error) === 401) user.value = null
      else throw error
    }
  }
  const logout = async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } catch (error: unknown) {
      if (apiErrorStatus(error) !== 401) throw error
    }
    user.value = null
    clearNuxtData()
    await navigateTo('/login')
  }
  return {
    user,
    refresh,
    logout,
    isAdmin: computed(() => user.value?.role === 'ADMIN'),
    isStaff: computed(() => ['ADMIN', 'SELLER'].includes(user.value?.role ?? '')),
  }
}
