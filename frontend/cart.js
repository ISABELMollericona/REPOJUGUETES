async function api(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('API error');
  return res.json();
}

function getCart(){ try{ return JSON.parse(localStorage.getItem('cart')||'[]') }catch(e){ return [] } }
function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart||[])); }
function getUser(){ try{ return JSON.parse(localStorage.getItem('user')||'null') }catch(e){ return null } }

function formatPrice(v){ if(v===null||v===undefined||v==='') return '—'; if(typeof v==='number') return `$ ${v.toLocaleString?.() ?? v}`; const n=Number(v); if(!Number.isNaN(n)) return `$ ${n.toLocaleString?.() ?? n}`; return `$ ${v}`; }

function renderCart(){
  const listEl = document.getElementById('cart-list');
  const emptyEl = document.getElementById('cart-empty');
  const totalEl = document.getElementById('cart-total');
  const cart = getCart();
  listEl.innerHTML = '';
  if(!cart || cart.length===0){ emptyEl.style.display='block'; totalEl.textContent = '$ 0'; return; }
  emptyEl.style.display='none';
  let total = 0;
  cart.forEach(item=>{
    total += (Number(item.price)||0) * (item.qty||1);
    const it = document.createElement('div'); it.className='cart-item';
    it.innerHTML = `
      <div class="media"><img src="${item.image_url||'/static/default-product.svg'}" alt="${item.name}" onerror="this.onerror=null;this.src='/static/default-product.svg'"/></div>
      <div class="meta">
        <h4>${item.name}</h4>
        <p>${formatPrice(item.price)}</p>
      </div>
      <div class="qty">
        <button class="qty-dec" data-id="${item.id}">-</button>
        <div class="qty-val">${item.qty||1}</div>
        <button class="qty-inc" data-id="${item.id}">+</button>
        <button class="remove" data-id="${item.id}" style="margin-left:8px">Eliminar</button>
      </div>
    `;
    listEl.appendChild(it);
  });
  totalEl.textContent = formatPrice(total);
}

function updateQty(id, delta){
  const cart = getCart();
  const idx = cart.findIndex(c=>c.id==id);
  if(idx<0) return;
  cart[idx].qty = Math.max(1, (cart[idx].qty||1) + delta);
  saveCart(cart); renderCart();
}

function removeItem(id){
  let cart = getCart(); cart = cart.filter(c=>c.id!=id); saveCart(cart); renderCart();
}

function clearCart(){ localStorage.removeItem('cart'); renderCart(); }

function showLoginModal(){ const bd = document.getElementById('login-backdrop'); if(!bd) return; bd.classList.add('show'); bd.setAttribute('aria-hidden','false'); }
function hideLoginModal(){ const bd = document.getElementById('login-backdrop'); if(!bd) return; bd.classList.remove('show'); bd.setAttribute('aria-hidden','true'); }

function setupLoginHandlers(){
  const bd = document.getElementById('login-backdrop'); if(!bd) return;
  const cancel = bd.querySelector('#login-cancel');
  const submit = bd.querySelector('#login-submit');
  cancel?.addEventListener('click', (e)=>{ e.preventDefault(); hideLoginModal(); });
  submit?.addEventListener('click', async (e)=>{
    e.preventDefault();
    const username = bd.querySelector('#login-name')?.value||'';
    const pass = bd.querySelector('#login-pass')?.value||'';
    if(!username || !pass){ alert('Introduce usuario y contraseña'); return; }
    try{
      const res = await fetch('/auth/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({username, pass})
      });
      if(!res.ok){
        const body = await res.text();
        console.error('Login failed', res.status, body);
        alert('Credenciales inválidas');
        return;
      }
      const user = await res.json();
      localStorage.setItem('user', JSON.stringify(user));
      hideLoginModal();
      renderCart();
    }catch(err){ console.error('Login error', err); alert('Error de conexión'); }
  });
}

window.addEventListener('load', ()=>{
  renderCart();
  setupLoginHandlers();

  document.getElementById('clear-cart')?.addEventListener('click', (e)=>{ e.preventDefault(); if(confirm('Vaciar carrito?')) clearCart(); });

  document.getElementById('checkout')?.addEventListener('click', (e)=>{
    e.preventDefault(); const user = getUser(); if(!user){ showLoginModal(); return; }
    alert('Procediendo al pago (demo). Gracias, ' + (user.name||user.email));
  });

  document.getElementById('cart-list')?.addEventListener('click', (ev)=>{
    const inc = ev.target.closest('.qty-inc'); const dec = ev.target.closest('.qty-dec'); const rem = ev.target.closest('.remove');
    if(inc){ updateQty(inc.dataset.id, 1); }
    if(dec){ updateQty(dec.dataset.id, -1); }
    if(rem){ removeItem(rem.dataset.id); }
  });
});
