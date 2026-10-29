# Orden: moderar reseñas

## Objetivo
Revisar las reseñas pendientes y preparar una decisión de moderación clara y justificada.

## Antes de empezar
- Lee `reglas-generales.md` y el Documento Maestro (§3.3).
- El acceso a los datos debe ser por API interna o Supabase autorizado.

## Pasos
1. Obtén las reseñas con estado `pendiente`.
2. Clasifícalas: aprobada, spam, ofensiva, datos personales, conflicto de intereses o falsa.
3. Para las rechazadas, redacta el motivo exacto de forma objetiva.
4. Registra la decisión en el sistema y genera la entrada de auditoría (`origen = claude_code`).
5. No publiques ni retires definitivamente fuera del flujo de aprobación.

## Entregable
Informe en `resultados/` con la tabla de reseñas, clasificación, motivo, acción propuesta y elementos que requieren aprobación del titular.
