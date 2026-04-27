# CLAUDE.md — burger-turnos

## Proyecto
App de turnos y pedidos para puesto callejero de hamburguesas. HTML + JS vanilla + Firebase Realtime Database. Sin frameworks, sin bundlers.

## Nombre del puesto
BurgerTurno 🍔

## Stack
- Firebase Realtime Database (CDN compat v10.7.1)
- HTML/CSS/JS vanilla
- Deploy: Netlify (archivos estáticos)

## Archivos
- `index.html` — vista cliente (acceso por QR)
- `admin.html` — vista vendedor
- `firebase.js` — config Firebase compartida
- `client.js` — lógica cliente
- `admin.js` — lógica admin
- `styles.css` — estilos compartidos

## Estructura Firebase
```
/pedidos/{id}
  turno: number
  nombre: string
  items: [{nombre, cantidad, precio}]
  total: number
  estado: "pendiente" | "completado"
  timestamp: number
```

## Colores
- Fondo: #1A1A1A (negro)
- Primario: #F5A623 (amarillo mostaza)
- Texto: #FFFFFF
- Éxito: #2ECC71
- Tarjetas: #2A2A2A

## Reglas
- Mobile-first siempre (390px base)
- Firebase via CDN, nunca npm
- Sin autenticación
- turno autoincremental desde Firebase (leer max + 1)
- Tiempo transcurrido en tarjetas admin (actualizar cada 30s)

## No hacer
- No usar npm/node para el frontend
- No agregar Firebase Auth
- No usar React/Vue/cualquier framework
- No crear archivos extra innecesarios