# Prode Mundial 2026

App de pronósticos para el Mundial 2026. React + Vite + Tailwind + Firebase.

## Setup

```bash
npm install
npm run dev
```

## Deploy en Vercel

```bash
npm run build
# subir el repo a GitHub y conectar en vercel.com
```

## Configuración inicial en Firebase

### 1. Firestore Rules
Copiar el contenido de `firestore.rules` en la consola de Firebase → Firestore → Reglas.

### 2. Crear tu usuario admin
1. Registrarte normalmente en la app
2. Ir a Firebase Console → Firestore → colección `usuarios`
3. Abrir tu documento y cambiar:
   - `esAdmin: true`
   - `activo: true`

### 3. Activar usuarios (cuando confirman el pago)
En el Panel Admin → pestaña Usuarios → click en "Inactivo" para activar.

## Estructura de Firestore

```
usuarios/{uid}
  nombre, email, activo, esAdmin, puntos, exactos, parciales, creadoEn

pronosticos/{uid}
  {matchId}: { golesLocal, golesVisitante, guardadoEn }

resultados/oficial
  {matchId}: { golesLocal, golesVisitante }
```

## Sistema de puntos
- ✅ 3 puntos → resultado exacto
- ⚡ 1 punto  → ganador o empate correcto
- ❌ 0 puntos → sin acierto
