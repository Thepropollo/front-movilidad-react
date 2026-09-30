# Informe final de auditoría frontend

**Proyecto:** Sistema de gestión del transporte universitario ULEAM

**Fecha de corte:** 2026-09-29

**Rama:** `audit/frontend`
**Veredicto:** **NO LISTO para producción**

## Resumen ejecutivo

Se contrastaron las rutas y permisos del frontend con el código del backend y se corrigieron fallos reproducibles estáticamente. El proyecto instala desde el lockfile, pasa ESLint, TypeScript estricto, `npm audit` y el build de producción. El bundle inicial bajó de 875.17 kB a 306.19 kB minificados. `vite preview` devolvió HTTP 200 para `/` y una ruta profunda de React Router.

El veredicto es **NO LISTO** porque no se pudo probar ningún recorrido autenticado contra el backend, no hay suite de tests configurada y la revisión visual móvil/escritorio no se pudo ejecutar. Persisten rutas de tarjetas que no existen o apuntan a otro rol, pantallas incompletas en documentos/auditoría y una decisión de proceso que afecta el flujo económico. No se generaron capturas ni mediciones Lighthouse; no se atribuyen resultados visuales que no se hayan observado.

La rama parte de un árbol de trabajo que ya tenía numerosos cambios y archivos staged al comenzar la auditoría. Esos cambios se conservaron fuera de los commits de auditoría; el logo continúa staged como estaba al inicio. Los commits siguientes sí están en `audit/frontend`. No se hizo push ni merge.

## Acciones eliminadas, corregidas y conservadas

| Estado | Pantalla/acción | Resultado y evidencia |
|---|---|---|
| Eliminada | Simulación de carga y envío docente de comprobante | Quitados `setTimeout`, URL `/receipts/...` inventada y mensaje de envío exitoso. El backend no ofrece endpoint de carga de archivo. [TeacherLiquidationPage.tsx:433](../src/features/requests/pages/TeacherLiquidationPage.tsx:433), commit `a5a3600`. |
| Corregida | Selección/cálculo en liquidaciones | El cálculo se limita en la UI a cuentas que incluyen `secretaria`; se informa la falta de endpoint de carga. La definición del proceso sigue pendiente. [TeacherLiquidationPage.tsx:25](../src/features/requests/pages/TeacherLiquidationPage.tsx:25), commit `a5a3600`. |
| Eliminada | QR de combustible decorativo | Se retiró la matriz CSS que no era escaneable y se muestra el `order_code` entregado por API. La emisión usa el rol canónico `secretaria`. [DriverFuelTicketsPage.tsx:35](../src/features/requests/pages/DriverFuelTicketsPage.tsx:35), commit `2f490fa`. |
| Corregida | Aprobación económica | Se pide confirmación antes de aprobar y no se fabrican referencias de recibos ni enlaces de descarga. [TransportAuditPanelPage.tsx:75](../src/features/requests/pages/TransportAuditPanelPage.tsx:75), commit `d12fb34`. |
| Corregida | PDF y firma documental | Se quitó la vista previa basada en iframe; el PDF se abre como blob en el navegador, con descarga/compartir y confirmación de firma. [InstitutionalDocumentsPage.tsx:137](../src/features/modules/pages/InstitutionalDocumentsPage.tsx:137), commit `3839800`. No se probó Safari móvil ni Android. |
| Corregida | Expiración/permisos de API | 401 conserva un destino interno y muestra aviso; 403 produce aviso de acceso denegado. [api.ts:32](../src/services/api.ts:32), commits `79b0511`. No se ejecutó en navegador. |
| Corregida | Datos persistidos de autenticación | Se eliminó la persistencia del perfil personal; el bearer token permanece en `localStorage` por el contrato actual. [AuthContext.tsx:61](../src/context/AuthContext.tsx:61), commit `85e7803`. |
| Corregida | Configuración/descargas de API | `VITE_API_BASE_URL` es obligatoria y las descargas usan el cliente común. [api.ts:3](../src/services/api.ts:3), commits `5704b93`, `d7acc81`. |
| Corregida | Confirmación y tipos | TypeScript `strict` está habilitado; se corrigieron tipos de API y advertencias React Hooks en commits `c8abf4a`, `9bee9cf`, `655f828`, `83bd3ed`, `6d7d469`, `ea9be29`. |
| Corregida | Carga de rutas y dependencias | Pantallas con lazy loading; actualizaciones compatibles sin `--force`. Commits `57d25a9`, `88f4df6`. |
| Conservadas | Pantallas y módulos existentes | No se eliminó ninguna pantalla ni componente completo. El inventario registra acciones incompletas y rutas rápidas dudosas. |

