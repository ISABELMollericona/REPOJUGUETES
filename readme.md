Setup rápido - Supabase + admin demo

- Ejecuta `supabase_setup.sql` en el editor SQL de tu proyecto Supabase.
- Reemplaza los UUIDs de ejemplo por los ids reales de tus usuarios Auth, o crea usuarios en Auth y copia sus ids.
- El script crea `app_users` (tabla de perfiles/roles), `products` y habilita RLS; la policy permite INSERT/UPDATE/DELETE sólo a `app_users.role = 'admin'`.

Uso en el demo local

- La página admin (`/app/admin`) usa un header HTTP `x-user-id` para identificar el usuario que realiza las solicitudes. En la demo el script pedirá ese id y lo almacenará en `localStorage.user`.
- Para producción debes integrar Supabase Auth en el frontend y verificar el JWT en el backend (o usar directamente `auth.uid()` en las policies de Postgres).

Archivos añadidos:
- `supabase_setup.sql` — script SQL para crear tablas y policies de ejemplo.
- `frontend/admin.html` + `frontend/admin.js` — UI mínima para crear/editar/eliminar productos; usa `x-user-id`.

