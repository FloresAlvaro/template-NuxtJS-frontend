# Frontend de Tienda

Template de tienda y gestión comercial con Nuxt 4, Vue 3, Nuxt UI 4 y Tailwind CSS.
Usa SSR y un proxy Nitro hacia el backend NestJS. Estado actualizado al 14/10/2026.

## Instalación y ejecución local

Usa pnpm y el `pnpm-lock.yaml` del repositorio:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Abre http://localhost:3000. El backend debe estar disponible en
http://localhost:3001/api. Para iniciarlo con PostgreSQL y Mailpit, desde su carpeta:

```bash
docker compose up -d --build --wait
```

Consulta el [README del backend](../template-NestJS-backend/README.md) para crear
el primer administrador y cargar catálogo o demo. El seed se ejecuta en el backend,
no en este repositorio; `pnpm build` solo compila el frontend. La demo requiere un
ADMIN activo existente y solicita una contraseña para las cuentas ficticias.

El destino privado del proxy se configura con `NUXT_BACKEND_API_BASE`. Para usar
otro backend en macOS/Linux:

```bash
NUXT_BACKEND_API_BASE=http://localhost:3001/api pnpm dev
```

No expongas el backend ni credenciales mediante `runtimeConfig.public`.

## Compilación y publicación

```bash
pnpm typecheck
pnpm build
pnpm preview
```

`preview` sirve para revisar la compilación local. Para ejecutar la salida de
producción con Node:

```bash
node .output/server/index.mjs
```

Configura `NUXT_BACKEND_API_BASE` en el servidor y el origen HTTPS público en
`TRUSTED_ORIGINS`, `COOKIE_SECURE=true` y `PASSWORD_RESET_URL` del backend.
El proxy requiere un servidor Nuxt/Nitro: `generate` y un hosting estático no
sustituyen este despliegue. Mailpit es local; producción requiere correo real.

## Organización del código

Las páginas conservan las rutas de Nuxt. Los componentes se agrupan por su
responsabilidad dentro de `app/components`:

- `products`, `categories`, `customers`, `sales`, `orders` y `reports`: interfaz de cada área.
- `auth`: formularios y controles de acceso.
- `layout`: cabecera, pie y presentación del espacio de trabajo.
- `shared`: tablas, paginación, botones, modales y estado reutilizables.

Los composables se organizan en `app/composables/api`, `auth`, `catalog` y
`shared`. `nuxt.config.ts` habilita su búsqueda en subcarpetas y conserva los
nombres de componentes sin prefijos de carpeta. Mantén nombres únicos y
descriptivos al añadir componentes.

`app/utils` contiene funciones puras compartidas y `app/types` los contratos de
la API. Usa `useSearchText` para búsquedas con debounce y `formatStoreDate`, de
`app/utils/date.ts`, para presentar fechas y horas en la zona de la tienda.
La agrupación de fechas de reportes mantiene sus reglas específicas.

## Funciones implementadas

| Área | Estado |
| --- | --- |
| Catálogo y fotos | Tarjetas públicas, paginación, disponibilidad; gestión de una foto por producto |
| Acceso | Login, registro CUSTOMER, perfil, cambio y recuperación de contraseña |
| Gestión | Usuarios, categorías, subcategorías, productos y clientes con permisos por rol |
| Inventario | Stock físico/reservado/disponible, mínimos e historial de movimientos |
| Ventas | Alta, detalle histórico, cobros manuales, devoluciones, anulaciones y reembolsos |
| Pedidos | Reserva, confirmación, preparación y retiro; consulta/cancelación propia |
| Proveedores y compras | ADMIN: proveedores, compras pendientes, recepción completa, costos opcionales y cancelación con historial |
| Reportes | Seis gráficos ADMIN, filtros de período, tablas exactas y estados de error/reintento |
| Diseño | Navegación por rol, móvil/escritorio y modo claro/oscuro |

## Acceso por roles

El frontend incluye `/login`, `/register`, `/account`, `/users` (solo administrador) y `/shop` (catálogo activo público). Administradores gestionan usuarios y catálogo; vendedores consultan el catálogo de gestión sin costos ni botones de modificación; clientes consultan el catálogo público y su propio perfil. Las rutas se verifican al navegar y el backend aplica los permisos en cada petición.

