# Historia 8 - Crear reservas (nucleo del sistema)

## Descripcion

Como usuario,
quiero reservar una maquina en una franja concreta,
para planificar mi entrenamiento.

## Objetivo

Permitir creacion de reservas con validacion de disponibilidad.

## Criterios de aceptacion

- El usuario puede seleccionar fecha, hora inicio y hora fin.
- El sistema crea la reserva en estado activa.
- Se muestra confirmacion al finalizar.
- La reserva aparece en Mis reservas.

## Tareas de implementacion

- Implementar formulario de reserva en detalle de maquina.
- Validar campos y horario antes de enviar.
- Conectar endpoint de creacion de reservas.
- Actualizar interfaz con mensajes de exito o error.

## Prioridad

Critica.

## Dependencias

Historia 7.

## Estimacion

6 horas.
