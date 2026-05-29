# Historia 2 - Sistema de autenticacion de usuarios

## Descripcion

Como usuario del sistema,
quiero registrarme e iniciar sesion,
para acceder a las funcionalidades de reserva.

## Objetivo

Implementar autenticacion segura y gestion de sesion para diferenciar usuarios autenticados y no autenticados.

## Criterios de aceptacion

- El usuario puede registrarse con nombre, email, contrasena y gimnasio.
- El email debe ser unico.
- El usuario puede iniciar sesion con credenciales validas.
- El sistema entrega token de autenticacion.
- Las rutas privadas requieren token valido.
- Existe funcionalidad de cierre de sesion.

## Tareas de implementacion

- Implementar formulario de registro.
- Implementar formulario de login.
- Conectar endpoints de autenticacion.
- Guardar token en cliente y cookie.
- Proteger rutas privadas y manejar expiracion de sesion.

## Prioridad

Critica.

## Dependencias

Historia 1.

## Estimacion

6 horas.
