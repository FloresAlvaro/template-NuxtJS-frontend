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

Crea el primer administrador con el comando interactivo documentado en el README del backend. Para publicar, configura el origen HTTPS en TRUSTED_ORIGINS del backend y COOKIE_SECURE=true. El registro público crea únicamente cuentas de cliente. La recuperación de contraseña por correo, compras e imágenes de productos siguen pendientes.

Validaciones: `pnpm typecheck` y `pnpm build`.

## Código compartido

- `useApi`: cliente para peticiones puntuales; resuelve el baseURL y reenvía la cookie de la petición actual durante SSR, sin compartir cookies entre usuarios.
- `useApiFetch`: consultas con carga SSR, payload de hidratación, claves y filtros reactivos de Nuxt. No debe envolver su resultado en un await dentro del composable.
- `useAsyncAction`: estado de guardado, prevención de envíos concurrentes y normalización de errores.
- `useCatalogStatus`: confirmación y activación/desactivación de categorías, subcategorías y productos, con mensajes y recarga específicos por pantalla.
- `CategoryFields`: campos compartidos por crear y editar categorías.
- `utils/roles.ts`: nombres y opciones de roles; `utils/api-error.ts`: lectura segura del código de error HTTP.

Los formularios y las reglas específicas de cada entidad siguen separados. La API aplica siempre los permisos; ocultar un botón en el frontend no sustituye esa validación.
