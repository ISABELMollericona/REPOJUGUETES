"""Cliente ligero para Supabase REST (PostgREST) usando httpx.

Usamos la REST API para evitar dependencias con el SDK oficial y
compatibilizar con versiones de Pydantic/FastAPI en el proyecto.
"""
from typing import Any, Dict, List, Optional
import os
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY") or os.getenv("SUPABASE_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")


def _headers(use_service: bool = False) -> Dict[str, str]:
    key = SUPABASE_SERVICE_KEY if use_service and SUPABASE_SERVICE_KEY else SUPABASE_ANON_KEY
    headers = {
        "apikey": key or "",
        "Authorization": f"Bearer {key}" if key else "",
        "Content-Type": "application/json",
    }
    return headers


def _table_url(table: str) -> str:
    base = SUPABASE_URL.rstrip("/")
    return f"{base}/rest/v1/{table}"


def list_table(table: str, filters: Optional[Dict[str, Any]] = None, select: str = "*") -> List[Dict[str, Any]]:
    url = _table_url(table)
    params = {"select": select}
    if filters:
        params.update(filters)
    r = httpx.get(url, headers=_headers(use_service=False), params=params, timeout=10.0)
    r.raise_for_status()
    return r.json()


def get_by_id(table: str, id_value: str, id_column: str = "id") -> Optional[Dict[str, Any]]:
    url = _table_url(table)
    params = {"select": "*", id_column: f"eq.{id_value}"}
    r = httpx.get(url, headers=_headers(use_service=False), params=params, timeout=10.0)
    r.raise_for_status()
    data = r.json()
    return data[0] if data else None


def insert(table: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    url = _table_url(table)
    headers = _headers(use_service=True)
    headers["Prefer"] = "return=representation"
    r = httpx.post(url, headers=headers, json=payload, timeout=10.0)
    r.raise_for_status()
    data = r.json()
    return data[0] if isinstance(data, list) and data else (data if isinstance(data, dict) else None)


def update(table: str, id_value: str, payload: Dict[str, Any], id_column: str = "id") -> Optional[Dict[str, Any]]:
    url = _table_url(table)
    headers = _headers(use_service=True)
    headers["Prefer"] = "return=representation"
    params = {id_column: f"eq.{id_value}", "select": "*"}
    r = httpx.patch(url, headers=headers, params={id_column: f"eq.{id_value}"}, json=payload, timeout=10.0)
    r.raise_for_status()
    data = r.json()
    return data[0] if isinstance(data, list) and data else (data if isinstance(data, dict) else None)


def delete(table: str, id_value: str, id_column: str = "id") -> bool:
    url = _table_url(table)
    headers = _headers(use_service=True)
    r = httpx.delete(url, headers=headers, params={id_column: f"eq.{id_value}"}, timeout=10.0)
    r.raise_for_status()
    return True


# Helpers específicos
def list_categories() -> List[Dict[str, Any]]:
    return list_table("categories", select="*")


def get_category_by_slug(slug: str) -> Optional[Dict[str, Any]]:
    res = list_table("categories", filters={"slug": f"eq.{slug}"}, select="*")
    return res[0] if res else None


def list_products(category: Optional[str] = None) -> List[Dict[str, Any]]:
    if category:
        # asumimos que `products.category` guarda el slug o nombre exacto
        return list_table("products", filters={"category": f"eq.{category}"}, select="*")
    return list_table("products", select="*")


def get_product(product_id: str) -> Optional[Dict[str, Any]]:
    return get_by_id("products", product_id)


def create_product(data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    return insert("products", data)


def modify_product(product_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    return update("products", product_id, data)


def remove_product(product_id: str) -> bool:
    return delete("products", product_id)