## Hallazgos corregidos

| Hallazgo | Cambio | Commit |
|---|---|---|
| Perfil con cédula/correo persistido en storage | Se conserva el token necesario y se vuelve a consultar `/me`; se limpia `user_data` legado. | `85e7803` |
| Fallbacks a IP/localhost para API y archivos | URL configurada obligatoria y descargas autenticadas a través del cliente central. | `5704b93`, `d7acc81` |
| Tipos de respuesta de solicitudes, combustible y viajes | Respuestas contractuales tipadas; sin `any` detectado en `src/`. | `c8abf4a`, `9bee9cf`, `2f490fa` |
| Errores/estado en React Hooks y lint | Correcciones por módulo; la validación actual no produce warnings de lint. | `655f828`, `83bd3ed`, `6d7d469` |
| Sesión vencida y 403 | Destino interno conservado al volver a login y aviso de acceso denegado. | `79b0511` |
| Chunk principal superior a 500 kB | Carga diferida de páginas: de 875.17 kB a 306.19 kB, sin advertencia de tamaño. | `57d25a9` |
| Operación económica irreversible y recibos falsos | Confirmación antes de aprobar; solo se muestra la referencia real entregada por API. | `d12fb34` |
| PDF móvil dependiente de iframe | Apertura nativa del blob, descarga/compartir y confirmación de firma. | `3839800` |
| Archivo/URL docente simulados | Se retiró el falso flujo sin inventar endpoint. | `a5a3600` |
| QR visual que no se podía escanear | Sustituido por el código real del vale y uso del rol canónico. | `2f490fa` |

## Contraste frontend/backend y decisiones pendientes

- **Autorización externa:** el código backend implementa **Secretaría y luego Vicerrectorado**. La autorización de Secretaría cambia el estado a `pendiente_rectorado`; Vicerrectorado procesa ese estado. No es “una u otra”. Evidencia: `backend/src/App/Http/Controllers/Request/AutorizarSecretariaController.php`, `AprobarRectoradoController.php` y `backend/routes/api.php`.
- **Reasignación por rechazo:** existe pantalla (`ReassignPage`) y endpoint `PATCH /hojas-ruta/{id}/reasignar`, protegido para Secretaría. No se verificó el traspaso ni la persistencia por falta de API/usuarios.
- **Combustible:** existe pantalla/listado propio de conductor y endpoints para emitir, despachar y consultar una orden individual. No se encontró pantalla ni endpoint de historial agregado de consumos para Secretaría.
- **Roles reales:** el catálogo backend usa `secretaria`, `conductor`, `mecanico`, `docente`, `responsable_facultad`, `vicerrector` y `estudiante`. No existen roles `administrativo` ni `administrador`; `jefe_transporte` es alias de Secretaría. “Administrativo” es texto mostrado por el frontend. `responsable_facultad` sí es rol canónico y sus rutas permiten crear solicitudes y gestionar participantes; no equivale a administrador.
- **Liquidación docente vs. compensación de conductor — requiere mi decisión:** el backend modela `DriverCompensation`. Secretaría calcula/liquida/aprueba; el conductor consulta y confirma o disputa. Docencia puede consultar sus comisiones pendientes, pero no tiene permiso para calcular/enviar esa compensación. El backend no ofrece carga binaria del recibo. ¿Son dos procesos separados? Si la liquidación docente es real, ¿qué rol la presenta y qué endpoint recibe el comprobante?
- **Consumos agregados — requiere definición:** confirmar si Secretaría necesita historial de consumo agregado y solicitar endpoint/contrato si entra en alcance.
- **Auditoría administrativa — requiere definición:** backend ofrece `/logs-sistema` y rutas `admin/*`, sin pantallas correspondientes. Confirmar si entran en la tesis y qué rol organizacional debe acceder; no existe rol administrador en el catálogo.
- **Firma documental:** la pantalla permite generar, adjuntar y firmar; el endpoint `GET /documentos/{id}/verificar` no tiene acción/UI localizada. La verificación criptográfica sigue incompleta.
- **Funciones con UI y backend identificados:** registro, paradas, actas mediante `/actas-entrega`, firma y reasignación tienen pantalla/llamadas estáticas. La variante `POST /actas-recepcion-llegada` tiene helper, pero no uso localizado; la llegada desde checklist usa `/actas-entrega`. No se confirmó con backend si ambas variantes tienen el mismo propósito.
- **Rutas UI:** quedan enlaces rápidos con paths inexistentes o incompatibles con el rol en varias páginas; evidencia agrupada en [inventario-acciones.md](inventario-acciones.md). No se añadieron alias o pantallas sin contrato.

