# Historia 9 - Cancelar reservas

## Descripcion

Como usuario,
quiero cancelar una reserva activa,
para liberar la franja cuando no pueda asistir.

## Objetivo

Permitir anulacion de reservas propias con reflejo inmediato en el sistema.

## Criterios de aceptacion

- El usuario puede cancelar reservas propias.
- La reserva se marca como cancelada o deja de figurar como activa.
- Se muestra mensaje de confirmacion.
- No se permite cancelar reservas no cancelables.

## Tareas de implementacion

- Anadir accion de cancelar en Mis reservas.
- Conectar endpoint de cancelacion.
- Refrescar listado tras la cancelacion.
- Manejar errores y estados invalidos.

## Prioridad

Alta.

## Dependencias

Historia 8.

## Estimacion

4 horas.
