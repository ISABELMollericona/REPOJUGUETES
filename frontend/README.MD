
# Instrucciones para ejecutar el proyecto (desarrollo)

Este proyecto es un demo de ecommerce con backend en FastAPI y un frontend estático (HTML/CSS/JS).
Estas instrucciones asumen Windows + PowerShell (las rutas usan `\.venv\Scripts\Activate`).

Requisitos
- Python 3.10+ instalado
- PowerShell (Windows)

Pasos rápidos (desarrollo)

1) Crear y activar entorno virtual

```powershell
python -m venv .venv
& .\.venv\Scripts\Activate
```

2) Actualizar pip e instalar dependencias mínimas

```powershell
python -m pip install --upgrade pip
python -m pip install httpx python-dotenv fastapi uvicorn
```

Nota: la dependencia oficial `supabase` puede generar conflictos de versión (Pydantic v1 vs v2). Si no la necesitas, omítela. Este proyecto incluye un cliente REST ligero para Supabase y un fallback en memoria, por lo que `supabase` no es obligatorio.

3) Variables de entorno (opcional)

Si quieres conectar con un proyecto Supabase remoto, crea un archivo `.env` en la raíz con estas variables:

```
SUPABASE_URL=https://...   # tu URL de Supabase
SUPABASE_KEY=eyJ...         # tu key de servicio o anon
```

4) Correr el servidor de desarrollo

Ejecuta desde la raíz del proyecto (donde está la carpeta `app`):

```powershell
& .\.venv\Scripts\Activate
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Notas:
- Es importante arrancar `uvicorn` desde la raíz del proyecto para que Python encuentre el paquete `app`.
- Si obtienes `ModuleNotFoundError: No module named 'app'`, cambia al directorio del proyecto o ejecuta con `--app-dir .` (ej: `python -m uvicorn app.main:app --app-dir .`).

5) Abrir la UI (frontend)

- Abre en tu navegador: `http://127.0.0.1:8000/app`
- Página de login demo: `http://127.0.0.1:8000/app/login`

Credenciales demo (backend en memoria)
- admin / 123456  (rol: admin)
- user  / 123456  (rol: user)

Seeding y base de datos
- El backend ejecuta `seed_sample_data()` en el evento `startup` para el fallback en memoria. No necesitas acciones adicionales para probar localmente.
- Si quieres usar Supabase remoto, en la consola SQL de Supabase ejecuta los scripts `supabase_setup.sql` y luego `inserts_supabase.sql` (ubicados en el repositorio) para crear tablas y poblar datos.

Problemas comunes
- Error instalando `supabase` con pip: puede deberse a incompatibilidades entre versiones de `pydantic`. Soluciones: usar un venv limpio, actualizar pip/setuptools, o usar el cliente REST que ya está incluido.
- `uvicorn` muestra `ModuleNotFoundError: No module named 'app'`: asegúrate de ejecutar el comando desde la raíz del proyecto (la carpeta que contiene `app/`) o usa `--app-dir .`.
- Si el puerto 8000 está en uso cambia `--port` (ej. `--port 8001`).

Comandos útiles

```powershell
# activar venv
& .\.venv\Scripts\Activate

# instalar dependencias
python -m pip install httpx python-dotenv fastapi uvicorn

# arrancar servidor en background (Windows):
Start-Process -NoNewWindow -FilePath python -ArgumentList "-m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

# detener (si lo ejecutaste en primer plano): Ctrl+C en la terminal que corre uvicorn
```

Extras — despliegue y supabase
- Para producción usa un servidor ASGI más robusto (Gunicorn + Uvicorn workers en Linux) y una base de datos real.
- Si decides usar la SDK oficial de Supabase, crea un venv nuevo y prueba instalar versiones compatibles; o usa el cliente REST incluido para evitar conflictos.

Si quieres, puedo añadir estas instrucciones al `README.md` principal del repositorio o crear un `requirements.txt` con las dependencias usadas.