## Estado de los ocho flujos

| Flujo | Resultado | Evidencia y límite |
|---|---|---|
| 1. Registro e inicio de sesión | No verificado | UI, guards y catálogo inspeccionados estáticamente; no hubo cuentas ni prueba de sesión/401/403 en navegador. |
| 2. Solicitud → autorizaciones → asignación → conductor → reasignación → ejecución/cierre | No verificado | Endpoints y pantallas existen en código. Autorización externa es secuencial Secretaría→Vicerrectorado; traspasos/estados no se probaron con API. Persisten enlaces UI rotos. |
| 3. Invitación → respuesta → consulta → evaluación | No verificado | Pantallas y endpoints encontrados; sin actores ni API para verificar persistencia y notificaciones. |
| 4. Inspección/acta → paradas → llegada/cierre | No verificado | Pantallas y llamadas identificadas; no se probó móvil, guardado, pérdida de conexión ni contrato entre las dos rutas de acta. |
| 5. Vale → despacho → consulta de combustible | No verificado; consulta agregada incompleta | Códigos alfanuméricos reales se muestran; emisión/despacho/consulta individual requieren prueba API. No hay historial agregado identificado para Secretaría. |
| 6. Novedades → mantenimiento → cierre/disponibilidad | No verificado | Pantallas y endpoints estáticos; no se verificó cambio de disponibilidad ni caso de error. |
| 7. Liquidación/compensación → aprobación → confirmación/disputa | **Falla/incompleto por contrato; E2E no verificado** | Se retiró el falso upload; roles de docencia/Secretaría y el proceso requieren decisión. Aprobar pide confirmación; no hubo intercambio real con backend. |
| 8. Documentos → firma/verificación; reportes/auditoría | **Incompleto** | Crear/adjuntar/firmar/reportes tienen llamadas estáticas; verificación `/documentos/{id}/verificar` y UI de `/logs-sistema` no están implementadas. Descarga/PDF no se probó en dispositivos. |

## Verificación reproducible

| Comando o recorrido | Resultado observado |
|---|---|
| `npm ci` (limpio) | Pasa: 201 paquetes instalados, 202 auditados, 0 vulnerabilidades. |
| `npm run lint` | Pasa sin errores ni warnings. |
| `npx tsc --noEmit -p tsconfig.app.json --pretty false --incremental false` | Pasa; además `strict: true`. |
| `npm run test` | Falla porque `package.json` no define script `test`; no existe framework/suite frontend. |
| `npm audit` | Pasa: 0 vulnerabilidades. |
| `VITE_API_BASE_URL=/api npm run build` | Pasa sin warnings relevantes; 249 módulos transformados, JS inicial 306.19 kB minificado (93.92 kB gzip), Leaflet en chunk diferido de 152.40 kB. |
| `npm run preview`; GET `/` | HTTP 200, `text/html`, 1,087 bytes. |
| `npm run preview`; GET `/app/conductor/combustible` | HTTP 200, `text/html`, 1,087 bytes; fallback SPA funciona en Vite Preview. |
| API backend `127.0.0.1:8000` | No disponible; conexión rechazada. Ninguna API funcional se probó. |
| Firefox headless/capturas | No verificable: Firefox falló al iniciar el compositor headless; no se generaron capturas. Playwright/Puppeteer no quedó disponible para recorrer la app. |

