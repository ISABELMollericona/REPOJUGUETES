async function api(path, opts){
  const res = await fetch(path, opts);
  if(!res.ok){
    const body = await res.text().catch(()=>null);
    throw new Error(`API error ${res.status} ${res.statusText}: ${body}`);
  }
  try{ return await res.json(); }catch(e){ return null }
}

function renderProductRow(p){
  const el = document.createElement('div');
  // marcar id en el row para facilitar debugging y selección
  el.dataset.id = p.id;
  el.style.display = 'flex'; el.style.justifyContent='space-between'; el.style.alignItems='center'; el.style.background='rgba(255,255,255,0.02)'; el.style.padding='8px'; el.style.borderRadius='8px';
  el.innerHTML = `
    <div>
      <strong>${p.name}</strong>
      <div style="color:var(--muted)">${p.description||''}</div>
      <div style="font-size:12px;color:var(--muted)">Categoria: ${p.category||'—'}</div>
    </div>
    <div style="display:flex;gap:8px;align-items:center">
      <div style="color:var(--accent-2);font-weight:800;margin-right:8px">$ ${p.price}</div>
      <button class="btn btn-ghost btn-edit" data-id="${p.id}">Editar</button>
      <button class="btn btn-ghost btn-delete" data-id="${p.id}">Eliminar</button>
    </div>`;
  return el;
}

function showModal(id){
  const m = document.getElementById(id);
  if(!m) return;
  m.classList.add('show');
  m.setAttribute('aria-hidden','false');
  // retirar inline display si existe para que la clase .show funcione
  try{ m.style.display = ''; }catch(e){}
}

function hideModal(id){
  const m = document.getElementById(id);
  if(!m) return;
  m.classList.remove('show');
  m.setAttribute('aria-hidden','true');
  try{ m.style.display = 'none'; }catch(e){}
}

async function loadCategories(){
  const sel = document.getElementById('p-category');
  // populate both modal selects
  const msel = document.getElementById('m-p-category');
  const esel = document.getElementById('e-p-category');
  if(sel) sel.innerHTML = '';
  if(msel) msel.innerHTML = '';
  if(esel) esel.innerHTML = '';
  const cats = await api('/categories');
  (cats||[]).forEach(c=>{
    const v = c.slug || c.id;
    if(sel){ const o = document.createElement('option'); o.value = v; o.textContent = c.name; sel.appendChild(o); }
    if(msel){ const o = document.createElement('option'); o.value = v; o.textContent = c.name; msel.appendChild(o); }
    if(esel){ const o = document.createElement('option'); o.value = v; o.textContent = c.name; esel.appendChild(o); }
  });
}

async function loadProducts(){
  const container = document.getElementById('admin-products');
  container.innerHTML = '';
  const prods = await api('/products');
  (prods||[]).forEach(p=>container.appendChild(renderProductRow(p)));
}

function getAuthHeader(){
  const user = JSON.parse(localStorage.getItem('user')||'null');
  if(!user) throw new Error('Usuario no autenticado. Accede con credenciales admin.');
  const id = user.username || user.id || user.name || null;
  if(!id) throw new Error('Usuario inválido en sesión');
  return {'x-user-id': id};
}

