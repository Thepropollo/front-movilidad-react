# Frontend del sistema de transporte universitario

Aplicación web para gestionar solicitudes, viajes, flota, combustible, taller,
documentos y reportes. El frontend consume la API del proyecto; no incluye ni
reemplaza el backend.

## Requisitos

- Node.js compatible con Vite 8.
- npm compatible con la versión de Node instalada.

## Instalación y desarrollo

Desde esta carpeta:

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Configura `VITE_API_BASE_URL` en `.env.local` antes de abrir la aplicación. Para
desarrollo local puede usarse el proxy de Vite (`/api`); el destino del proxy se
define en `vite.config.ts`. Si el backend está en otro origen, establece su
URL base completa y confirma que CORS permite el origen del frontend.

## Variables de entorno

| Variable | Uso |
|---|---|
| `VITE_API_BASE_URL` | URL base de la API, obligatoria al compilar. Ejemplo: `/api` si el servidor enruta ese prefijo al backend. |
| `VITE_ENABLE_DEMO_LOGIN` | Habilita los accesos de demostración. Debe permanecer `false` en producción. |
| `VITE_ALLOW_REGISTER` | Muestra el registro público. El backend conserva la autoridad para permitir o rechazar registros. |

Las variables `VITE_*` se incorporan al JavaScript público del navegador. No
coloques contraseñas, tokens privados ni claves de servidor en ellas. Crea el
archivo de entorno apropiado **antes de cada build**; Vite no las consulta en
tiempo de ejecución.

## Comprobaciones y build

```sh
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
npm run preview -- --host 127.0.0.1
```

El resultado estático queda en `dist/`. `npm run test` no está configurado aún;
los recorridos de la aplicación requieren una API disponible y cuentas de
prueba por rol.

## Despliegue estático

Publica el contenido de `dist/` en la raíz del sitio estático y sirve los
archivos con HTTPS. El servidor debe devolver `index.html` para las rutas de la
aplicación que no correspondan a un archivo, para que React Router resuelva las
URLs directas y las recargas. Ejemplo genérico de Nginx:

```nginx
server {
    listen 443 ssl;
    server_name app.example.edu;
    root /srv/www/transporte/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Configura por separado el enrutamiento de `/api` hacia el backend o compila con
la URL pública de la API. El `base` de Vite usa `/` por defecto; si se aloja la
app bajo un subdirectorio, ajusta `base` en `vite.config.ts` antes de generar el
build. Los assets de producción se emiten con nombres versionados y los
sourcemaps públicos están deshabilitados.
