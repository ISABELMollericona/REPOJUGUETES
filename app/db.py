"""Módulo de acceso a datos.

Intenta usar Supabase si está disponible y configurado; si no, usa un
fallback en memoria para permitir probar la API sin instalar el SDK.
"""
from typing import Any, Dict, List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Intentamos usar un cliente REST ligero si hay URL configurada
_USE_SUPABASE = False
_use_supabase_rest = False
_supabase_client = None
try:
    if SUPABASE_URL and SUPABASE_KEY:
        # preferimos el cliente REST (httpx) que hemos añadido
        from . import supabase_client as _supabase_client
        _use_supabase_rest = True
        _USE_SUPABASE = True
except Exception:
    _use_supabase_rest = False
    _USE_SUPABASE = False


# --- Fallback en memoria ---
_DATA: Dict[str, List[Dict[str, Any]]] = {
    "categories": [],
    "products": [],
    "app_users": [],
}
_AUTO_INC: Dict[str, int] = {"categories": 1, "products": 1}


def _next_id(table: str) -> int:
    v = _AUTO_INC.get(table, 1)
    _AUTO_INC[table] = v + 1
    return v


def select_all(table: str) -> Optional[List[Dict[str, Any]]]:
    if _USE_SUPABASE and _use_supabase_rest and _supabase_client is not None:
        try:
            return _supabase_client.list_table(table, select="*")
        except Exception:
            return None
    # fallback
    return list(_DATA.get(table, []))


def select_one(table: str, id_value: Any) -> Optional[Dict[str, Any]]:
    if _USE_SUPABASE and _use_supabase_rest and _supabase_client is not None:
        try:
            return _supabase_client.get_by_id(table, str(id_value))
        except Exception:
            return None
    for row in _DATA.get(table, []):
        # comparar IDs como strings para evitar mismatch int vs '1'
        if str(row.get("id")) == str(id_value):
            return dict(row)
    return None


