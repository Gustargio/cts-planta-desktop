const colorKey = (s) => ({
  'EN_PLANTA': 'en_planta',
  'SALIENDO':  'saliendo',
  'EN_OBRA':   'en_obra',
  'DESCARGA':  'descarga'
}[s] || 'en_planta');

const labelFor = (s) => ({
  'EN_PLANTA': 'En Planta',
  'SALIENDO':  'Saliendo',
  'EN_OBRA':   'En Obra',
  'DESCARGA':  'Descarga'
}[s] || s);

const agoString = (ms) => {
  const diff = Math.max(0, Date.now() - (ms || 0)) / 1000 | 0;
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff/3600)} h`;
  return `hace ${Math.floor(diff/86400)} d`;
};

const { ref, onValue, update } = window.firebaseRTDB;

const listEl = document.getElementById('list');
const tvPlanta  = document.getElementById('summaryEnPlanta');
const tvSal     = document.getElementById('summarySaliendo');
const tvObra    = document.getElementById('summaryEnObra');
const tvDesc    = document.getElementById('summaryDescarga');

const lastById = new Map();
let ultimaLista = [];

[tvPlanta, tvSal, tvObra, tvDesc].forEach((el) => {
  el.addEventListener('click', () => {
    const estado = (el.id === 'summaryEnPlanta') ? 'EN_PLANTA'
                : (el.id === 'summaryEnSaliendo' || el.id === 'summarySaliendo') ? 'SALIENDO'
                : (el.id === 'summaryEnObra') ? 'EN_OBRA'
                : 'DESCARGA';
    const lista = ultimaLista.filter(x => x.status === estado).sort((a,b)=>a.id-b.id);
    const names = (lista.length ? lista.map(x => `Mixer ${x.id} — ${agoString(x.updatedAt)}`) : ['(sin internos)']).join('\n');
    alert(`Internos en ${labelFor(estado)}\n\n${names}`);
  });
});

async function sendAck(item) {
  try {
    await update(ref(`mixers/${item.id}`), { lastAckStatus: item.status, lastAckAt: Date.now() });
    window.planta?.notifyAck?.('OK enviado', `Mixer ${item.id}: ${labelFor(item.status)}`);
  } catch (e) {
    alert('Error al enviar OK: ' + (e?.message || e));
  }
}

function render(list) {
  ultimaLista = list;
  const counts = list.reduce((acc, it) => { acc[it.status] = (acc[it.status] || 0) + 1; return acc; }, {});
  tvPlanta.textContent = `En Planta: ${counts['EN_PLANTA'] || 0}`;
  tvSal.textContent    = `Saliendo: ${counts['SALIENDO'] || 0}`;
  tvObra.textContent   = `En Obra: ${counts['EN_OBRA'] || 0}`;
  tvDesc.textContent   = `Descarga: ${counts['DESCARGA'] || 0}`;

  listEl.innerHTML = '';
  list.sort((a,b)=>a.id-b.id).forEach(item => {
    const row = document.createElement('div');
    row.className = 'row';

    const dot = document.createElement('div');
    dot.className = `dot ${colorKey(item.status)}`;

    const t = document.createElement('div');
    const h = document.createElement('div');
    const title = document.createElement('span');
    title.className = 'title';
    title.textContent = `Int. ${item.id} — ${labelFor(item.status)}`;
    const ago = document.createElement('span');
    ago.className = 'ago';
    ago.textContent = ` • ${agoString(item.updatedAt)}`;
    h.appendChild(title); h.appendChild(ago);
    t.appendChild(h);

    const ackBtn = document.createElement('button');
    ackBtn.textContent = 'Dar OK';
    ackBtn.style.marginLeft = 'auto';
    ackBtn.onclick = () => sendAck(item);

    row.appendChild(dot);
    row.appendChild(t);
    row.appendChild(ackBtn);
    listEl.appendChild(row);

    const prev = lastById.get(item.id);
    if (prev && prev !== item.status) {
      window.planta?.notifyAck?.('Cambio de estado', `Mixer ${item.id}: ${labelFor(item.status)}`);
    }
    lastById.set(item.id, item.status);
  });
}

onValue(ref('mixers'), (snap) => {
  const out = [];
  snap.forEach(ch => {
    const id = ch.child('id').val() ?? parseInt(ch.key, 10);
    const status = ch.child('status').val() || 'EN_PLANTA';
    const updatedAt = ch.child('updatedAt').val() || 0;
    if (id != null && !Number.isNaN(id)) out.push({ id, status, updatedAt });
  });
  render(out);
}, (err) => {
  alert('Error de datos: ' + (err?.message || err));
});
