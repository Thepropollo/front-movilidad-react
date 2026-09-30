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
| 5. Combustible | Secretaría emite orden → estación despacha → conductor consulta | No verificado | fuel.ts llama /ordenes-combustible, /despachar y /mis-ordenes-combustible; api.php:116-118, 146. | — |
| 5. Combustible | Consultar consumo agregado por Secretaría | Incompleto | No se encontró pantalla ni ruta backend de lista general; hay detalle de orden y lista propia del conductor. | — |
| 6. Mantenimiento | Conductor reporta novedad → mecánico crea/cierra OT → disponibilidad | No verificado | workshop.ts consume /novedades, /ordenes-taller y /insumos; api.php:147, 161-166. | — |
| 7. Liquidación/compensación | Docente adjunta comprobante y remite liquidación | Falla estática | TeacherLiquidationPage fabrica una URL con setTimeout; luego usa endpoint bajo rol Secretaría. No requiere llamada al backend para comprobar la inconsistencia de código/permiso. | — |
| 7. Liquidación/compensación | Secretaría aprueba compensación → conductor confirma/disputa | No verificado | postTrip.ts y modules/api.ts conectan endpoints; TransportAuditPanelPage ejecuta aprobación sin modal de confirmación. | — |
| 8. Documentos | Generar/adjuntar/firmar/descargar | No verificado | InstitutionalDocumentsPage llama a endpoints correspondientes; no se abrió navegador ni API. | — |
| 8. Documentos | Verificar firma | Incompleto | Backend declara GET /documentos/{id}/verificar; la página no tiene llamada encontrada. | — |
| 8. Reportes y auditoría | Consultar/exportar reportes | No verificado | ReportsPage consulta API y hace descarga CSV/PDF; no hubo respuesta HTTP. | — |
| 8. Auditoría | Ver logs de sistema | Incompleto | Backend expone /logs-sistema; ninguna pantalla frontend lo consume. | — |

## Intentos de verificación

- Instalación limpia: npm ci, exit code 0.
- Linter: falla con 25 errores y 4 warnings.
- TypeScript: npx tsc --noEmit -p tsconfig.app.json, exit code 0.
- Tests: npm run test, falla por ausencia de script.
- Producción: npm run build, exit code 0 con advertencia de chunk principal de 875.17 kB.
- API local: curl a 127.0.0.1:8000 falla por conexión rechazada.
- Browser: Firefox headless no generó capturas; revisión visual no verificada.

