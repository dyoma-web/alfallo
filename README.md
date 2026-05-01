# Al Fallo

Plataforma web responsive para gestión de entrenamientos personalizados, semipersonalizados y grupales.

**Estado**: MVP en desarrollo · Iteración 2 (estructura del repo + tema visual) · piloto colombiano.

---

## Documentación

- [Arquitectura técnica](docs/01-arquitectura.md)
- [Modelo de datos](docs/02-modelo-datos.md)
- [Marco legal y políticas](docs/03-disclaimer-legal.md)
- [Roadmap de desarrollo](docs/04-roadmap.md)

## Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Google Apps Script (Web App)
- **Datastore**: Google Sheets
- **Deploy**: GitHub Pages

## Desarrollo local

```bash
npm install
npm run dev
```

La app se sirve en `http://localhost:5173/alfallo/` (no en la raíz — el `base: '/alfallo/'` del `vite.config.ts` coincide con la ruta de GitHub Pages).

## Build de producción

```bash
npm run build
npm run preview
```

`npm run build` ejecuta `tsc -b && vite build`. Si hay errores de tipos, el build falla — esto es intencional.

## Estructura

```
alfallo/
├── apps-script/      → backend en Google Apps Script (Iteración 3+)
├── docs/             → documentación viva del proyecto
├── public/           → assets estáticos
├── src/              → frontend React
│   ├── components/   → primitivos UI portados de la marca
│   ├── theme.ts      → tokens de diseño
│   ├── App.tsx       → galería de componentes (placeholder)
│   └── main.tsx      → entry point
├── Support_files/    → briefs y design system original (no entra al build)
└── ...
```

Detalle completo en [docs/01-arquitectura.md §8](docs/01-arquitectura.md#8-estructura-de-carpetas-del-repo).

## Iteración actual

Galería de componentes de marca para verificar que la identidad visual se aplicó correctamente. Las features funcionales empiezan en la Iteración 4 (login).

## Licencia

Privativa — todos los derechos reservados. Ver [LICENSE](LICENSE).

---

© 2026 — Operado bajo Ley 1581 de 2012 (Colombia).
