# 🛏️ Ejercicio de Cama — Tracker

Registra sesiones de **Ejercicio de Cama** con fecha y hora.
Consulta tus registros por **año**, **mes** o **semana**.

---

## ▶ Cómo correr el proyecto

```bash
# 1. Instalar dependencias (solo la primera vez)
npm install

# 2. Iniciar la app
npm run dev
```

Abre **http://localhost:5173** en tu navegador.

---

## 📁 Estructura

```
ejercicio-cama/
├── index.html
├── vite.config.js
├── package.json
└── src/
    ├── main.jsx
    ├── App.jsx      ← toda la lógica y UI
    └── index.css    ← estilos globales
```

---

## 💾 Almacenamiento

Los datos se guardan en **localStorage** del navegador.
No se necesita servidor ni base de datos.
