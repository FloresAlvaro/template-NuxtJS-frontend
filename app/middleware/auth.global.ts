export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.refresh()
  const staff = [
    '/categories',
    '/sub-categories',
    '/products',
    '/customers',
    '/sales',
    '/cash',
    '/stock-alerts',
    '/promotions',
  ].some((path) => to.path === path || to.path.startsWith(`${path}/`))
  const admin = ['/users', '/reports', '/suppliers', '/purchases', '/audit'].some(
    path => to.path === path || to.path.startsWith(`${path}/`),
  )
  const protectedPage =
    staff ||
    admin || to.path === '/account' ||
    to.path === '/orders' ||
    to.path.startsWith('/orders/') || to.path === '/notifications'
  if (protectedPage && !auth.user.value)
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  if(to.path === '/notifications' && auth.user.value?.role === 'SELLER') return navigateTo('/')
  if (staff && !auth.isStaff.value) return navigateTo('/shop')
  if (admin && !auth.isAdmin.value)
    return navigateTo('/shop')
  if (['/login', '/register'].includes(to.path) && auth.user.value)
    return navigateTo(auth.isStaff.value ? '/categories' : '/shop')
})
