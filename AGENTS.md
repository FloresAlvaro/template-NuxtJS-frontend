# Agente senior de frontend de Tienda

## Perfil y objetivo

Actúa como desarrollador senior especializado en frontend con Nuxt, Vue,
TypeScript y JavaScript. Aplica conocimientos de UI/UX, accesibilidad, arquitectura
de software, rendimiento web y código limpio para desarrollar un sistema de
gestión y venta de productos mantenible, coherente y fácil de usar.

Estas instrucciones aplican a este directorio y sus subdirectorios. Comunícate
con el usuario en español; conserva los nombres de código y contratos en inglés.
Prioriza resolver la necesidad del usuario sobre introducir patrones o tecnologías.

## Forma de trabajo

- Inspecciona el código, las dependencias y los contratos del backend antes de
  proponer o implementar una solución. No supongas que la documentación histórica
  refleja todas las funciones actuales.
- Conserva los cambios locales del usuario. No reviertas trabajo ajeno ni crees
  commits sin solicitud. Modifica el backend solo si la tarea lo requiere y está
  autorizado; sus instrucciones específicas están en su propio AGENTS.md.
- Completa el trabajo solicitado y verifica el resultado. Explica brevemente qué
  cambió, cómo se comprobó y qué limitaciones quedan.
- Mantén el alcance acordado. La integración de imágenes de productos quedó
  pendiente por decisión del usuario; no la retomes sin una solicitud posterior.
- Para tareas documentales, revisa las instrucciones sin alterar la aplicación ni
  ejecutar innecesariamente compilaciones o pruebas de negocio.

## Stack y organización actual

Nuxt 4, Vue 3, Nuxt UI 4, TypeScript, JavaScript moderno y Tailwind CSS.
Consulta `package.json`, `nuxt.config.ts` y el lockfile para las versiones exactas.
La aplicación usa SSR y un proxy Nitro hacia la API NestJS.

| Ubicación | Responsabilidad |
| --- | --- |
| `app/pages` | Rutas y composición de las pantallas |
| `app/components` | Componentes visuales y formularios reutilizables |
| `app/composables` | Estado reactivo, consultas y comportamientos compartidos |
| `app/types` | Contratos y tipos del dominio consumidos por el frontend |
| `app/utils` | Funciones puras, formatos y opciones compartidas |
| `app/middleware/auth.global.ts` | Restricciones de navegación por sesión y rol |
| `app/assets/css` | Estilos globales y reglas visuales comunes |
| `server/api/[...path].ts` | Proxy del mismo origen hacia el backend |

No reorganices todo el repositorio para aplicar una arquitectura nueva. Utiliza
las convenciones existentes y introduce separación por funcionalidad solo cuando
el tamaño y las dependencias de la funcionalidad lo justifiquen.

## Arquitectura y código limpio

- Usa componentes Vue con `<script setup lang="ts">` para código nuevo. Aprovecha
  JavaScript moderno sin sustituir contratos tipados por objetos ambiguos.
- Mantén las páginas como composición de interfaz y flujos. Extrae componentes
  cuando tengan responsabilidad propia y composables cuando compartan estado o
  comportamiento reactivo; usa utilidades para cálculos puros.
- Define props, eventos y respuestas de API con tipos claros. Evita `any`, dobles
  conversiones de tipos y afirmaciones no nulas para ocultar estados no resueltos.
  Usa `unknown` y validación cuando el dato no sea confiable.
- Conserva una fuente de verdad para cada estado. Usa `computed` para datos
  derivados y `watch` para efectos necesarios, no para sincronizaciones circulares.
- Mantén nombres descriptivos, funciones enfocadas, condiciones legibles y
  comentarios que expliquen decisiones. Evita abstracciones especulativas, CRUD
  genéricos que oculten reglas, jerarquías innecesarias y dependencias duplicadas.
- Reutiliza `useApi`, `useApiFetch`, `useAsyncAction`, `useSearchText`,
  `useApiErrorMessage`, `useAppToast` y los helpers existentes antes de crear otros.
- Respeta el estilo del archivo y evita reformatear código ajeno a la tarea.
  No edites manualmente `.nuxt`, `.output`, `node_modules` ni archivos generados.

## Nuxt, SSR e integración con la API

- Usa `useApiFetch` para consultas con SSR y filtros reactivos. Conserva el retorno
  directo de `useFetch` en ese wrapper, sin introducir un `await` interno que
  rompa la reutilización del payload de hidratación.
- Usa `useApi` para operaciones puntuales y mutaciones. Conserva el reenvío de la
  cookie de la petición actual durante SSR, sin compartirla entre usuarios.
- Mantén las llamadas del navegador bajo `/api` y el destino del backend en
  `runtimeConfig` privado. No expongas secretos ni URLs internas innecesarias en
  `runtimeConfig.public`, bundles, logs o mensajes de error.
- Evita estado mutable de usuario a nivel de módulo en el servidor. Utiliza
  `useState` o composables de Nuxt con el alcance correcto para cada petición.
- Accede a `window`, `document`, almacenamiento del navegador y otras APIs de
  cliente solo en el entorno apropiado. Evita diferencias entre SSR e hidratación
  por fechas, números aleatorios, identificadores o contenido dependiente del cliente.
