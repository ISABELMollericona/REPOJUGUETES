from fastapi import FastAPI, HTTPException, Query, Header, Depends
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from typing import List, Optional
from fastapi import Body

from app import db
from app.schemas import Category, CategoryCreate, Product, ProductCreate, IndexResponse

app = FastAPI(title="Ecommerce simple (FastAPI + Supabase)")

# Credenciales en memoria para demo (no usar en producción)
AUTH_USERS = {
    "user": {"username": "user", "pass": "123456", "role": "user", "id": "user"},
    "admin": {"username": "admin", "pass": "123456", "role": "admin", "id": "admin"},
}

# Montar archivos estáticos (front-end)
app.mount("/static", StaticFiles(directory="frontend"), name="static")


@app.get("/app", include_in_schema=False)
def serve_frontend():
    return FileResponse("frontend/index.html")


@app.get("/app/login", include_in_schema=False)
def serve_login():
    return FileResponse("frontend/login.html")


@app.get("/app/cart", include_in_schema=False)
def serve_cart():
    return FileResponse("frontend/cart.html")


@app.get("/app/category/{category_slug}", include_in_schema=False)
def serve_category_page(category_slug: str):
    # Servimos la página estática de categoría. El frontend extraerá el slug desde la URL.
    return FileResponse("frontend/category.html")


@app.get("/app/product/{product_id}", include_in_schema=False)
def serve_product_page(product_id: str):
    # Servimos la página de detalle del producto; el JS extraerá el id (puede ser int o uuid)
    return FileResponse("frontend/product.html")


@app.get("/app/admin", include_in_schema=False)
def serve_admin_page():
    return FileResponse("frontend/admin.html")


def require_admin(x_user_id: str = Header(None)):
    """Dependencia para endpoints que requieren rol admin.

    Por simplicidad en desarrollo se espera que el cliente incluya el header
    `x-user-id` con el id del usuario (puede ser el id de Supabase Auth).
    La función comprueba la tabla `app_users` y valida que `role = 'admin'`.
    """
    # Primero comprobamos si el cliente proporciona x-username (cabecera simple para demo)
    x_username = x_user_id
    if x_username:
        user = AUTH_USERS.get(x_username)
        if user:
            if user.get("role") != "admin":
                raise HTTPException(status_code=403, detail="Operación permitida solo para administradores")
            return user

    # Si no, intentamos el comportamiento antiguo (buscar en DB por id)
    if not x_user_id:
        raise HTTPException(status_code=401, detail="x-user-id header requerido")
    users = db.select_where("app_users", "id", x_user_id)
    if not users:
        raise HTTPException(status_code=403, detail="Usuario no autorizado")
    user = users[0]
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Operación permitida solo para administradores")
    return user


@app.get("/", tags=["root"])
def read_root():
    return {"message": "Ecommerce simple con FastAPI + Supabase"}


@app.get("/index", response_model=IndexResponse)
def read_index():
    """Devuelve las categorías y los productos destacados (limit 8)."""
    categories = db.select_all("categories") or []
    featured = db.select_limit("products", limit=8) or []
    return {"categories": categories, "featured": featured}


@app.post('/auth/login')
def login(payload: dict = Body(...)):
    """Login demo (en memoria): acepta JSON {"username": "...", "pass": "..."}.

    Este endpoint valida contra la tabla `AUTH_USERS` en memoria (demo).
    Devuelve el objeto usuario sin el campo `pass`.

    Nota: esto es sólo para demostración local. No uses autenticación de texto plano en producción.
    """
    username = payload.get('username')
    password = payload.get('pass')
    if not username or not password:
        raise HTTPException(status_code=400, detail='username y pass requeridos')

    # Comprueba en usuarios en memoria
    user = AUTH_USERS.get(username)
    if not user:
        raise HTTPException(status_code=401, detail='Credenciales inválidas')
    if str(user.get('pass','')) != str(password):
        raise HTTPException(status_code=401, detail='Credenciales inválidas')
    safe = dict(user)
    safe.pop('pass', None)
    return safe


@app.on_event("startup")
def on_startup_seed():
    try:
        stats = db.seed_sample_data()
        # sólo registramos en logs — si corres uvicorn verás la salida
        print(f"Seeded sample data: {stats}")
    except Exception as e:
        print(f"Error seeding sample data: {e}")


# Categories
@app.get("/categories", response_model=List[Category])
def list_categories():
    data = db.select_all("categories")
    return data or []


@app.get("/categories/slug/{slug}", response_model=Category)
def get_category_by_slug(slug: str):
    res = db.select_where("categories", "slug", slug)
    if not res:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return res[0]


@app.post("/categories", response_model=Category)
def create_category(cat: CategoryCreate):
    res = db.insert("categories", cat.dict())
    if not res:
        raise HTTPException(status_code=500, detail="Error creando categoría")
    return res[0]


@app.get("/categories/{category_id}", response_model=Category)
def get_category(category_id: int):
    res = db.select_one("categories", category_id)
    if not res:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    return res


@app.put("/categories/{category_id}", response_model=Category)
def update_category(category_id: int, cat: CategoryCreate):
    res = db.update("categories", category_id, cat.dict())
    if not res:
        raise HTTPException(status_code=500, detail="Error actualizando categoría")
    return res[0]


@app.delete("/categories/{category_id}")
def delete_category(category_id: int):
    res = db.delete("categories", category_id)
    if res is None:
        raise HTTPException(status_code=500, detail="Error eliminando categoría")
    return {"deleted": True}


# Products
@app.get("/products", response_model=List[Product])
def list_products(
    category: Optional[str] = Query(None, description="Filtrar por slug de categoría"),
    category_id: Optional[str] = Query(None, description="Filtrar por id de categoría (opcional)"),
):
    """Devuelve productos.

    Se puede filtrar por `category` (slug) o por `category_id` (id de la categoría,
    en cuyo caso buscamos el slug y filtramos por él).
    """
    # Si nos pasan category_id lo usamos para buscar la categoría y su slug
    if category_id is not None:
        cat = db.select_one("categories", category_id)
        if not cat:
            return []
        slug = cat.get("slug") or cat.get("name")
        products = db.select_where("products", "category", slug)
        return products or []

    # Si nos pasan slug de categoría, filtramos por products.category
    if category:
        products = db.select_where("products", "category", category)
        return products or []

    data = db.select_all("products")
    return data or []


@app.post("/products", response_model=Product)
def create_product(prod: ProductCreate, admin=Depends(require_admin)):
    # prod.dict() debe incluir `category` como slug
    res = db.insert("products", prod.dict())
    if not res:
        raise HTTPException(status_code=500, detail="Error creando producto")
    return res[0]


@app.get("/products/{product_id}", response_model=Product)
def get_product(product_id: str):
    res = db.select_one("products", product_id)
    if not res:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return res


@app.put("/products/{product_id}", response_model=Product)
def update_product(product_id: str, prod: ProductCreate, admin=Depends(require_admin)):
    res = db.update("products", product_id, prod.dict())
    if not res:
        raise HTTPException(status_code=500, detail="Error actualizando producto")
    return res[0]


@app.delete("/products/{product_id}")
def delete_product(product_id: str, admin=Depends(require_admin)):
    res = db.delete("products", product_id)
    if res is None:
        raise HTTPException(status_code=500, detail="Error eliminando producto")
    return {"deleted": True}
