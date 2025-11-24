async function api(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error('API error');
  return res.json();
}

function formatPrice(v){ if(v===null||v===undefined||v==='') return '—'; if(typeof v==='number') return `$ ${v.toLocaleString?.() ?? v}`; const n=Number(v); if(!Number.isNaN(n)) return `$ ${n.toLocaleString?.() ?? n}`; return `$ ${v}`; }

function getCart(){ try{ return JSON.parse(localStorage.getItem('cart')||'[]') }catch(e){ return [] } }
function saveCart(cart){ localStorage.setItem('cart', JSON.stringify(cart||[])); }
// Use global addToCartItem exposed by app.js when available

function showLoginModal(){ const bd = document.getElementById('login-backdrop'); if(!bd) return; bd.classList.add('show'); bd.setAttribute('aria-hidden','false'); }

async function loadProduct(){
  try{
    const parts = window.location.pathname.split('/').filter(Boolean);
    const idx = parts.indexOf('product');
    const prodId = idx >= 0 && parts.length > idx+1 ? parts[idx+1] : null;
    if(!prodId){ document.getElementById('detail-title').textContent='Producto no encontrado'; return; }
    const prod = await api(`/products/${encodeURIComponent(prodId)}`);
    if(!prod){ document.getElementById('detail-title').textContent='Producto no encontrado'; return; }
    document.getElementById('detail-title').textContent = prod.name || 'Producto';
    document.getElementById('detail-desc').textContent = prod.description || '';
    document.getElementById('detail-image').src = prod.image_url || '/static/default-product.svg';
    document.getElementById('detail-price').textContent = formatPrice(prod.price);

    // handler add
    document.getElementById('detail-add').addEventListener('click', (e)=>{
      e.preventDefault();
      const user = localStorage.getItem('user');
      if(!user){ // open modal from global helper if present
        if(window && typeof window.showLoginModal === 'function') return window.showLoginModal();
        return;
      }
      if(window && typeof window.addToCartItem === 'function'){
        window.addToCartItem({id: prod.id, name: prod.name, price: prod.price, image_url: prod.image_url});
        if(window && typeof window.showToast === 'function') window.showToast('Producto agregado al carrito');
        else alert('Producto agregado al carrito');
      } else {
        // fallback local implementation
        const cart = getCart(); const idx = cart.findIndex(c=>c.id===prod.id);
        if(idx>=0) cart[idx].qty = (cart[idx].qty||1) + 1; else cart.push({id:prod.id,name:prod.name,price:prod.price,image_url:prod.image_url,qty:1}); saveCart(cart);
        alert('Producto agregado al carrito');
      }
    });
  }catch(e){ console.error(e); document.getElementById('detail-title').textContent='Error cargando producto'; }
}

window.addEventListener('load', ()=>{ loadProduct(); });
