-- Script: inserts_supabase.sql
-- Propósito: limpiar tablas `categories` y `products` y crear 4 categorías
-- (Avengers, Avengers Villanos, Guardianes de la Galaxia, Guardianes Villanos)
-- con hasta 8 productos cada una, tal como solicitaste.

BEGIN;

-- Eliminar datos anteriores (si existían) y reiniciar secuencias
TRUNCATE TABLE public.products RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.categories RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.app_users RESTART IDENTITY CASCADE;

-- Insertar categorías principales (incluimos `slug` porque la tabla lo requiere)
INSERT INTO public.categories (name, slug, description) VALUES
	('Avengers', 'avengers', 'Héroes principales de los Avengers'),
	('Avengers Villanos', 'avengers-villanos', 'Enemigos de los Avengers'),
	('Guardianes de la Galaxia', 'guardianes-de-la-galaxia', 'Héroes cósmicos de los Guardianes'),
	('Guardianes Villanos', 'guardianes-villanos', 'Enemigos de los Guardianes');

-- Insertar productos: la tabla `products` en tu instancia usa una columna
-- de tipo texto `category`, por eso asignamos el nombre de la categoría
-- directamente en ese campo en lugar de usar `category_id`.
-- Avengers (8)
INSERT INTO public.products (name, description, price, image_url, category) VALUES
	('Iron Man Mk85', 'Armour avanzado de Tony Stark', 3999, null, 'Avengers'),
	('Capitán América', 'Steve Rogers, símbolo de justicia', 3599, null, 'Avengers'),
	('Thor', 'Dios del trueno', 3799, null, 'Avengers'),
	('Hulk', 'Fuerza bruta y furia', 3499, null, 'Avengers'),
	('Black Panther', 'Rey de Wakanda', 3299, null, 'Avengers'),
	('Doctor Strange', 'Hechicero Supremo', 3299, null, 'Avengers'),
	('Spider-Man', 'El amigable vecino', 2899, null, 'Avengers'),
	('Hawkeye', 'Arquero experto', 2499, null, 'Avengers');

-- Avengers Villanos / Enemigos de Avengers (8)
INSERT INTO public.products (name, description, price, image_url, category) VALUES
	('Thanos', 'Titán loco buscador del equilibrio', 4599, null, 'Avengers Villanos'),
	('Loki', 'Señor de las mentiras', 2199, null, 'Avengers Villanos'),
	('Ultron', 'IA letal', 2999, null, 'Avengers Villanos'),
	('Red Skull', 'Nemesis nazi', 1999, null, 'Avengers Villanos'),
	('Magneto', 'Mutante con poder magnético', 2799, null, 'Avengers Villanos'),
	('Taskmaster', 'Refleja habilidades de combate', 1899, null, 'Avengers Villanos'),
	('Hela', 'Diosa de la muerte', 2599, null, 'Avengers Villanos'),
	('Killmonger', 'Rival de Black Panther', 2399, null, 'Avengers Villanos');

-- Guardianes de la Galaxia (8)
INSERT INTO public.products (name, description, price, image_url, category) VALUES
	('Star-Lord', 'Líder de los Guardianes', 2999, null, 'Guardianes de la Galaxia'),
	('Gamora', 'La mejor asesina', 1999, null, 'Guardianes de la Galaxia'),
	('Rocket Raccoon', 'Experto en armas y mecánica', 2199, null, 'Guardianes de la Galaxia'),
	('Drax', 'Guerrero fuerte', 1899, null, 'Guardianes de la Galaxia'),
	('Groot', 'Arbolito poderoso', 1499, null, 'Guardianes de la Galaxia'),
	('Nebula', 'Guerrera cibernética', 1799, null, 'Guardianes de la Galaxia'),
	('Mantis', 'Empática alienígena', 1699, null, 'Guardianes de la Galaxia'),
	('Cosmo', 'Perro telepático espacial', 1299, null, 'Guardianes de la Galaxia');

-- Enemigos de Guardianes de la Galaxia (8)
INSERT INTO public.products (name, description, price, image_url, category) VALUES
	('Ronan', 'Destroyer Kree', 2399, null, 'Guardianes Villanos'),
	('Yondu (villano)', 'Capitán del grupo espacial', 1999, null, 'Guardianes Villanos'),
	('Ego', 'Entidad viviente planeta', 2999, null, 'Guardianes Villanos'),
	('Ayesha', 'Líder religiosa de los Sovereign', 1799, null, 'Guardianes Villanos'),
	('Taserface', 'Pirata genocida', 1399, null, 'Guardianes Villanos'),
	('High Evolutionary', 'Científico supremo', 2499, null, 'Guardianes Villanos'),
	('Super-Skrull', 'Skrull con poderes combinados', 1599, null, 'Guardianes Villanos'),
	('Thanos (enemigo cósmico)', 'Amenaza cósmica recurrente', 4599, null, 'Guardianes Villanos');

COMMIT;

-- Insertar usuarios de ejemplo con contraseña (demo, NO USAR EN PRODUCCIÓN)
BEGIN;
INSERT INTO public.app_users (id, email, pass, role) VALUES
	('00000000-0000-0000-0000-000000000001', 'user@example.com', 'userpass', 'user')
	ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_users (id, email, pass, role) VALUES
	('00000000-0000-0000-0000-000000000002', 'admin@example.com', 'adminpass', 'admin')
	ON CONFLICT (id) DO NOTHING;
COMMIT;

