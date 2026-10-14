# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
# template-NuxtJS-frontend

## Acceso por roles

El frontend incluye `/login`, `/register`, `/account`, `/users` (solo administrador) y `/shop` (catálogo activo público). Administradores gestionan usuarios y catálogo; vendedores consultan el catálogo de gestión sin costos ni botones de modificación; clientes consultan el catálogo público y su propio perfil. Las rutas se verifican al navegar y el backend aplica los permisos en cada petición.

Las peticiones usan `/api` en el mismo origen. `server/api/[...path].ts` reenvía al backend configurado mediante `NUXT_BACKEND_API_BASE` (por defecto http://localhost:3001/api), conservando cookies HttpOnly. No se almacena el token en localStorage. Se requiere un servidor Nuxt/Nitro; un hosting de archivos estáticos por sí solo no ejecuta este proxy.

Crea el primer administrador con el comando interactivo documentado en el README del backend. Para publicar, configura el origen HTTPS en TRUSTED_ORIGINS del backend y COOKIE_SECURE=true. El registro público crea únicamente cuentas de cliente. La recuperación de contraseña y los pedidos de retiro están integrados; las imágenes de productos siguen pendientes en la interfaz.

Validaciones: `pnpm typecheck` y `pnpm build`.

## Inventario

La tabla de Productos muestra stock disponible y avisos de agotado o stock bajo.
El botón Inventario permite consultar el historial paginado. Administradores pueden
registrar entradas, salidas y ajustes por conteo, además de definir el stock mínimo;
vendedores solo consultan. El catálogo público muestra las unidades disponibles.

Actualiza el backend y aplica la migración de inventario antes de usar esta pantalla.
Los productos empiezan en cero: registra una entrada para cargar existencias iniciales.
Un ajuste usa la cantidad final contada y detecta si el saldo cambió desde la consulta.
Si ocurre un conflicto, pulsa Actualizar y revisa la cantidad antes de reintentar.
Las ventas registradas descuentan stock automáticamente. El inventario distingue stock físico, reservado y disponible para venta. Las reservas vigentes de pedidos se descuentan de la disponibilidad.

## Clientes y ventas

Administradores y vendedores tienen acceso a Clientes y Ventas en el menú. Clientes
permite búsqueda, alta sin cuenta y consulta de sus ventas; ADMIN también edita o
desactiva perfiles. Nueva venta permite seleccionar o crear cliente, buscar por
SKU/nombre, agregar productos y confirmar cantidades y total. El backend calcula
los importes y descuenta stock; la interfaz conserva el identificador del envío
para evitar duplicados en reintentos. Cada venta tiene detalle histórico y puede
abrirse desde los movimientos de inventario relacionados.

Aplica las migraciones y actualiza el backend antes de utilizar estas pantallas.
El detalle permite cobros manuales para ADMIN/SELLER y devoluciones, anulaciones
y reembolsos para ADMIN. Muestra total original/vigente, saldo y reembolso pendiente,
y el historial de operaciones. Los reintentos conservan su UUID, incluso después
de recargar la pestaña si el navegador permite sessionStorage.
Registrar un cobro documenta dinero recibido fuera de la aplicación; no procesa
pagos bancarios. Anular o devolver productos repone stock pero no reembolsa dinero
automáticamente.

## Código compartido

- `useApi`: cliente para peticiones puntuales; resuelve el baseURL y reenvía la cookie de la petición actual durante SSR, sin compartir cookies entre usuarios.
- `useApiFetch`: consultas con carga SSR, payload de hidratación, claves y filtros reactivos de Nuxt. No debe envolver su resultado en un await dentro del composable.
- `useAsyncAction`: estado de guardado, prevención de envíos concurrentes y normalización de errores.
- `useCatalogStatus`: confirmación y activación/desactivación de categorías, subcategorías y productos, con mensajes y recarga específicos por pantalla.
- `CategoryFields`: campos compartidos por crear y editar categorías.
- `utils/roles.ts`: nombres y opciones de roles; `utils/api-error.ts`: lectura segura del código de error HTTP.

Los formularios y las reglas específicas de cada entidad siguen separados. La API aplica siempre los permisos; ocultar un botón en el frontend no sustituye esa validación.


## Pedidos, reportes y recuperación

- El cliente autenticado agrega productos desde Catálogo y confirma un pedido de retiro en tienda. Mis pedidos permite consultar estado, reserva, importes y cancelar pedidos pendientes.
- ADMIN/SELLER consultan Pedidos, confirman reservas, preparan y entregan. La confirmación crea la venta; su enlace permite registrar el cobro. Solo se habilita entrega con saldo cero. Para anular después de confirmar, ADMIN utiliza la anulación de la venta.
- Reportes está disponible solo para ADMIN: resumen de ventas por período, productos más vendidos, inventario físico y productos en mínimo/agotados. Los saldos son actuales para ventas creadas en el período; no constituyen un cierre de caja. Las fechas se interpretan en America/La_Paz y el día Hasta se incluye.
- Login incluye Recuperar contraseña. El correo enlaza a /reset-password#token=...; el frontend retira el fragmento del historial, mantiene el token solo en memoria y no inicia sesión automáticamente al terminar. Recargar requiere volver a abrir el enlace original.
- Los pedidos y transiciones reutilizan UUID/payload en respuestas desconocidas, también tras recarga si sessionStorage está disponible. La interfaz bloquea nuevos envíos hasta confirmar el resultado.
- Productos e Inventario muestran cantidades físicas, reservadas y disponibles; Catálogo y Nueva venta usan disponibilidad real. El filtro Estado del stock físico conserva la semántica del backend para quantity/minStock.

Antes de usar estas funciones, aplica todas las migraciones y actualiza el backend.
Docker: docker compose up -d --build backend desde el proyecto backend.
La URL de recuperación predeterminada ahora apunta a http://localhost:3000/reset-password.
Si Nuxt utiliza otro origen, configura PASSWORD_RESET_URL con su URL /reset-password y
TRUSTED_ORIGINS con ese origen. En local, Mailpit en http://localhost:8025 captura el
correo; no entrega mensajes a Internet. Configura SMTP real antes de publicar.

Las imágenes siguen pendientes de integración por decisión del usuario.
