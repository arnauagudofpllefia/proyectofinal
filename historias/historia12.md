# Historia 12 - Generacion de disponibilidad en tiempo real (cierre del SaaS)

## Descripcion

Como sistema,
quiero reflejar disponibilidad en tiempo real y notificar al usuario,
para ofrecer informacion fiable y cerrar el flujo completo del producto.

## Objetivo

Sincronizar cambios de reservas con disponibilidad y notificaciones de usuario.

## Criterios de aceptacion

- La disponibilidad se actualiza tras cambios de reserva.
- El usuario recibe recordatorio antes de su reserva.
- El centro de notificaciones muestra eventos relevantes.
- El contador de no leidas se mantiene actualizado.

## Tareas de implementacion

- Configurar refresco de disponibilidad y estado de reservas.
- Integrar scheduler de recordatorios y service worker.
- Implementar listado y marcado de notificaciones.
- Sincronizar campana de notificaciones en cabecera.

## Prioridad

Media-Alta.

## Dependencias

Historia 8 y 11.

## Estimacion

6 horas.
