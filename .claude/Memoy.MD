# MEMORY.md — contexto del proyecto

## Qué es
Sistema de pedidos y turnos para puesto callejero de hamburguesas en Bogotá.
Demo para mostrar a cliente real hoy mismo y usar como portafolio en Fiverr/Upwork.

## Nombre del negocio demo
BurgerTurno 🍔

## Dos usuarios
1. **Cliente** — entra por QR desde su celular, ve el menú, hace pedido, recibe número de turno
2. **Vendedor** — abre admin.html en su celular, ve pedidos en tiempo real ordenados por turno, marca como listos, ve estadísticas del día

## Estado actual
- [ ] index.html (vista cliente)
- [ ] admin.html (vista admin)
- [ ] firebase.js
- [ ] client.js
- [ ] admin.js
- [ ] styles.css

## Decisiones de diseño
- Tema oscuro estilo street food (fondo negro, amarillo mostaza)
- Firebase CDN sin npm para deploy simple en Netlify
- Sin autenticación para la demo
- Turno autoincremental desde Firebase

## Deploy
Netlify arrastrando la carpeta. Sin build step.
URL del cliente → generar QR → mostrar al vendedor hoy.

## Mejoras futuras (post-venta)
- PIN de acceso al admin
- Sonido al llegar nuevo pedido
- Personalizar menú desde el admin
- Historial por fechas
- Modo "cocina" en tablet