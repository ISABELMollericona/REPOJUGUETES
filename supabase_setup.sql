-- Supabase / Postgres setup script
-- 1) Crear tabla de usuarios de la aplicación (vinculada a auth.users)
-- Reemplaza los UUIDs insertados por los ids reales de tus usuarios de Supabase Auth.

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY,
  email text,
  pass text,
  role text NOT NULL DEFAULT 'user',
  inserted_at timestamptz DEFAULT now()
);

-- 2) Tabla de productos (si no existe ya)
CREATE TABLE IF NOT EXISTS public.products (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  description text,
  price numeric,
  image_url text,
  -- En esta instancia usamos el nombre/slug de la categoría como texto.
  -- Esto coincide con `inserts_supabase.sql` que inserta en `category`.
  category text,
  inserted_at timestamptz DEFAULT now()
);

-- 3) Activar RLS en products y crear políticas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Permitir SELECT a usuarios autenticados (o a todos si prefieres)
CREATE POLICY "public_select_products" ON public.products
  FOR SELECT
  USING (true);

-- Permitir INSERT/UPDATE/DELETE sólo a admins registrados en public.app_users
CREATE POLICY "admins_modify_products" ON public.products
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.app_users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.app_users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Si quieres permitir que cualquier autenticado vea productos y sólo admin los modifique,
-- deja la policy de SELECT como true (arriba) y la de modify tal como está.

-- 4) Crear usuarios de ejemplo (REEMPLAZA LOS UUIDs por los de tu proyecto Supabase)
-- Ejemplo: dos usuarios ficticios; el segundo tiene role = 'admin'

INSERT INTO public.app_users (id, email, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'user@example.com', 'user')
  ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_users (id, email, role) VALUES
  ('00000000-0000-0000-0000-000000000002', 'admin@example.com', 'admin')
  ON CONFLICT (id) DO NOTHING;

-- 5) Opcional: si usas una tabla categories también puedes crearla
CREATE TABLE IF NOT EXISTS public.categories (
  id serial PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text
);

-- Fin del script
