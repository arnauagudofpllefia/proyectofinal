# Historia 7 - Generacion de slots horarios

## Descripcion

Como sistema,
quiero generar franjas horarias de reserva,
para organizar la disponibilidad de cada maquina.

## Objetivo

Ofrecer slots reservables segun fecha, estado y capacidad.

## Criterios de aceptacion

- Se muestran slots por fecha para una maquina.
- Cada slot indica disponibilidad y estado.
- Los slots bloqueados no permiten reserva.
- Se respetan reglas de apertura y cierre.

## Tareas de implementacion

- Consumir endpoint de slots por maquina.
- Normalizar formato de horas y plazas.
- Renderizar selector de fecha y slot.
- Bloquear interaccion en slots no reservables.

## Prioridad

Alta.

## Dependencias

Historia 5 y 6.

## Estimacion

5 horas.
