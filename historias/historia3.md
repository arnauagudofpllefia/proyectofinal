# Historia 3 - Sistema de roles y permisos

## Descripcion

Como sistema,
quiero diferenciar roles de usuario y administrador,
para restringir accesos segun permisos.

## Objetivo

Garantizar control de acceso a funciones administrativas y proteger rutas segun rol.

## Criterios de aceptacion

- Existen al menos dos roles: user y admin.
- Las rutas de admin solo son accesibles para admin.
- Un usuario sin sesion se redirige a login.
- Los permisos se validan tambien en backend.

## Tareas de implementacion

- Definir rol en el modelo de usuario.
- Crear guardas de sesion y rol en frontend.
- Proteger endpoints criticos en backend.
- Mostrar mensajes de acceso denegado cuando corresponda.

## Prioridad

Alta.

## Dependencias

Historia 2.

## Estimacion

4 horas.
