export const useAppNavigation = () => {
  const auth = useAuth()
  const groups = computed(() => [
    {
      label: 'Tu espacio',
      items: [
        { label: 'Inicio', to: '/', icon: 'i-lucide-house' },
        { label: 'Catálogo', to: '/shop', icon: 'i-lucide-store' },
        ...(auth.user.value?.role === 'CUSTOMER'
          ? [{ label: 'Mis pedidos', to: '/orders', icon: 'i-lucide-shopping-bag' }, {label:'Notificaciones',to:'/notifications',icon:'i-lucide-bell'}]
          : []),
      ],
    },
    ...(auth.isStaff.value ? [
      {
        label: 'Operaciones',
        items: [
          { label: 'Caja y turnos', to: '/cash', icon: 'i-lucide-vault' },
          { label: 'Ventas', to: '/sales', icon: 'i-lucide-receipt' },
          { label: 'Pedidos', to: '/orders', icon: 'i-lucide-shopping-bag' },
          { label: 'Clientes', to: '/customers', icon: 'i-lucide-users' },
        ],
      },
      {
        label: 'Catálogo de gestión',
        items: [
          { label: 'Alertas de stock', to: '/stock-alerts', icon: 'i-lucide-triangle-alert' },
          {label:'Promociones',to:'/promotions',icon:'i-lucide-tags'},
          { label: 'Productos', to: '/products', icon: 'i-lucide-package' },
          { label: 'Categorías', to: '/categories', icon: 'i-lucide-layers' },
          { label: 'Subcategorías', to: '/sub-categories', icon: 'i-lucide-list-tree' },
        ],
      },
    ] : []),
    ...(auth.isAdmin.value ? [{
      label: 'Administración',
      items: [
        { label: 'Proveedores', to: '/suppliers', icon: 'i-lucide-truck' },
        { label: 'Compras', to: '/purchases', icon: 'i-lucide-package-plus' },
        { label: 'Reportes', to: '/reports', icon: 'i-lucide-chart-no-axes-combined' },
        {label:'Auditoría',to:'/audit',icon:'i-lucide-history'},
        {label:'Notificaciones de pedidos',to:'/notifications',icon:'i-lucide-mail'},
        { label: 'Usuarios', to: '/users', icon: 'i-lucide-user-round-cog' },
      ],
    }] : []),
  ])
  const account = computed(() => auth.user.value
    ? { label: 'Mi cuenta', to: '/account', icon: 'i-lucide-circle-user-round' }
    : { label: 'Ingresar', to: '/login', icon: 'i-lucide-log-in' })
  return { groups, account }
}
