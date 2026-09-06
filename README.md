# EMAVÍAS — Sistema de Gestión de Obras Viales

Sistema web fullstack para la gestión de obras viales y despachos de asfalto.

**Empresa Municipal de Asfaltos y Vías · Gerencia Técnica · La Paz, Bolivia**

## Tecnologías
- Backend: Node.js + Express + SQLite + JWT
- Frontend: React 18 + Vite + Bootstrap 5

## Instalación
Ver GUIA-INSTALACION.md para instrucciones detalladas.

## Estructura del Proyecto
emavias-sistema/
├── emavias-backend/          ← API REST (Node.js + Express)
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js       ← Autenticación JWT
│   │   │   ├── obras.js      ← CRUD Obras (5 rutas)
│   │   │   └── despachos.js  ← CRUD Despachos (5 rutas + 1 stats)
│   │   ├── middleware/
│   │   │   └── auth.js       ← Middleware JWT
│   │   ├── database.js       ← SQLite + datos de ejemplo
│   │   └── app.js            ← Punto de entrada
│   ├── .env                  ← Variables de entorno
│   └── package.json
│
└── emavias-frontend/         ← App React (Vite)
    ├── src/
    │   ├── api/axios.js      ← Cliente HTTP con interceptores
    │   ├── context/          ← AuthContext (estado global)
    │   ├── components/       ← Navbar, Layout, PrivateRoute
    │   └── pages/
    │       ├── Login.jsx
    │       ├── Dashboard.jsx
    │       ├── obras/        ← ObrasList, ObrasForm, ObrasDetail
    │       └── despachos/    ← DespachosList, DespachosForm
    ├── .env
    └── package.json

## Credenciales de prueba
- admin / 1234
- tony / emavias2025
- gerente / gerencia
