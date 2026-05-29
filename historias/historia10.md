# Historia 10 - Evitar reservas duplicadas (conflictos avanzados)

## Descripcion

Como sistema,
quiero evitar reservas duplicadas en la misma maquina,
para impedir solapamientos de horario.

## Objetivo

Asegurar coherencia de disponibilidad y evitar conflictos de agenda.

## Criterios de aceptacion

- No se permiten dos reservas activas superpuestas en una misma maquina.
- El sistema devuelve error claro de conflicto.
- La validacion se aplica en backend y frontend.

## Tareas de implementacion

- Definir regla de solapamiento de intervalos.
- Validar conflicto antes de confirmar reserva.
- Devolver codigo y mensaje de error de negocio.
- Mostrar feedback de conflicto en interfaz.

## Prioridad

Critica.

## Dependencias

Historia 8.

## Estimacion

4 horas.
