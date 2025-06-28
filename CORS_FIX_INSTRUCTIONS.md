# Instrucciones para Solucionar CORS

## El Problema
Flutter Web se ejecuta en un puerto diferente (probablemente http://localhost:xxxx) y cuando intenta conectarse a tu backend en http://localhost:3000, el navegador bloquea la petición por políticas CORS.

## Solución en el Backend (Node.js/Express)

Agrega el siguiente código en tu archivo principal del backend (app.js o server.js):

```javascript
// Importar el paquete cors
const cors = require('cors');

// Configuración de CORS para desarrollo
const corsOptions = {
  origin: function (origin, callback) {
    // Permitir peticiones sin origin (como Postman) y desde localhost
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5000',
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:49430', // Puerto común de Flutter
      'http://localhost:50593', // Otro puerto común de Flutter
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5000',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:8081',
    ];
    
    // En desarrollo, permitir cualquier puerto de localhost
    if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
      callback(null, true);
    } else if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Importante para cookies/auth
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform', 'X-Client-Version', 'User-Agent'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400 // Cache de preflight por 24 horas
};

// Aplicar CORS antes de las rutas
app.use(cors(corsOptions));

// Si no tienes el paquete cors instalado, instálalo:
// npm install cors
```

## Alternativa: Configuración Simple de CORS

Si prefieres una configuración más simple para desarrollo:

```javascript
const cors = require('cors');

// Permitir todas las peticiones en desarrollo
app.use(cors({
  origin: true,
  credentials: true
}));
```

## Solución Temporal (Solo Desarrollo)

Si no puedes modificar el backend ahora, puedes ejecutar Chrome sin seguridad CORS:

### En macOS:
```bash
open -n -a /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --args --user-data-dir="/tmp/chrome_dev_test" --disable-web-security
```

### En Windows:
```bash
chrome.exe --user-data-dir="C:/Chrome dev session" --disable-web-security
```

### En Linux:
```bash
google-chrome --disable-web-security --user-data-dir="/tmp/chrome_dev_test"
```

**IMPORTANTE**: Esta es solo una solución temporal para desarrollo. NUNCA uses este modo para navegación normal.

## Verificación

Después de configurar CORS en el backend:

1. Reinicia tu servidor backend
2. Recarga la aplicación Flutter Web
3. Deberías ver en la consola: "✅ Backend connection: OK"

## Headers CORS Necesarios

Tu backend debe responder con estos headers:

```
Access-Control-Allow-Origin: http://localhost:[puerto-flutter]
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Platform, X-Client-Version
```