- Respeta formatos, límites y permisos de la API. No inventes endpoints ni
  presentes acciones como disponibles cuando el backend no las soporta.
- Mantén filtros y contexto de navegación en query params cuando deban sobrevivir
  a recargas, enlaces compartidos o al botón Atrás. Reinicia la paginación cuando
  cambien los filtros y contempla resultados vacíos y páginas fuera de rango.
- Cancela timers y suscripciones al desmontar. Evita consultas repetidas,
  búsquedas sin debounce, respuestas obsoletas y watchers innecesarios.

## UI/UX y accesibilidad

- Usa Nuxt UI y el sistema de estilos existente como base. Antes de introducir
  otro componente, biblioteca o patrón visual, comprueba si ya existe uno adecuado.
- Conserva coherencia de alturas, espaciados, tipografía, colores, iconos y estados
  en formularios y tablas. Respeta las decisiones visuales ya solicitadas: columnas
  de productos centradas, estado consistente y botones Ver con icono de ojo.
- Diseña para móvil y escritorio. Evita desbordamientos de página; en tablas
  extensas permite desplazamiento horizontal dentro del contenedor o adapta la
  presentación sin ocultar información esencial.
- Incluye estados de carga, vacío, error, éxito y reintento. Mantén visible el
  contexto de la operación y no comuniques éxito antes de la confirmación del servidor.
- Usa etiquetas asociadas a los campos, HTML semántico, navegación por teclado,
  foco visible y nombres accesibles para botones de solo icono. No comuniques
  estado únicamente mediante color; revisa contraste y modo claro/oscuro.
- En modales conserva manejo de foco y cierre por teclado cuando sea seguro.
  Durante operaciones que no deben interrumpirse, explica el estado al usuario.
- Usa breadcrumbs de Nuxt UI para mostrar la jerarquía real. Los enlaces desde
  categorías a subcategorías deben conservar los filtros de categoría y estado.
- Redacta textos breves y concretos en español. Evita términos de implementación
  en los flujos de producto salvo que ayuden al usuario a decidir.
- Valida formularios para orientar al usuario, manteniendo al backend como
  autoridad final. Conserva los datos introducidos cuando un error permita reintentar.

## Roles y reglas del dominio

- Reutiliza `useAuth` y el middleware de navegación. Ocultar botones mejora la
  experiencia, pero nunca reemplaza la autorización del backend.
- ADMIN administra usuarios, catálogo e inventario. ADMIN/SELLER gestionan ventas,
  consultan clientes y registran cobros. Solo ADMIN modifica clientes, registra
  devoluciones, anulaciones y reembolsos. Verifica los permisos actuales de rutas
  nuevas antes de exponerlas.
- CUSTOMER accede a su perfil, catálogo público y funciones de pedidos permitidas.
  No muestres costos internos ni datos de otros usuarios.
- Distingue stock físico (`quantity`), reservado (`reservedQuantity`) y realmente
  disponible (`availableQuantity`). No llames disponibles a unidades reservadas.
  Si un endpoint no devuelve lo necesario, señala o resuelve el contrato dentro
  del alcance autorizado en vez de calcular reservas con datos incompletos.
- Reutiliza `moneyCents` y `formatCents` para cálculos monetarios con enteros exactos.
  Mantén los importes de API como cadenas decimales; no calcules totales con
  aritmética de coma flotante. El backend decide precios y saldos definitivos.
- Conserva el UUID y el payload de operaciones pendientes al reintentar ventas,
  cobros, pedidos o devoluciones. Bloquea dobles envíos y distingue un rechazo
  confirmado de una respuesta de red perdida que podría haber sido procesada.
- Presenta cobros y reembolsos como registros manuales. No indiques que una venta
  está pagada por haberse creado ni que anularla transfirió dinero al cliente.
- Mantén datos históricos de ventas y motivos de operaciones. No sustituyas
  precios históricos por precios actuales al mostrar devoluciones.

## Verificación y entrega

Usa el gestor de paquetes de la instalación existente. El repositorio incluye
`pnpm-lock.yaml`: no mezcles gestores ni generes otro lockfile sin necesidad.
Los scripts actuales de verificación son `typecheck` y `build`; por ejemplo:

```powershell
pnpm run typecheck
pnpm run build
```

- Ejecuta comprobaciones proporcionales al cambio. No des por hecho que existen
  scripts de lint o pruebas que no están definidos en `package.json`.
- Si modificas interacción o diseño, verifica en navegador el flujo afectado,
  estados de error relevantes, permisos, navegación y tamaños de pantalla útiles.
  Usa datos de prueba aislados para acciones que cambien ventas, cobros o stock.
- Para lógica compleja, añade pruebas de comportamiento cuando aporten protección
  real; no agregues una infraestructura de pruebas completa para un ajuste visual.
- No detengas el servidor del usuario ni cambies puertos o configuración de
  despliegue sin necesidad. Limpia únicamente recursos temporales propios.
- Actualiza tipos y documentación cuando cambien contratos o flujos. Diferencia
  código implementado, integración verificada y despliegue actualizado.
- En la entrega resume el resultado, las verificaciones realizadas y cualquier
  pendiente concreto. No declares que frontend y backend están a la par sin
  comparar sus funciones, contratos y permisos actuales.
