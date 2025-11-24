async function api(path){
  const res = await fetch(path);
  const contentType = res.headers.get('content-type') || '';
  if(!res.ok){
    let body = '';
    try{ body = await res.text(); }catch(e){}
    const err = new Error(`API error ${res.status} ${res.statusText}: ${body}`);
    err.response = { status: res.status, statusText: res.statusText, body };
    throw err;
  }
  // Si la respuesta es JSON, parseamos, si no devolvemos texto
  if(contentType.includes('application/json')){
    return res.json();
  }
  return res.text();
}

// --- Cart + Login helpers (localStorage) ---
function getCart(){
  try{ return JSON.parse(localStorage.getItem('cart')||'[]') }catch(e){ return [] }
}
function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart||[])); }
function addToCartItem(item){
  const cart = getCart();
  const idx = cart.findIndex(c=>c.id===item.id);
  if(idx>=0){ cart[idx].qty = (cart[idx].qty||1) + (item.qty||1); }
  else { cart.push(Object.assign({qty: item.qty||1}, item)); }
  saveCart(cart);
  updateCartBadge();
}

function showToast(msg){
  const t = document.createElement('div');
  t.textContent = msg; t.style.position='fixed'; t.style.right='18px'; t.style.bottom='18px'; t.style.background='rgba(0,0,0,0.7)'; t.style.color='#fff'; t.style.padding='10px 14px'; t.style.borderRadius='8px'; t.style.zIndex=2000; document.body.appendChild(t);
  setTimeout(()=>t.remove(),2200);
}

// Cart badge
function updateCartBadge(){
  const count = (getCart()||[]).reduce((s,i)=>s + (i.qty||0),0);
  const el = document.querySelector('.cart .cart-count');
  if(!el) return;
  // Si no hay items, ocultamos el número y quitamos la clase del puntito
  if(count <= 0){
    el.textContent = '';
    el.classList.remove('has-dot');
    el.setAttribute('aria-hidden', 'true');
    el.removeAttribute('aria-label');
    return;
  }

  // Si hay items, mostramos solo un puntito visual y dejamos la información accesible
  el.textContent = '';
  el.classList.add('has-dot');
  el.setAttribute('aria-hidden', 'false');
  // Proveer texto accesible para lectores de pantalla
  el.setAttribute('aria-label', `${count} artículos en el carrito`);
}

// Login modal (simple client-side mock)
function isLogged(){ return !!localStorage.getItem('user'); }
function showLoginModal(){
  const bd = document.getElementById('login-backdrop');
  if(!bd) return;
  // Mostrar modal sin alert (demo notice removed)
  bd.classList.add('show'); bd.setAttribute('aria-hidden','false');
}
function hideLoginModal(){ const bd = document.getElementById('login-backdrop'); if(!bd) return; bd.classList.remove('show'); bd.setAttribute('aria-hidden','true'); }
function setupLoginHandlers(){
  const bd = document.getElementById('login-backdrop'); if(!bd) return;
  const cancel = bd.querySelector('#login-cancel'); const submit = bd.querySelector('#login-submit');
  cancel?.addEventListener('click', (e)=>{ e.preventDefault(); hideLoginModal(); });
  submit?.addEventListener('click', (e)=>{
    e.preventDefault();
    const name = bd.querySelector('#login-name')?.value||'';
    const email = bd.querySelector('#login-email')?.value||'';
    const pass = bd.querySelector('#login-pass')?.value||'';
    if(!email || !pass){ alert('Introduce email y contraseña'); return; }
    // Intentar login contra el endpoint /auth/login (demo)
    fetch('/auth/login', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, pass})})
      .then(r=>{ if(!r.ok) throw r; return r.json() })
      .then(user => {
        // Guardamos usuario en localStorage (sin pass)
        localStorage.setItem('user', JSON.stringify(user));
        hideLoginModal(); showToast('Sesión iniciada'); updateCartBadge();
      })
      .catch(async err=>{
        let msg = 'Error iniciando sesión';
        try{ const j = await err.json(); if(j && j.detail) msg = j.detail }catch(e){}
        alert(msg);
      });
  });
}

// Expose useful helpers globally for other page scripts
window.getCart = getCart;
window.saveCart = saveCart;
window.addToCartItem = addToCartItem;
window.showLoginModal = showLoginModal;
window.updateCartBadge = updateCartBadge;


function makeCategoryCard(cat){
  const el = document.createElement('div');
  el.className = 'cat-card';

  el.innerHTML = `
    <div class="cat-left">
      <div class="cat-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" stroke-width="1.6">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" stroke-linejoin="round"/>
        </svg>
      </div>
    </div>
    <div class="cat-body">
      <h3>${cat.name}</h3>
      <p>${cat.description||''}</p>
      <a href="/app/category/${cat.slug || cat.id}" data-id="${cat.slug || cat.id}" class="view" data-nav="page">Ver productos <span class="arrow">→</span></a>
    </div>
  `;

  return el;
}

