# EMAVÍAS — Sistema de Gestión de Obras Viales

Sistema web fullstack para la gestión de obras viales y despachos de asfalto.

**Empresa Municipal de Asfaltos y Vías · Gerencia Técnica · La Paz, Bolivia**

## Tecnologías
- Backend: Node.js + Express + SQLite + JWT
- Frontend: React 18 + Vite + Bootstrap 5

## Instalación
Ver GUIA-INSTALACION.md para instrucciones detalladas.

## Estructura del Proyecto
```
emavias-sist/
├── emavias-backend/
│ ├── src/
│ │ ├── routes/
│ │ │ ├── auth.js
│ │ │ ├── obras.js
│ │ │ └── despachos.js
│ │ ├── middleware/
│ │ │ └── auth.js
│ │ ├── database.js
│ │ └── app.js
│ └── package.json
│
└── emavias-frontend/
├── src/
│ ├── api/axios.js
│ ├── context/
│ ├── components/
│ └── pages/
│ ├── Login.jsx
│ ├── Dashboard.jsx
│ ├── obras/
│ └── despachos/
├── index.html
├── vite.config.js
└── package.json
```

## Credenciales de prueba
- admin / 1234
- tony / emavias2025
- gerente / gerencia