Las peticiones usan `/api` en el mismo origen. `server/api/[...path].ts` reenvía al backend configurado mediante `NUXT_BACKEND_API_BASE` (por defecto http://localhost:3001/api), conservando cookies HttpOnly. No se almacena el token en localStorage. Se requiere un servidor Nuxt/Nitro; un hosting de archivos estáticos por sí solo no ejecuta este proxy.

Crea el primer administrador con el comando interactivo documentado en el README del backend. Para publicar, configura el origen HTTPS en TRUSTED_ORIGINS del backend y COOKIE_SECURE=true. El registro público crea únicamente cuentas de cliente. La recuperación de contraseña y los pedidos de retiro están integrados; las imágenes de productos se muestran en el catálogo y se gestionan desde Productos.

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

## Proveedores y compras

ADMIN dispone de Proveedores y Compras en Administración. Proveedores permite
búsqueda, alta, edición y baja lógica; su botón Compras filtra el historial.
Los filtros de estas listas se conservan en la URL.

Nueva compra permite buscar proveedores activos y productos por SKU/nombre,
indicar cantidades y costos unitarios y registrar una compra pendiente. El
servidor calcula el total y conserva los datos históricos. Registrar la compra
no cambia el inventario ni representa un pago al proveedor.

Desde su detalle se recibe toda la mercadería, con una confirmación explícita y
nota, o se cancela mientras esté pendiente. Actualizar el costo del producto es
opcional; el precio de venta se conserva. Cada recepción genera entradas de
inventario enlazadas a la compra. Los reintentos mantienen UUID y contenido,
también al recargar cuando sessionStorage está disponible.

Aplica la migración `20261014180000_suppliers_purchases` y actualiza el backend
antes de usar estas vistas. SELLER y CUSTOMER no tienen acceso a estos costos.
Recepciones parciales, devoluciones al proveedor y pagos quedan fuera de esta versión.

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

## Interfaz y fotos de productos

La interfaz usa una base violeta con acentos cálidos, adaptable a otra marca desde
`app/app.config.ts` y `app/assets/css/main.css`. Inicio ofrece accesos por rol;
ADMIN/SELLER tienen navegación lateral en escritorio y menú agrupado en móvil.
Los clientes y visitantes disponen de navegación superior y catálogo de tarjetas.
Se conservan modo claro/oscuro, foco visible y preferencias de movimiento reducido.

El catálogo muestra `imageUrl`, disponibilidad real y confirmación visual al
agregar productos al pedido. La página del catálogo se conserva en la URL.
No se añaden filtros de búsqueda públicos: el endpoint actual solo permite paginación.

En Productos, Foto permite consultar la imagen a ADMIN/SELLER. ADMIN puede
seleccionar, previsualizar, guardar, reemplazar o eliminar una foto con confirmación.
Primero crea el producto y después carga su foto. Se admiten JPEG, PNG y WebP
estáticos de hasta 5 MiB; el servidor valida un máximo de 16 megapíxeles y normaliza
a WebP. Los errores conservan la selección para reintentar y los productos sin foto
muestran un estado alternativo. Las operaciones usan el proxy `/api` existente.

Verificación del rediseño: typecheck y build; revisión en navegador a 1440 y 390 px
con una API temporal y datos ficticios (roles, carrito, fotos, vacío y error).
La API de imágenes tiene pruebas HTTP con PostgreSQL real en el backend; la revisión
visual del gestor durante el rediseño utilizó una API temporal de datos ficticios.
Estas comprobaciones tienen alcances diferentes.

## Acceso y registro

Login y registro comparten una presentación adaptable: panel de bienvenida en
escritorio y encabezado compacto en móvil. Los campos conservan autocompletado,
etiquetas accesibles y límites de la API; las contraseñas pueden mostrarse u
ocultarse individualmente. Durante el envío se bloquean campos y botón.

Registro muestra ayuda de longitud y coincidencia de contraseña, conserva los
datos ante errores y confirma la creación desde login antes de iniciar sesión.
El enlace entre ambas pantallas conserva el destino solicitado; login sigue
validando que ese destino sea una ruta interna permitida. Los errores de acceso,
correo registrado y límite de intentos tienen mensajes en español.

Verificación: typecheck y build; revisión visual en móvil y escritorio, modo claro
y oscuro, y flujos de registro/login con una API temporal de datos ficticios.
No se crearon usuarios adicionales en la base habitual durante esta revisión.


## Gráficos de Reportes

Reportes (ADMIN) incluye evolución diaria/mensual de ventas netas, top 10 productos
por unidades o importe, top 10 vendedores, cobros por efectivo/tarjeta/transferencia,
estado del inventario físico y stock frente al mínimo. Cada gráfico tiene datos
exactos en una tabla desplegable y estados de carga, vacío, error y reintento.
La evolución admite consulta de puntos con el ratón o el selector por teclado.

Las ventas netas reflejan devoluciones y anulaciones actuales de ventas creadas
en el período; no son un cierre de caja ni ganancias. Los cobros se seleccionan
por la fecha de la operación PAYMENT y no descuentan reembolsos. El inventario es
actual y físico; las alertas muestran también reservas y disponibilidad real.
Las fechas (máximo 366 días), agrupación, ranking y página de alertas se guardan
en la URL. Los importes se conservan exactos; las proporciones del dibujo usan
BigInt y se muestran sin bibliotecas adicionales de gráficos.

Requiere actualizar el backend para disponer de `/reports/sales-series`,
`/reports/sellers`, `/reports/payment-methods`, la métrica de `/top-products` y
las reservas/disponibilidad añadidas a `/low-stock`. Consulta el contrato en
`docs/reports-api.md` del backend.

## Validación y límites actuales

La última ampliación de reportes pasó `pnpm typecheck` y `pnpm build`, además de
revisión manual con API NestJS/PostgreSQL aislados: filtros, navegación/recarga,
rankings, tablas, teclado, estados vacíos/error/reintento y móvil de 390 px.
El backend validó 72 pruebas unitarias y 127 de integración; esos conteos no son
pruebas automatizadas del frontend. Este repositorio no define scripts de tests
ni lint, ni workflows CI versionados. No se modificó la base habitual en las pruebas.

## Pendientes

- Búsqueda y filtros públicos por nombre/SKU, categoría, precio y disponibilidad;
  primero requiere ampliar el contrato del backend, que hoy solo admite paginación.
- Carrito persistente: la selección actual vive en la página; conservar un UUID
  de envío pendiente no equivale a guardar el carrito entre visitas.
- Notificaciones de pedidos y alertas de inventario.
- Caja, comprobantes imprimibles y exportaciones CSV/PDF.
- Proveedores/compras, descuentos, metas y análisis de rentabilidad.
- Pasarela de pagos, envíos y facturación fiscal, según alcance comercial.
- Pruebas automatizadas de navegación y CI; operación de producción, backups,
  restauración y monitoreo coordinados con el backend.

El embudo de conversión requiere medir visitas y pasos del cliente; metas requieren
objetivos registrados; comparación de ingresos/costos requiere compras/gastos.
No se generan esos gráficos a partir de datos que el proyecto todavía no registra.
Consulta la [matriz de permisos y backlog del backend](../template-NestJS-backend/docs/permissions-and-backlog.md).

## Interfaz de ventas

Lista, nueva venta y detalle comparten `WorkspaceHeader`, colores, iconos y
jerarquía visual. `SaleStatusBadge` unifica los estados; la lista destaca el total
vigente y el detalle separa total, deuda y reembolso. Nueva venta presenta los
pasos, la selección del cliente, disponibilidad por producto y resumen del total.
Se conservan permisos, confirmación manual de cobros y reintentos idempotentes.

Verificación: typecheck/build y navegador en escritorio/móvil con una API temporal
de solo lectura y datos ficticios. Se revisaron selección, cantidades y total,
producto agotado, estados y detalle. No se registraron ventas ni cobros reales.

## Interfaz de usuarios

Usuarios (ADMIN) comparte el encabezado y tabla del espacio de gestión, explica
los tres roles, muestra estado e identifica la propia cuenta. Creación, edición
y restablecimiento usan modales consistentes; se bloquean los campos y el cierre
durante el envío, y se impiden envíos simultáneos. La contraseña puede mostrarse
u ocultarse; el backend conserva la autoridad sobre permisos y restricciones.
La propia cuenta no permite cambiar su rol ni desactivarse desde esta pantalla.

La API de usuarios solo permite paginación: no se añaden búsquedas o filtros
locales que aparenten consultar todas las cuentas. Verificación: typecheck/build
y revisión de la versión compilada con una API de solo lectura, usuarios ficticios,
modales y ambos temas en escritorio/móvil. No se crearon cuentas ni se
restablecieron contraseñas reales durante la revisión.

## Caja y alertas operativas

/cash permite abrir el turno propio, gestionar efectivo, consultar el historial y cerrar con arqueo. ADMIN administra cajas y consulta todos los turnos; SELLER solo los propios. El efectivo esperado excluye tarjeta y transferencia. Cobros y reembolsos desde ventas exigen turno abierto y envían su identificador. Reintentos conservan UUID y contenido tras recargar.

/stock-alerts ofrece búsqueda SKU/nombre, filtros de agotados/stock bajo, existencias físicas/reservadas/disponibles, mínimo y reposición sugerida. Inicio muestra el aviso con los totales. Se actualiza cada minuto y al recuperar el foco. ADMIN puede gestionar inventario y crear compras; SELLER solo consulta inventario. Son avisos dentro de la aplicación, sin envío de correo/push. Ver [contrato backend](../template-NestJS-backend/docs/cash-and-stock-alerts-api.md).

## Auditoría, avisos y promociones

/audit (ADMIN) filtra por entidad/registro/responsable y muestra cambios anteriores/nuevos. /notifications muestra avisos propios CUSTOMER y entrega/reintentos de correo ADMIN. La campana CUSTOMER indica avisos sin leer. /promotions administra configuración ADMIN y consulta promociones elegibles SELLER. Nueva venta permite una promoción porcentual; detalle muestra el descuento histórico. Fechas en America/La_Paz y vista previa con BigInt/redondeo por unidad.

Pruebas de lógica: Node 24, `node --test tests/promotion.test.mjs`. Ver [contrato y alcance](../template-NestJS-backend/docs/admin-features-api.md). No se aplican promociones a pedidos de autoservicio en esta versión.
