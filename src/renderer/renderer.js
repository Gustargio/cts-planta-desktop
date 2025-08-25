
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

// ==== Referencias UI ========================================================
const elList = document.getElementById('list');
const sumPlanta = document.getElementById('sumPlanta');
const sumSaliendo = document.getElementById('sumSaliendo');
const sumObra = document.getElementById('sumObra');
const sumDescarga = document.getElementById('sumDescarga');

let lastById = {}; // para detectar cambios

// ==== Suscripción a /mixers ================================================
const ref = db.ref('mixers');
ref.on('value', (snap) => {
  const data = snap.val() || {};
  const list = Object.keys(data)
    .map(k => {
      const x = data[k] || {};
      return {
        id: x.id ?? parseInt(k, 10),
        status: x.status || 'EN_PLANTA',
        updatedAt: x.updatedAt || 0,
        lastAckStatus: x.lastAckStatus || null
      };
    })
    .sort((a, b) => a.id - b.id);

  render(list);
  notifyIfChanged(list);
}, (err) => {
  console.error('RTDB error:', err);
});

// ==== Render y helpers ======================================================
function render(list) {
  const countBy = list.reduce((acc, it) => {
    acc[it.status] = (acc[it.status] || 0) + 1;
    return acc;
  }, {});

  sumPlanta.textContent = `En Planta: ${countBy['EN_PLANTA'] || 0}`;
  sumSaliendo.textContent = `Saliendo: ${countBy['SALIENDO'] || 0}`;
  sumObra.textContent = `En Obra: ${countBy['EN_OBRA'] || 0}`;
  sumDescarga.textContent = `Descarga: ${countBy['DESCARGA'] || 0}`;

  elList.innerHTML = '';
  list.forEach(item => {
    const row = document.createElement('div');
    row.className = 'item';

    const dot = document.createElement('span');
    dot.className = 'dot ' + dotClass(item.status);

    const title = document.createElement('div');
    title.innerHTML = `<strong>Int. ${item.id}</strong> — ${label(item.status)} <span class="muted">• ${ago(item.updatedAt)}</span>`;

    const ackBtn = document.createElement('button');
    ackBtn.className = 'ack';
    ackBtn.textContent = 'Dar OK';
    ackBtn.onclick = () => darOk(item.id, item.status);

    row.appendChild(dot);
    row.appendChild(title);
    row.appendChild(ackBtn);
    elList.appendChild(row);
  });

  sumPlanta.onclick = () => filtrar('EN_PLANTA', list);
  sumSaliendo.onclick = () => filtrar('SALIENDO', list);
  sumObra.onclick = () => filtrar('EN_OBRA', list);
  sumDescarga.onclick = () => filtrar('DESCARGA', list);
}

function filtrar(estado, list) {
  const sub = list.filter(it => it.status === estado);
  if (!sub.length) { alert('No hay internos en este estado.'); return; }
  alert(sub.map(it => `Int. ${it.id} — ${label(it.status)} (${ago(it.updatedAt)})`).join('\n'));
}

function dotClass(s) {
  return s === 'EN_PLANTA' ? 'd-planta'
    : s === 'SALIENDO' ? 'd-saliendo'
    : s === 'EN_OBRA' ? 'd-obra'
    : s === 'DESCARGA' ? 'd-descarga'
    : '';
}
function label(s) {
  switch (s) {
    case 'EN_PLANTA': return 'En Planta';
    case 'SALIENDO': return 'Saliendo';
    case 'EN_OBRA': return 'En Obra';
    case 'DESCARGA': return 'Descarga';
    default: return s;
  }
}
function ago(ts) {
  if (!ts) return 'hace ?';
  const diff = Math.max(0, Date.now() - ts) / 1000;
  if (diff < 60) return `hace ${Math.floor(diff)}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} d`;
}

// ==== Notificación + ACK ====================================================
function notifyIfChanged(list) {
  list.forEach(it => {
    const prev = lastById[it.id];
    if (prev && prev !== it.status) {
      window.api.notify('Cambio de estado', `Mixer ${it.id}: ${label(it.status)}`);
    }
    lastById[it.id] = it.status;
  });
}

function darOk(id, status) {
  db.ref(`mixers/${id}`).update({
    lastAckStatus: status,
    lastAckAt: Date.now()
  }).then(() => {
    window.api.notify('OK enviado', `Se confirmó ${label(status)} a Mixer ${id}`);
  }).catch(err => {
    alert('Error al enviar OK: ' + err.message);
  });
}
