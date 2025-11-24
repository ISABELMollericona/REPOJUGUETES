async function api(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('API error');
  return res.json();
}

function makeProductCard(p){
  const el = document.createElement('div');
  el.className = 'product';
  const imageUrl = p.image_url && p.image_url.length ? p.image_url : '/static/default-product.svg';
  el.innerHTML = `
    <div class="product-media">
      <img src="${imageUrl}" alt="${p.name}" onerror="this.onerror=null;this.src='/static/default-product.svg'" />
    </div>
    <div class="product-body">
      <h4>${p.name}</h4>
      <p class="desc">${p.description||''}</p>
      <div class="product-footer">
        <div class="price">${(() => {
          const v = p.price;
          if (v === null || v === undefined || v === '') return '—';
          if (typeof v === 'number') return `$ ${v.toLocaleString?.() ?? v}`;
          const n = Number(v);
          if (!Number.isNaN(n)) return `$ ${n.toLocaleString?.() ?? n}`;
          return `$ ${v}`;
        })()}</div>
        <button class="add" data-id="${p.id}">Agregar</button>
      </div>
    </div>
  `;
  return el;
}

async function loadCategory(){
  try{
    // extraer slug desde la URL: /app/category/{slug}
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('category');
    const slug = idx >= 0 && parts.length > idx+1 ? parts[idx+1] : null;
    if(!slug){
      document.getElementById('category-title').textContent = 'Categoría no encontrada';
      return;
    }

    // Intentamos por slug; si no existe, intentamos por id (compatiblidad)
    let cat = null;
    try{
      cat = await api(`/categories/slug/${encodeURIComponent(slug)}`);
    }catch(e){
      // si fallo por 404 o similar, probamos por id numérico
      try{
        cat = await api(`/categories/${encodeURIComponent(slug)}`);
      }catch(e2){
        cat = null;
      }
    }

    if(!cat){
      document.getElementById('category-title').textContent = 'Categoría no encontrada';
      return;
    }

    document.getElementById('category-title').textContent = cat.name || 'Categoría';
    const prods = await api(`/products?category=${encodeURIComponent(cat.slug || cat.name || slug)}`);
    const list = document.getElementById('category-products');
    list.innerHTML='';
    (prods||[]).forEach(p=>list.appendChild(makeProductCard(p)));
  }catch(e){
    console.error(e);
    document.getElementById('category-title').textContent = 'Error cargando categoría';
  }
}

window.addEventListener('load', ()=>{ loadCategory(); });