window.addEventListener('load', async ()=>{
  console.log('[admin] script loaded');
  try{ await loadCategories(); await loadProducts(); }catch(e){ console.error('[admin] carga inicial fallida', e); }

  const btnRefresh = document.getElementById('btn-refresh');
  if(btnRefresh) btnRefresh.addEventListener('click', async (ev)=>{ ev.preventDefault(); await loadProducts(); });

  // Open create modal
  const btnOpenCreate = document.getElementById('open-create');
  if(btnOpenCreate){
    console.log('[admin] attach create button');
    btnOpenCreate.addEventListener('click', (ev)=>{ ev.preventDefault(); showModal('modal-create'); });
  } else { console.warn('[admin] open-create button not found'); }
  const mCreateCancel = document.getElementById('m-create-cancel');
  if(mCreateCancel) mCreateCancel.addEventListener('click', (ev)=>{ ev.preventDefault(); hideModal('modal-create'); });
  const mCreateSubmit = document.getElementById('m-create-submit');
  if(mCreateSubmit) mCreateSubmit.addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const name = document.getElementById('m-p-name').value;
    const desc = document.getElementById('m-p-desc').value;
    const price = Number(document.getElementById('m-p-price').value)||0;
    const image = document.getElementById('m-p-image').value||'';
    const category = document.getElementById('m-p-category').value || null;
    try{
      const headers = Object.assign({'Content-Type':'application/json'}, getAuthHeader());
      await api('/products', {method:'POST', headers, body: JSON.stringify({name, description:desc, price, image_url:image, category})});
      hideModal('modal-create');
      await loadProducts();
    }catch(err){ alert('Error: ' + err.message); }
  });

  // Edit modal handlers
  const mEditCancel = document.getElementById('m-edit-cancel');
  if(mEditCancel) mEditCancel.addEventListener('click', (ev)=>{ ev.preventDefault(); hideModal('modal-edit'); });
  const mEditSubmit = document.getElementById('m-edit-submit');
  if(mEditSubmit) mEditSubmit.addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const id = document.getElementById('e-p-id').value;
    const name = document.getElementById('e-p-name').value;
    const desc = document.getElementById('e-p-desc').value;
    const price = Number(document.getElementById('e-p-price').value)||0;
    const image = document.getElementById('e-p-image').value||'';
    const category = document.getElementById('e-p-category').value || null;
    try{
      const headers = Object.assign({'Content-Type':'application/json'}, getAuthHeader());
      await api(`/products/${id}`, {method:'PUT', headers, body: JSON.stringify({name, description:desc, price, image_url:image, category})});
      hideModal('modal-edit');
      await loadProducts();
    }catch(err){ alert('Error: ' + err.message); }
  });

  // Delete modal handlers
  const mDeleteCancel = document.getElementById('m-delete-cancel');
  if(mDeleteCancel) mDeleteCancel.addEventListener('click', (ev)=>{ ev.preventDefault(); hideModal('modal-delete'); });
  const mDeleteSubmit = document.getElementById('m-delete-submit');
  if(mDeleteSubmit) mDeleteSubmit.addEventListener('click', async (ev)=>{
    ev.preventDefault();
    const id = document.getElementById('d-p-id').value;
    try{
      await api(`/products/${id}`, {method:'DELETE', headers: getAuthHeader()});
      hideModal('modal-delete');
      await loadProducts();
    }catch(err){ alert('Error: ' + err.message); }
  });

  // Delegate clicks on product list to open edit/delete modals and show details
  const prodList = document.getElementById('admin-products');
  if(prodList) prodList.addEventListener('click', async (ev)=>{
    const del = ev.target.closest('.btn-delete');
    const edit = ev.target.closest('.btn-edit');
    const row = ev.target.closest('div');
    if(row && row.dataset && row.dataset.id){ /* not used */ }
    if(edit){
      const id = edit.dataset.id;
      try{
        const prod = await api(`/products/${id}`);
        document.getElementById('e-p-id').value = prod.id;
        document.getElementById('e-p-name').value = prod.name||'';
        document.getElementById('e-p-desc').value = prod.description||'';
        document.getElementById('e-p-price').value = prod.price||0;
        document.getElementById('e-p-image').value = prod.image_url||'';
        document.getElementById('e-p-category').value = prod.category||'';
        showModal('modal-edit');
      }catch(err){ alert('Error cargando producto: ' + err.message); }
    }
    if(del){
      const id = del.dataset.id;
      try{
        const prod = await api(`/products/${id}`);
        document.getElementById('d-p-id').value = prod.id;
        document.getElementById('d-p-msg').textContent = `Eliminar producto "${prod.name}" (ID: ${prod.id})?`;
        showModal('modal-delete');
      }catch(err){ alert('Error cargando producto: ' + err.message); }
    }
  });
  // Close modals on backdrop click
  ['modal-create','modal-edit','modal-delete'].forEach(id=>{
    const m = document.getElementById(id);
    if(!m) return;
    m.addEventListener('click', (ev)=>{
      if(ev.target === m){ hideModal(id); }
    });
  });
});