def insert(table: str, payload: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    if _USE_SUPABASE and _use_supabase_rest and _supabase_client is not None:
        try:
            res = _supabase_client.insert(table, payload)
            return [res] if res else None
        except Exception:
            return None
    obj = dict(payload)
    obj["id"] = _next_id(table)
    _DATA.setdefault(table, []).append(obj)
    return [obj]


def update(table: str, id_value: Any, payload: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    if _USE_SUPABASE and _use_supabase_rest and _supabase_client is not None:
        try:
            res = _supabase_client.update(table, str(id_value), payload)
            return [res] if res else None
        except Exception:
            return None
    rows = _DATA.get(table, [])
    for i, row in enumerate(rows):
        if str(row.get("id")) == str(id_value):
            updated = dict(row)
            updated.update(payload)
            rows[i] = updated
            return [updated]
    return None


def delete(table: str, id_value: Any) -> Optional[List[Dict[str, Any]]]:
    if _USE_SUPABASE and _use_supabase_rest and _supabase_client is not None:
        try:
            ok = _supabase_client.delete(table, str(id_value))
            return [{}] if ok else None
        except Exception:
            return None
    rows = _DATA.get(table, [])
    for i, row in enumerate(rows):
        if str(row.get("id")) == str(id_value):
            removed = rows.pop(i)
            return [removed]
    return None


def select_where(table: str, column: str, value: Any) -> Optional[List[Dict[str, Any]]]:
    if _USE_SUPABASE and _use_supabase_rest and _supabase_client is not None:
        try:
            return _supabase_client.list_table(table, filters={column: f"eq.{value}"}, select="*")
        except Exception:
            return None
    return [r for r in _DATA.get(table, []) if r.get(column) == value]


def select_limit(table: str, limit: int = 10) -> Optional[List[Dict[str, Any]]]:
    if _USE_SUPABASE and _use_supabase_rest and _supabase_client is not None:
        try:
            # PostgREST soporta limit en params
            return _supabase_client.list_table(table, select="*", filters={"limit": str(limit)})
        except Exception:
            return None
    return list(_DATA.get(table, []))[:limit]


def seed_sample_data(force: bool = False) -> Dict[str, int]:
    """Inserta categorías y productos de ejemplo.

    Si Supabase está configurado intentará insertar allí; si no, usa el
    fallback en memoria. Por defecto no vuelve a sembrar si ya hay datos,
    a menos que `force=True`.
    Devuelve un dict con conteos insertados.
    """
    result = {"categories": 0, "products": 0}
    existing = select_all("categories") or []
    if existing and not force:
        return {"categories": len(existing), "products": len(select_all("products") or [])}

    # Usamos 4 categorías principales y añadimos slug para compatibilidad
    cats = [
        {"name": "Avengers", "slug": "avengers", "description": "Héroes principales de los Avengers"},
        {"name": "Avengers Villanos", "slug": "avengers-villanos", "description": "Enemigos de los Avengers"},
        {"name": "Guardianes de la Galaxia", "slug": "guardianes-de-la-galaxia", "description": "Héroes cósmicos de los Guardianes"},
        {"name": "Guardianes Villanos", "slug": "guardianes-villanos", "description": "Enemigos de los Guardianes"},
    ]

    inserted_categories = []
    for c in cats:
        res = insert("categories", c)
        if res:
            inserted_categories.extend(res)

    result["categories"] = len(inserted_categories)

    # Mapeo nombre -> slug (inserted_categories debería contener el slug)
    name_to_slug = {c["name"]: (c.get("slug") or c.get("name", "").lower().replace(' ', '-')) for c in inserted_categories}

    products = [
        {"name": "Iron Man Mk85", "description": "Armour avanzado de Tony Stark", "price": 3999, "category": name_to_slug.get("Avengers")},
        {"name": "Capitán América", "description": "Steve Rogers, símbolo de justicia", "price": 3599, "category": name_to_slug.get("Avengers")},
        {"name": "Thor", "description": "Dios del trueno", "price": 3799, "category": name_to_slug.get("Avengers")},
        {"name": "Hulk", "description": "Fuerza bruta y furia", "price": 3499, "category": name_to_slug.get("Avengers")},
        {"name": "Black Panther", "description": "Rey de Wakanda", "price": 3299, "category": name_to_slug.get("Avengers")},
        {"name": "Doctor Strange", "description": "Hechicero Supremo", "price": 3299, "category": name_to_slug.get("Avengers")},
        {"name": "Spider-Man", "description": "El amigable vecino", "price": 2899, "category": name_to_slug.get("Avengers")},
        {"name": "Hawkeye", "description": "Arquero experto", "price": 2499, "category": name_to_slug.get("Avengers")},
        {"name": "Thanos", "description": "Titán loco buscador del equilibrio", "price": 4599, "category": name_to_slug.get("Avengers Villanos")},
        {"name": "Loki", "description": "Señor de las mentiras", "price": 2199, "category": name_to_slug.get("Avengers Villanos")},
        {"name": "Ultron", "description": "IA letal", "price": 2999, "category": name_to_slug.get("Avengers Villanos")},
        {"name": "Red Skull", "description": "Nemesis nazi", "price": 1999, "category": name_to_slug.get("Avengers Villanos")},
        {"name": "Magneto", "description": "Mutante con poder magnético", "price": 2799, "category": name_to_slug.get("Avengers Villanos")},
        {"name": "Taskmaster", "description": "Refleja habilidades de combate", "price": 1899, "category": name_to_slug.get("Avengers Villanos")},
        {"name": "Hela", "description": "Diosa de la muerte", "price": 2599, "category": name_to_slug.get("Avengers Villanos")},
        {"name": "Killmonger", "description": "Rival de Black Panther", "price": 2399, "category": name_to_slug.get("Avengers Villanos")},
        {"name": "Star-Lord", "description": "Líder de los Guardianes", "price": 2999, "category": name_to_slug.get("Guardianes de la Galaxia")},
        {"name": "Gamora", "description": "La mejor asesina", "price": 1999, "category": name_to_slug.get("Guardianes de la Galaxia")},
        {"name": "Rocket Raccoon", "description": "Experto en armas y mecánica", "price": 2199, "category": name_to_slug.get("Guardianes de la Galaxia")},
        {"name": "Drax", "description": "Guerrero fuerte", "price": 1899, "category": name_to_slug.get("Guardianes de la Galaxia")},
        {"name": "Groot", "description": "Arbolito poderoso", "price": 1499, "category": name_to_slug.get("Guardianes de la Galaxia")},
        {"name": "Nebula", "description": "Guerrera cibernética", "price": 1799, "category": name_to_slug.get("Guardianes de la Galaxia")},
        {"name": "Mantis", "description": "Empática alienígena", "price": 1699, "category": name_to_slug.get("Guardianes de la Galaxia")},
        {"name": "Cosmo", "description": "Perro telepático espacial", "price": 1299, "category": name_to_slug.get("Guardianes de la Galaxia")},
        {"name": "Ronan", "description": "Destroyer Kree", "price": 2399, "category": name_to_slug.get("Guardianes Villanos")},
        {"name": "Yondu (villano)", "description": "Capitán del grupo espacial", "price": 1999, "category": name_to_slug.get("Guardianes Villanos")},
        {"name": "Ego", "description": "Entidad viviente planeta", "price": 2999, "category": name_to_slug.get("Guardianes Villanos")},
        {"name": "Ayesha", "description": "Líder religiosa de los Sovereign", "price": 1799, "category": name_to_slug.get("Guardianes Villanos")},
        {"name": "Taserface", "description": "Pirata genocida", "price": 1399, "category": name_to_slug.get("Guardianes Villanos")},
        {"name": "High Evolutionary", "description": "Científico supremo", "price": 2499, "category": name_to_slug.get("Guardianes Villanos")},
        {"name": "Super-Skrull", "description": "Skrull con poderes combinados", "price": 1599, "category": name_to_slug.get("Guardianes Villanos")},
        {"name": "Thanos (enemigo cósmico)", "description": "Amenaza cósmica recurrente", "price": 4599, "category": name_to_slug.get("Guardianes Villanos")},
    ]

    inserted_products = []
    for p in products:
        res = insert("products", p)
        if res:
            inserted_products.extend(res)

    result["products"] = len(inserted_products)

    # Crear usuarios de ejemplo en fallback (ids fijos para demo)
    example_users = [
        {"id": "00000000-0000-0000-0000-000000000001", "email": "user@example.com", "pass": "userpass", "role": "user"},
        {"id": "00000000-0000-0000-0000-000000000002", "email": "admin@example.com", "pass": "adminpass", "role": "admin"},
    ]
    inserted_users = []
    for u in example_users:
        res = insert("app_users", u)
        if res:
            inserted_users.extend(res)
    result["app_users"] = len(inserted_users)
    return result
