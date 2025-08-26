
// ==== Configurar Firebase: pegá tu firebaseConfig abajo =====================
// Reemplazá los valores con los de tu app Web en Firebase Console.
const firebaseConfig = {
  apiKey: "AIzaSyCbDDxXXZRPEK98gGZxzcuwaui82qpWNi8",
  authDomain: "control-total-sola.firebaseapp.com",
  databaseURL: "https://control-total-sola-default-rtdb.firebaseio.com",
  projectId: "control-total-sola",
  storageBucket: "control-total-sola.firebasestorage.app",
  messagingSenderId: "687583642316",
  appId: "1:687583642316:web:73a6bdb1118c5670d9f869"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// --- Elementos UI ---
const elList = document.getElementById('list');
const sumPlanta = document.getElementById('sumPlanta');
const sumSaliendo = document.getElementById('sumSaliendo');
const sumObra = document.getElementById('sumObra');
const sumDescarga = document.getElementById('sumDescarga');

// Toast
const toast = document.getElementById('toast');
const toastTitle = document.getElementById('toastTitle');
const toastBody = document.getElementById('toastBody');
const toastOk = document.getElementById('toastOk');
const toastClose = document.getElementById('toastClose');
let toastData = null;

let lastById = {};
let okAudio = null;
try { okAudio = new Audio('assets/ok.wav'); } catch(_) {}

// --- Suscripción RTDB ---
const ref = db.ref('mixers');
ref.on('value', (snap) => {
  const data = snap.val() || {};
  const list = Object.keys(data).map(k => {
    const x = data[k] || {};
    return {
      id: x.id ?? parseInt(k, 10),
      status: x.status || 'EN_PLANTA',
      updatedAt: x.updatedAt || 0,
      lastAckStatus: x.lastAckStatus || null
    };
  }).sort((a,b) => a.id - b.id);

  render(list);
  notifyIfChanged(list);
}, (err) => console.error('RTDB error:', err));

// --- Render ---
function render(list) {
  const countBy = list.reduce((acc, it) => (acc[it.status]=(acc[it.status]||0)+1, acc), {});
  sumPlanta.textContent   = `En Planta: ${countBy['EN_PLANTA'] || 0}`;
  sumSaliendo.textContent = `Saliendo: ${countBy['SALIENDO'] || 0}`;
  sumObra.textContent     = `En Obra: ${countBy['EN_OBRA'] || 0}`;
  sumDescarga.textContent = `Descarga: ${countBy['DESCARGA'] || 0}`;

  elList.innerHTML = '';
  list.forEach(item => {
    const row = document.createElement('div'); row.className = 'item';
    const dot = document.createElement('span'); dot.className = 'dot ' + dotClass(item.status);
    const title = document.createElement('div');
    title.innerHTML = `<strong>Int. ${item.id}</strong> — ${label(item.status)} <span class="muted">• ${ago(item.updatedAt)}</span>`;
    const ackBtn = document.createElement('button'); ackBtn.className='ack'; ackBtn.textContent='Dar OK';
    ackBtn.onclick = () => darOk(item.id, item.status);
    row.appendChild(dot); row.appendChild(title); row.appendChild(ackBtn);
    elList.appendChild(row);
  });

  sumPlanta.onclick   = () => filtrar('EN_PLANTA', list);
  sumSaliendo.onclick = () => filtrar('SALIENDO', list);
  sumObra.onclick     = () => filtrar('EN_OBRA', list);
  sumDescarga.onclick = () => filtrar('DESCARGA', list);
}

function filtrar(estado, list) {
  const sub = list.filter(it => it.status === estado);
  if (!sub.length) { alert('No hay internos en este estado.'); return; }
  alert(sub.map(it => `Int. ${it.id} — ${label(it.status)} (${ago(it.updatedAt)})`).join('\n'));
}

function dotClass(s){ return s==='EN_PLANTA'?'d-planta':s==='SALIENDO'?'d-saliendo':s==='EN_OBRA'?'d-obra':s==='DESCARGA'?'d-descarga':''; }
function label(s){ switch(s){case'EN_PLANTA':return'En Planta';case'SALIENDO':return'Saliendo';case'EN_OBRA':return'En Obra';case'DESCARGA':return'Descarga';default:return s;} }
function ago(ts){ if(!ts) return 'hace ?'; const d=Math.max(0,Date.now()-ts)/1000; if(d<60)return`hace ${d|0}s`; if(d<3600)return`hace ${d/60|0} min`; if(d<86400)return`hace ${d/3600|0} h`; return`hace ${d/86400|0} d`; }

// --- Notificaciones + Toast ---
function notifyIfChanged(list) {
  list.forEach(it => {
    const prev = lastById[it.id];
    if (prev && prev !== it.status) {
      // Notificación nativa con acción
      window.api.notifyAckable('Cambio de estado', `Mixer ${it.id}: ${label(it.status)}`, it.id, it.status);
      // Toast interno
      showToastAck(it.id, it.status);
      // Sonido
      try { okAudio && okAudio.play(); } catch(_){}
    }
    lastById[it.id] = it.status;
  });
}

// Click del botón en la notificación nativa
window.api.onAckClick(({ mixerId, status }) => {
  darOk(mixerId, status);
});

// --- Toast interno (fallback/extra) ---
function showToastAck(mixerId, status) {
  toastData = { mixerId, status };
  toastTitle.textContent = 'Cambio de estado';
  toastBody.textContent = `Mixer ${mixerId}: ${label(status)}`;
  toast.style.display = 'flex';
  clearTimeout(showToastAck._t);
  showToastAck._t = setTimeout(() => { toast.style.display = 'none'; }, 8000);
}

toastOk.onclick = () => {
  if (!toastData) return;
  const { mixerId, status } = toastData;
  darOk(mixerId, status);
  toast.style.display = 'none';
};

toastClose.onclick = () => { toast.style.display = 'none'; };

// --- Acción de ACK ---
function darOk(id, status) {
  db.ref(`mixers/${id}`).update({
    lastAckStatus: status,
    lastAckAt: Date.now()
  }).then(() => {
    window.api.notify('OK enviado', `Se confirmó ${label(status)} a Mixer ${id}`);
  }).catch(err => alert('Error al enviar OK: ' + err.message));
}

// --- Menú (placeholders de navegación) ---
window.api.onMenu('menu:historial',  () => alert('Abrir Historial (pendiente de UI)'));
window.api.onMenu('menu:resumen',    () => alert('Abrir Resumen de sueldo (pendiente)'));
window.api.onMenu('menu:config',     () => alert('Abrir Config. sueldo (pendiente)'));
window.api.onMenu('menu:compartir',  () => alert('Compartir (pendiente)'));
window.api.onMenu('menu:eliminar',   () => {
  const id = prompt('Ingresá número de Interno a eliminar:');
  if (!id) return;
  db.ref('mixers').child(String(id)).remove()
    .then(()=>window.api.notify('Eliminar',`Mixer ${id} eliminado`))
    .catch(e=>alert('Error al eliminar: '+e.message));
});
window.api.onMenu('menu:reiniciarLista', () => {
  if (!confirm('Esto eliminará TODOS los mixers. ¿Continuar?')) return;
  db.ref('mixers').remove()
    .then(()=>window.api.notify('Reinicio','Lista reiniciada'))
    .catch(e=>alert('Error: '+e.message));
});
window.api.onMenu('menu:reiniciarEstados', () => {
  if (!confirm('Poner TODOS en En Planta y limpiar OKs. ¿Continuar?')) return;
  db.ref('mixers').once('value').then(snap=>{
    const updates = {};
    snap.forEach(ch=>{
      const id = ch.key;
      updates[id] = { id: Number(id), status: 'EN_PLANTA', updatedAt: Date.now(), lastAckStatus: null, lastAckAt: null };
    });
    return db.ref('mixers').update(updates);
  }).then(()=>window.api.notify('Reinicio','Estados reiniciados'))
    .catch(e=>alert('Error: '+e.message));
});