## Checklist de producción

| Criterio | Estado | Evidencia/límite |
|---|---|---|
| Build de producción, TypeScript estricto y lint | Cumple estáticamente | Resultados de comandos arriba. |
| Dependencias sin vulnerabilidades conocidas en `npm audit` | Cumple al corte | 0 avisos con el lockfile instalado. |
| `VITE_API_BASE_URL` única, documentada, sin fallback de API a localhost | Cumple en frontend | `src/services/api.ts`, `.env.example`; proxy loopback solo de Vite dev. La URL del entorno productivo aún debe configurarse al compilar. |
| Hosting estático estándar, SPA fallback y assets hasheados | Cumple estáticamente | `README.md`; `vite preview` sirvió ruta profunda. Reglas del hosting real no verificadas. |
| Sourcemaps públicos | Cumple en el build observado | No se encontraron `.map` en `dist/`. |
| Pantalla 404, guards y home por rol | No verificado en navegador | Declarados en `src/App.tsx`; faltan pruebas con roles reales y URLs directas. |
| Rutas UI y acciones sin callejones | No cumple | El inventario conserva rutas rápidas rotas o de otro rol y acciones aún incompletas. |
| Flujos E2E con backend y casos de error | No cumple | API y credenciales de prueba no disponibles; falta script de tests. |
| Responsividad a 320–1920 px/orientación y prioridad de conductor/mecánico | No verificado | Navegador headless no operativo; sin revisión visual ni capturas 360/768/1440. |
| Accesibilidad WCAG AA, teclado, foco/modal y objetivos táctiles | No verificado | Se hicieron mejoras localizadas, pero no se midió contraste ni se recorrieron controles con teclado/dispositivos. |
| Lighthouse ≥90, LCP/CLS/INP | No verificado | No se ejecutó Lighthouse. |
| PDFs, cámara, firma y conectividad irregular en iOS/Android | No verificado | Cambios estáticos en PDF; no hubo pruebas de dispositivo, cámara, persistencia offline o firma táctil. |
| Seguridad del token de sesión | Reserva | Token bearer en `localStorage`; el backend inspeccionado no documenta cookie HttpOnly en este contrato. |
| Endpoint de verificación de firma y auditoría/logs | No cumple | Backend tiene endpoint, pero la UI no los expone. |
| Host/proveedor HTTPS y CORS definitivo | No verificado | Despliegue sin proveedor elegido; HTTPS/CORS deben verificarse en el entorno final. |

## Riesgos residuales y decisiones para continuar

1. Decidir si liquidación docente y compensación del conductor son procesos separados; definir el rol y contrato real de carga del comprobante.
2. Definir si se necesita consumo agregado para Secretaría y proporcionar endpoint si corresponde.
3. Determinar el alcance y permisos de auditoría (`/logs-sistema`) y CRUD `admin/*`; el catálogo no incluye administrador.
4. Resolver las tarjetas con rutas inexistentes o de otro rol enumeradas en `inventario-acciones.md`.
5. Disponer backend ejecutable, fixtures/datos y usuarios por rol (incluido multirol) para validar los 8 recorridos, 401/403 y errores de API.
6. Ejecutar pruebas visuales de escritorio/móvil y guardar capturas antes/después cuando un navegador automatizable esté disponible.
7. Añadir una suite frontend para autenticación, permisos, flujo principal y estados de error.
8. Confirmar con backend una estrategia HttpOnly si se requiere retirar bearer tokens de `localStorage`.

El resultado técnico del build es apto para desplegarse en un hosting estático genérico, pero la aplicación completa **no debe declararse lista para producción** hasta cerrar los puntos funcionales, de permisos y validación visual señalados.
