# Orden: gestionar reservas

## Objetivo
Gestionar el flujo de solicitudes de reserva de los usuarios (Fase 1.5 o Fase 2).

## Antes de empezar
- Lee `reglas-generales.md` y el Documento Maestro (§3.7).
- **Regla de oro:** Platemaroc nunca inventa disponibilidad.

## Pasos
1. **Fase 1.5 (Formulario por email):** Revisa las solicitudes recibidas. Si son correctas, marca como `solicitada` y envía un correo de notificación al restaurante para que confirme o rechace manualmente.
2. **Fase 2 (Integración real):** Sincroniza con el sistema externo. Si la API confirma la mesa, cambia el estado a `confirmada`. Si falla, `rechazada` o `cancelada`.
3. Asegúrate de recoger solo los datos mínimos del cliente (nombre, email/teléfono, número de personas).
4. Registra cada cambio de estado en la tabla de auditoría.

## Entregable
Informe del estado de las reservas de la semana, incidencias y confirmación de que no se ha inventado disponibilidad en ningún caso.
