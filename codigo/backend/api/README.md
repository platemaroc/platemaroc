# api/
Reservado. La API interna (documentada y autenticada) se implementará con Route Handlers de Next.js que llaman a la lógica de `codigo/backend/` (decisión del 29-10-2026: backend separado en el código, mismo proceso que la web). Hasta entonces, el acceso técnico autorizado es Supabase por scripts/backend o CSV (maestro §5). No hardcodear credenciales ni usar `service_role` en el navegador.

Clientes de Supabase ya definidos: `codigo/backend/supabase/server.ts` (sesión del usuario, RLS) y `server-admin.ts` (service_role, solo servidor).