function makeProductCard(p){
  const el = document.createElement('div');
  el.className = 'product';

  const imageUrl = p.image_url && p.image_url.length ? p.image_url : '/static/default-product.svg';

  el.innerHTML = `
    <div class="product-media">
      <a href="/app/product/${p.id}"><img src="${imageUrl}" alt="${p.name}" onerror="this.onerror=null;this.src='/static/default-product.svg'" /></a>
      <button class="fav" title="Favorito" aria-label="Favorito">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6">
          <path d="M20.8 8.6c-.2-.7-.8-1.2-1.6-1.2-.5 0-1 .2-1.4.6L12 13.1 6.2 8c-.8-.7-1.9-.6-2.6.2-.7.8-.6 1.9.2 2.6l6.3 4.9c.4.3.9.5 1.4.5.5 0 1-.2 1.4-.5l6.3-4.9c.4-.3.6-.8.6-1.3 0-.2 0-.4-.1-.6z" stroke-linejoin="round" stroke-linecap="round"/>
        </svg>
      </button>
    </div>
    <div class="product-body">
      <h4><a href="/app/product/${p.id}" style="color:inherit;text-decoration:none">${p.name}</a></h4>
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
        <button class="add" data-id="${p.id}" data-name="${(p.name||'').replace(/"/g,'&quot;')}" data-price="${p.price}" data-image="${imageUrl}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M6 6h15l-1.5 9h-11z" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="9" cy="20" r="1"/>
            <circle cx="19" cy="20" r="1"/>
          </svg>
          Agregar
        </button>
      </div>
    </div>
  `;

  return el;
}

async function loadIndex(){
  try{
    const data = await api('/index');
    const cats = document.getElementById('categories-list');
    cats.innerHTML='';
    (data.categories||[]).forEach(c=>cats.appendChild(makeCategoryCard(c)));

    const featured = document.getElementById('featured-list');
    featured.innerHTML='';
    (data.featured||[]).forEach(p=>featured.appendChild(makeProductCard(p)));
  }catch(e){
    console.error(e);
  }
}

document.addEventListener('click', async (ev)=>{
  // Añadir al carrito (botón .add)
  const addBtn = ev.target.closest('.add');
  if(addBtn){
    ev.preventDefault();
    const id = addBtn.dataset.id;
    if(!id) return;
    try{
      // Primero intentamos leer los datos directamente del botón (evita la petición si ya tenemos los datos)
      const name = addBtn.dataset.name;
      const price = addBtn.dataset.price;
      const image = addBtn.dataset.image;
      if(name !== undefined && price !== undefined){
        addToCartItem({id: id, name: name, price: Number(price)||0, image_url: image});
        showToast('Producto agregado al carrito');
      } else {
        // Fallback: obtener desde la API si no tenemos los datos en el DOM
        const prod = await api(`/products/${encodeURIComponent(id)}`);
        if(!prod) throw new Error('Producto no encontrado');
        if(prod.id === undefined || prod.id === null){
          console.error('Producto obtenido sin id', prod);
          throw new Error('Producto inválido: id faltante');
        }
        addToCartItem({id: prod.id, name: prod.name, price: prod.price, image_url: prod.image_url});
        showToast('Producto agregado al carrito');
      }
    }catch(err){
      console.error('Error agregando al carrito', err);
      let msg = 'Error agregando al carrito';
      try{
        if(err instanceof Response){
          const txt = await err.text();
          if(txt) msg = txt;
        } else if(err && err.message){
          msg = err.message;
        }
      }catch(e){}
      showToast(msg);
    }
    return;
  }
  const a = ev.target.closest('.view');
  if(a){
    // si el enlace está destinado a navegar a otra página (data-nav=page), dejamos que el navegador lo haga
    if(a.dataset && a.dataset.nav === 'page') return;
    ev.preventDefault();
    const id = a.dataset.id;
    const card = a.closest('.cat-card');
    const name = card.querySelector('h3').textContent;
    // Usamos category_id cuando está disponible (más fiable)
    const prods = id ? await api(`/products?category=${encodeURIComponent(id)}`) : await api(`/products?category=${encodeURIComponent(name)}`);
    const featured = document.getElementById('featured-list');
    featured.innerHTML='';
    // actualizamos el título de la sección para indicar la categoría
    const featSection = document.querySelector('.featured');
    const header = featSection.querySelector('h2');
    header.textContent = name;
    (prods||[]).forEach(p=>featured.appendChild(makeProductCard(p)));
    window.scrollTo({top: featSection.offsetTop - 20, behavior:'smooth'});
    return;
  }

  // Manejar clicks en enlaces/elementos con data-cat (nav y CTA)
  const nav = ev.target.closest('[data-cat]');
  if(nav && !ev.target.closest('.cat-card')){
    ev.preventDefault();
    const catName = nav.dataset.cat;
    if(!catName) return;
    const prods = await api(`/products?category=${encodeURIComponent(catName)}`);
    const featured = document.getElementById('featured-list');
    featured.innerHTML='';
    const featSection = document.querySelector('.featured');
    const header = featSection.querySelector('h2');
    header.textContent = catName;
    (prods||[]).forEach(p=>featured.appendChild(makeProductCard(p)));
    window.scrollTo({top: featSection.offsetTop - 20, behavior:'smooth'});
    return;
  }
});

window.addEventListener('load', ()=>{
  // Load index only on the index page (presence of categories-list)
  if(document.getElementById('categories-list')){
    loadIndex();
  }
  // Initialize login handlers and cart badge on all pages
  try{ setupLoginHandlers(); }catch(e){}
  try{ updateCartBadge(); }catch(e){}
  // Mostrar enlace de administración si el usuario es admin
  try{
    const u = localStorage.getItem('user');
    if(u){
      const user = JSON.parse(u);
      if(user && user.role === 'admin'){
        const actions = document.querySelector('.header-actions');
        if(actions && !document.getElementById('admin-panel-link')){
          const a = document.createElement('a');
          a.id = 'admin-panel-link';
          a.href = '/app/admin';
          a.className = 'btn-login';
          a.style.marginRight = '8px';
          a.textContent = 'Panel Admin';
          // Insertar antes del botón de login
          const loginBtn = actions.querySelector('.btn-login');
          if(loginBtn) actions.insertBefore(a, loginBtn);
          else actions.appendChild(a);
        }
      }
    }
  }catch(e){ console.error('Error mostrando enlace admin', e); }
});
