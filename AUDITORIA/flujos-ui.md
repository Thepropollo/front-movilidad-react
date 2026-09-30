# Estado de recorridos UI/E2E

Fecha: 2026-09-29. No había backend respondiendo en 127.0.0.1:8000 ni credenciales de todos los roles disponibles. La inspección fue estática. “No verificado” significa que la pantalla no se recorrió contra una API real, aunque existan componentes y llamadas en código.

| Flujo | Rol y paso | Resultado | Evidencia | Commit |
|---|---|---|---|---|
| 1. Registro e inicio de sesión | Anónimo: registro/login; después guard por rol | No verificado | src/App.tsx:63-76; src/context/AuthContext.tsx:81-127; backend RegisterController permite solo docente/estudiante. | — |
| 1. Registro e inicio de sesión | Cuenta sin rol / acceso directo a cada ruta | No verificado | RoleRoute.tsx:15-37; no se probó sesión ni acceso directo en navegador. | — |
| 2. Solicitud y autorizaciones | Docente/facultad crea → Secretaría autoriza | No verificado | RequestFormPage llama POST /solicitudes; backend routes/api.php:77-82. | — |
| 2. Solicitud y autorizaciones | Secretaría autoriza interna o remite externa | No verificado | API establece externa → pendiente_rectorado en AutorizarSecretariaController. | — |
| 2. Solicitud y autorizaciones | Vicerrector aprueba/rechaza externa | No verificado | RectorPanelPage llama PATCH /solicitudes/{id}/aprobar-rectorado; middleware backend en api.php:123-125. | — |
| 2. Solicitud y autorizaciones | Secretaría asigna → conductor responde → posible reasignación | No verificado | /hojas-ruta y /reasignar en api.php:100-101; respuesta conductor línea 142; pantallas en TransportPanelPage, ConductorTripsPage, ReassignPage. | — |
| 2. Solicitud y autorizaciones | Ejecución, cierre y consulta documental | No verificado | ChecklistDigitalPage, ConductorRouteMapPage y InstitutionalDocumentsPage tienen llamadas; no hubo API. | — |
| 3. Participantes | Docente invita → estudiante acepta/rechaza → consulta → evalúa | No verificado | modulesApi /participantes, /mis-invitaciones y /evaluaciones; estudiantes en api.php:135-137. | — |
| 4. Actas y paradas | Inspección de salida → parada/km → inspección de llegada → cierre | No verificado | ChecklistDigitalPage llama /actas-entrega; ConductorRouteMapPage registra paradas; backend routes/api.php:157-160, 178-181. | — |
| 5. Combustible | Secretaría emite orden → estación despacha → conductor consulta | No verificado | fuel.ts llama /ordenes-combustible, /despachar y /mis-ordenes-combustible; api.php:116-118, 146. El falso QR se reemplazó por order_code. | 2f490fa |
| 5. Combustible | Consultar consumo agregado por Secretaría | Incompleto | No se encontró pantalla ni ruta backend de lista general; hay detalle de orden y lista propia del conductor. | — |
| 6. Mantenimiento | Conductor reporta novedad → mecánico crea/cierra OT → disponibilidad | No verificado | workshop.ts consume /novedades, /ordenes-taller y /insumos; api.php:147, 161-166. | — |
| 7. Liquidación/compensación | Docente adjunta comprobante y remite liquidación | Falla (contrato incompleto) | La simulación de archivo y el falso éxito fueron retirados en a5a3600. El backend reserva el cálculo/envío a Secretaría y no expone carga de archivo; el proceso docente frente a DriverCompensation requiere decisión. | a5a3600 |
| 7. Liquidación/compensación | Secretaría aprueba compensación → conductor confirma/disputa | No verificado | postTrip.ts y modules/api.ts conectan endpoints. La aprobación solicita confirmación nativa antes del POST (d12fb34); no se probó API ni el traspaso. | d12fb34 |
| 8. Documentos | Generar/adjuntar/firmar/descargar | No verificado | InstitutionalDocumentsPage llama a endpoints correspondientes; no se abrió navegador ni API. | — |
| 8. Documentos | Verificar firma | Incompleto | Backend declara GET /documentos/{id}/verificar; la página no tiene llamada encontrada. | — |
| 8. Reportes y auditoría | Consultar/exportar reportes | No verificado | ReportsPage consulta API y hace descarga CSV/PDF; no hubo respuesta HTTP. | — |
| 8. Auditoría | Ver logs de sistema | Incompleto | Backend expone /logs-sistema; ninguna pantalla frontend lo consume. | — |

## Intentos de verificación

- Línea base: npm ci, exit code 0; lint fallaba con 25 errores y 4 warnings; TypeScript pasaba; build pasaba con chunk principal de 875.17 kB.
- Estado corregido: npm run lint, npx tsc --noEmit -p tsconfig.app.json --pretty false --incremental false y VITE_API_BASE_URL=/api npm run build pasan después de cada commit de corrección. El chunk inicial final es de 306.19 kB, sin aviso de tamaño.
- Prueba de build servido: npm run preview; GET / y GET /app/conductor/combustible devolvieron HTTP 200 y text/html (1,087 bytes), comprobando el fallback SPA de Vite Preview.
- Regresión de ruta reportada: GET /app/solicitudes/nueva devolvió HTTP 200 en Vite Preview y tiene redirect según rol en `src/App.tsx` (69c5307). Sin sesión de usuario, el destino React ni el permiso por rol quedaron verificados.
- Tests: npm run test sigue sin estar definido en package.json; no hay suite frontend.
- Auditoría funcional: ningún flujo se ejecutó con usuarios reales ni contra un backend activo; todas las integraciones E2E siguen sin verificar.
- API local: curl a 127.0.0.1:8000 falla por conexión rechazada.
- Browser: Firefox headless no generó capturas; revisión visual y capturas a 360/768/1440 px no verificadas.
