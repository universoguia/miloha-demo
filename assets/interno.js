/* Miloha Café — panel interno. Demo comercial: todo el estado vive en memoria
   durante la sesión del navegador. Sin backend, sin datos reales. */
(function () {
  'use strict';

  // ---------- Datos de la demo ----------
  var MENU = [
    { id:'cap', name:'Cappuccino',          cat:'Café',     price:3.5, note:'Doble shot, leche texturada' },
    { id:'ame', name:'Americano',           cat:'Café',     price:2.8, note:'Filtrado del día' },
    { id:'lat', name:'Latte helado',        cat:'Café',     price:4.0, note:'Hielo, leche entera' },
    { id:'v60', name:'V60',                 cat:'Café',     price:5.0, note:'Método, grano de origen' },
    { id:'tea', name:'Té de jengibre',      cat:'Sin café', price:2.6, note:'Infusión en jarra' },
    { id:'jug', name:'Jugo de naranja',     cat:'Sin café', price:3.2, note:'Recién exprimido' },
    { id:'san', name:'Sándwich de pollo',   cat:'Comida',   price:6.5, note:'Pan de masa madre' },
    { id:'tos', name:'Tostado mixto',       cat:'Comida',   price:5.4, note:'Jamón y queso' },
    { id:'med', name:'Medialunas (x2)',     cat:'Dulce',    price:2.9, note:'De manteca' },
    { id:'tor', name:'Torta de chocolate',  cat:'Dulce',    price:4.5, note:'Porción generosa' }
  ];
  var CATS = ['Café', 'Sin café', 'Comida', 'Dulce'];
  var MODOS = ['Salón', 'Take away', 'Delivery'];

  var SEATS = [4,2,4,6,2,4,4,2,6,4,2,4,8,2,4,6];
  var PRESET = {
    2:  { status:'En cocina', detail:'3 ítems en preparación', total:12.8 },
    4:  { status:'Listo',     detail:'a servir',               total:24.6 },
    6:  { status:'Abierta',   detail:'5 ítems cargados',       total:19.2 },
    9:  { status:'Abierta',   detail:'tomando pedido',         total:8.4 },
    12: { status:'En cocina', detail:'2 ítems en preparación', total:9.3 },
    15: { status:'Listo',     detail:'a servir',               total:15.5 }
  };
  var TABLES = SEATS.map(function (seats, i) {
    var n = i + 1, p = PRESET[n];
    return {
      n: n,
      status: p ? p.status : 'Libre',
      total: p ? p.total : 0,
      detail: seats + ' lugares · ' + (p ? p.detail : 'sin pedido')
    };
  });

  var STAFF = [
    { name:'Sofía Ortiz', role:'Salón · mozo', initials:'SO', detail:'Mesas 1 a 4 · turno tarde',        status:'En turno' },
    { name:'Luz Medina',  role:'Salón · mozo', initials:'LM', detail:'Mesas 5 a 8 · turno tarde',        status:'En turno' },
    { name:'Nico Ferrer', role:'Cocina',       initials:'NF', detail:'Marca listo y avisa al salón',     status:'En turno' },
    { name:'Caro Ruiz',   role:'Caja',         initials:'CR', detail:'Cobros, cierre de turno y arqueo', status:'En turno' },
    { name:'Martín Loha', role:'Dueño',        initials:'ML', detail:'Carta, precios y permisos',        status:'Fuera de turno' }
  ];

  var TITULOS = {
    mesas:  ['Mesas del salón',        'Estado en vivo de cada mesa · tocá una para tomar el pedido'],
    pedido: ['Armar pedido',           'Sumá con los bloques de cantidad y enviá a cocina'],
    cocina: ['Cocina en vivo',         'Un clic para pasar de nuevo a cocinando y a listo'],
    carta:  ['Carta por QR',           'Lo que ve el cliente al escanear el QR de su mesa'],
    equipo: ['Equipo interno',         'Perfiles, roles y QR de acceso propio'],
    avisos: ['Avisos',                 'Lo que pasa en el salón, sin ir hasta cocina']
  };

  var NAV = [
    { k:'mesas',  label:'Mesas' },
    { k:'pedido', label:'Armar pedido' },
    { k:'cocina', label:'Cocina' },
    { k:'carta',  label:'Carta por QR' },
    { k:'equipo', label:'Equipo' },
    { k:'avisos', label:'Avisos' }
  ];

  // ---------- Estado ----------
  var s = {
    logged: false,
    view: 'mesas',
    cat: 'Café',
    mode: 'Salón',
    qty: {},
    cart: [],
    activeTable: 3,
    menuAbierto: false,
    tables: TABLES.map(function (t) { return Object.assign({}, t); }),
    orders: [
      { id:1, table:'Mesa 2',   mode:'Salón',     mozo:'Sofía', min:4,  status:'Nuevo',
        lines:[{name:'Cappuccino',qty:2},{name:'Medialunas (x2)',qty:1}] },
      { id:2, table:'Mesa 6',   mode:'Salón',     mozo:'Luz',   min:9,  status:'Cocinando',
        lines:[{name:'Tostado mixto',qty:2},{name:'Americano',qty:3}] },
      { id:3, table:'Take away', mode:'Take away', mozo:'Nico',  min:12, status:'Listo',
        lines:[{name:'Latte helado',qty:1},{name:'Torta de chocolate',qty:1}] }
    ],
    alerts: [
      { t:'Mesa 4 · pedido listo',            b:'Cocina marcó el pedido como listo. Pasá a servir.',      time:'ahora',  kind:'ok' },
      { t:'Mesa 2 · aceptado en cocina',      b:'2 Cappuccino, 1 Medialunas — 4 min en preparación.',     time:'4 min',  kind:'info' },
      { t:'Take away · pedido nuevo por QR',  b:'El cliente pidió desde la carta digital.',               time:'12 min', kind:'info' },
      { t:'Stock bajo: leche de almendras',   b:'Cocina avisó que quedan 2 cartones.',                    time:'26 min', kind:'warn' }
    ]
  };

  // ---------- Utilidades ----------
  var money = function (n) { return '$' + n.toFixed(2); };
  var esc = function (v) {
    return String(v).replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  };
  var $ = function (sel) { return document.querySelector(sel); };

  var CHIP = {
    'Libre':     'chip chip-libre',
    'Abierta':   'chip chip-abierta',
    'En cocina': 'chip chip-cocina',
    'Listo':     'chip chip-listo'
  };
  var chipMesa = function (estado) { return CHIP[estado] || CHIP['Libre']; };
  var chipComanda = function (estado) {
    if (estado === 'Nuevo') return CHIP['Abierta'];
    if (estado === 'Cocinando') return CHIP['En cocina'];
    if (estado === 'Listo') return CHIP['Listo'];
    return CHIP['Libre'];
  };

  var pendientes = function () {
    return s.orders.filter(function (o) { return o.status !== 'Entregado'; }).length;
  };

  // ---------- Acciones ----------
  function set(cambios) { Object.assign(s, cambios); render(); }

  function irA(vista) { set({ view: vista, menuAbierto: false }); }

  function bumpQty(id, d) {
    var actual = s.qty[id] || 1;
    s.qty[id] = Math.max(1, actual + d);
    render();
  }

  function addToCart(item) {
    var q = s.qty[item.id] || 1;
    var i = s.cart.findIndex(function (l) { return l.id === item.id; });
    if (i >= 0) s.cart[i].qty += q;
    else s.cart.push({ id:item.id, name:item.name, price:item.price, qty:q });
    s.qty[item.id] = 1;
    render();
  }

  function bumpLine(id, d) {
    s.cart = s.cart
      .map(function (l) { return l.id === id ? Object.assign({}, l, { qty: l.qty + d }) : l; })
      .filter(function (l) { return l.qty > 0; });
    render();
  }

  function enviarACocina() {
    if (!s.cart.length) return;
    var cantidadItems = s.cart.length;
    var totalPedido = s.cart.reduce(function (a, l) { return a + l.price * l.qty; }, 0);
    s.orders.unshift({
      id: Date.now(),
      table: s.mode === 'Salón' ? 'Mesa ' + s.activeTable : s.mode,
      mode: s.mode, mozo: 'Sofía', min: 0, status: 'Nuevo',
      lines: s.cart.map(function (l) { return { name:l.name, qty:l.qty }; })
    });
    if (s.mode === 'Salón') {
      s.tables = s.tables.map(function (t) {
        return t.n === s.activeTable
          ? Object.assign({}, t, { status:'En cocina', detail: cantidadItems + ' ítems enviados', total: totalPedido })
          : t;
      });
    }
    s.cart = [];
    set({ view: 'cocina' });
  }

  function avanzar(id) {
    var siguiente = { 'Nuevo':'Cocinando', 'Cocinando':'Listo', 'Listo':'Entregado' };
    s.orders = s.orders.map(function (o) {
      if (o.id !== id || o.status === 'Entregado') return o;
      return Object.assign({}, o, { status: siguiente[o.status] || 'Entregado' });
    });
    render();
  }

  // ---------- Vistas ----------
  function vistaMesas() {
    var mesas = s.tables.map(function (t) {
      return '<button class="mesa' + (s.activeTable === t.n ? ' activa' : '') +
        '" data-accion="mesa" data-n="' + t.n + '">' +
        '<div class="fila"><span class="num">Mesa ' + t.n + '</span>' +
        '<span class="' + chipMesa(t.status) + '">' + esc(t.status) + '</span></div>' +
        '<div class="detalle">' + esc(t.detail) + '</div>' +
        '<div class="total">' + (t.total ? money(t.total) : 'Sin consumo') + '</div>' +
        '</button>';
    }).join('');

    return '<div class="grilla-mesas">' + mesas + '</div>' +
      '<div class="nota-qr"><div class="qr"></div><p>Cada mesa tiene su QR: el cliente pide desde la ' +
      'carta y el pedido cae acá y en cocina al mismo tiempo. Plantilla reutilizable para cualquier ' +
      'local del ecosistema.</p></div>';
  }

  function vistaPedido() {
    var filtros = CATS.map(function (c) {
      return '<button class="pill' + (c === s.cat ? ' on' : '') + '" data-accion="cat" data-cat="' +
        esc(c) + '">' + esc(c) + '</button>';
    }).join('');

    var items = MENU.filter(function (m) { return m.cat === s.cat; }).map(function (m) {
      return '<div class="item"><div class="foto">[foto]</div><div class="cuerpo">' +
        '<div class="fila"><span class="nombre">' + esc(m.name) + '</span>' +
        '<span class="precio">' + money(m.price) + '</span></div>' +
        '<div class="nota">' + esc(m.note) + '</div>' +
        '<div class="acciones">' +
        '<button class="paso" data-accion="qty-" data-id="' + m.id + '" aria-label="Restar">–</button>' +
        '<div class="qty">' + (s.qty[m.id] || 1) + '</div>' +
        '<button class="paso" data-accion="qty+" data-id="' + m.id + '" aria-label="Sumar">+</button>' +
        '<button class="btn-sumar" data-accion="add" data-id="' + m.id + '">Sumar</button>' +
        '</div></div></div>';
    }).join('');

    var modos = MODOS.map(function (m) {
      return '<button class="pill' + (m === s.mode ? ' on' : '') + '" data-accion="modo" data-modo="' +
        esc(m) + '">' + esc(m) + '</button>';
    }).join('');

    var lineas = s.cart.map(function (l) {
      return '<div class="linea"><div class="txt">' + esc(l.name) +
        '<small>' + money(l.price * l.qty) + '</small></div>' +
        '<button class="paso-sm" data-accion="linea-" data-id="' + l.id + '" aria-label="Restar">–</button>' +
        '<span class="qty">' + l.qty + '</span>' +
        '<button class="paso-sm" data-accion="linea+" data-id="' + l.id + '" aria-label="Sumar">+</button>' +
        '</div>';
    }).join('');

    var sub = s.cart.reduce(function (a, l) { return a + l.price * l.qty; }, 0);
    var svc = sub * 0.1;
    var etiqueta = s.mode === 'Salón' ? 'Mesa ' + s.activeTable : s.mode;

    return '<div class="pedido"><div>' +
      '<div class="filtros">' + filtros + '</div>' +
      '<div class="grilla-items">' + items + '</div></div>' +
      '<aside class="ticket">' +
      '<h2>Pedido · ' + esc(etiqueta) + '</h2>' +
      '<div class="modos">' + modos + '</div>' +
      (s.cart.length ? '' : '<div class="vacio">Todavía sin ítems. Tocá los bloques de cantidad y sumá al pedido.</div>') +
      '<div class="lineas">' + lineas + '</div>' +
      '<div class="totales">' +
      '<div><span>Subtotal</span><span>' + money(sub) + '</span></div>' +
      '<div><span>Servicio</span><span>' + money(svc) + '</span></div>' +
      '<div class="grande"><span>Total</span><span>' + money(sub + svc) + '</span></div></div>' +
      '<button class="btn-enviar" data-accion="enviar"' + (s.cart.length ? '' : ' disabled') +
      '>Enviar a cocina</button>' +
      '</aside></div>';
  }

  function vistaCocina() {
    var etiquetas = {
      'Nuevo':'Aceptar y cocinar', 'Cocinando':'Marcar listo',
      'Listo':'Marcar entregado', 'Entregado':'Cerrado'
    };
    var comandas = s.orders.map(function (o) {
      var cerrado = o.status === 'Entregado';
      var lineas = o.lines.map(function (l) {
        return '<div><span>' + esc(l.name) + '</span><b>x' + l.qty + '</b></div>';
      }).join('');
      return '<div class="comanda' + (o.status === 'Listo' ? ' lista' : '') + '">' +
        '<div class="cab"><span class="mesa">' + esc(o.table) + '</span>' +
        '<span class="' + chipComanda(o.status) + '">' + esc(o.status) + '</span></div>' +
        '<div class="meta">' + esc(o.mode + ' · ' + o.mozo + ' · hace ' + o.min + ' min') + '</div>' +
        '<div class="lineas-c">' + lineas + '</div>' +
        '<button class="btn-avanzar' + (cerrado ? ' cerrado' : '') + '"' +
        (cerrado ? ' disabled' : ' data-accion="avanzar" data-id="' + o.id + '"') + '>' +
        etiquetas[o.status] + '</button></div>';
    }).join('');
    return '<div class="grilla-cocina">' + comandas + '</div>';
  }

  function vistaCarta() {
    var filtros = CATS.map(function (c) {
      return '<button class="pill' + (c === s.cat ? ' on' : '') + '" data-accion="cat" data-cat="' +
        esc(c) + '">' + esc(c) + '</button>';
    }).join('');

    var items = MENU.filter(function (m) { return m.cat === s.cat; }).map(function (m) {
      return '<div class="carta-item"><div class="foto">[foto]</div>' +
        '<div class="txt"><div class="n">' + esc(m.name) + '</div>' +
        '<div class="d">' + esc(m.note) + '</div></div>' +
        '<div class="p">' + money(m.price) + '</div></div>';
    }).join('');

    var qrs = s.tables.map(function (t) {
      return '<button class="qr-mesa' + (s.activeTable === t.n ? ' activa' : '') +
        '" data-accion="mesa-qr" data-n="' + t.n + '">' +
        '<div class="mini"></div><span>Mesa ' + t.n + '</span></button>';
    }).join('');

    return '<div class="carta">' +
      '<div class="telefono"><div class="pantalla">' +
      '<div class="cab"><img src="../assets/logo-miloha.jpg?v=2" alt="Miloha Café">' +
      '<div class="mesa">Mesa ' + s.activeTable + '<br>escaneada</div></div>' +
      '<div class="filtros-carta">' + filtros + '</div>' +
      '<div class="lista-carta">' + items + '</div>' +
      '<div class="pie"><div>Pedir a mi mesa</div></div>' +
      '</div></div>' +
      '<div class="carta-lado">' +
      '<div class="caja qr-caja"><div class="qr-grande"></div>' +
      '<p>QR de la mesa ' + s.activeTable + '. Cada una tiene el suyo: el pedido entra identificado ' +
      'con el número de mesa, cae en cocina y en el panel del mozo al mismo tiempo.</p></div>' +
      '<div class="caja"><h3>Imprimir QR por mesa</h3>' +
      '<div class="grilla-qr">' + qrs + '</div></div>' +
      '</div></div>';
  }

  function vistaEquipo() {
    var personas = STAFF.map(function (p) {
      return '<div class="persona">' +
        '<div class="cab"><div class="av">' + esc(p.initials) + '</div>' +
        '<div><div class="nombre">' + esc(p.name) + '</div>' +
        '<div class="rol">' + esc(p.role) + '</div></div></div>' +
        '<div class="detalle">' + esc(p.detail) + '</div>' +
        '<div class="qr-fila"><div class="qr"></div>' +
        '<span>QR personal<br>acceso sin clave</span></div>' +
        '<div><span class="' + chipMesa(p.status === 'En turno' ? 'Listo' : 'Libre') + '">' +
        esc(p.status) + '</span></div></div>';
    }).join('');

    return '<div class="grilla-equipo">' + personas + '</div>' +
      '<div class="bloque-nota"><h3>Próximo: bot de avisos</h3>' +
      '<p>Cada perfil recibe notificación cuando entra un pedido, cuando cocina lo acepta y cuando ' +
      'está listo — sin salir de la página y sin ir hasta cocina. Pensado para equipos de 2 a 10 personas.</p></div>';
  }

  function vistaAvisos() {
    var avisos = s.alerts.map(function (a) {
      var clase = a.kind === 'ok' ? ' ok' : a.kind === 'warn' ? ' warn' : '';
      return '<div class="aviso' + clase + '"><div class="txt">' +
        '<div class="titulo">' + esc(a.t) + '</div>' +
        '<div class="cuerpo">' + esc(a.b) + '</div></div>' +
        '<div class="hora">' + esc(a.time) + '</div></div>';
    }).join('');
    return '<div class="avisos">' + avisos + '</div>';
  }

  var VISTAS = {
    mesas: vistaMesas, pedido: vistaPedido, cocina: vistaCocina,
    carta: vistaCarta, equipo: vistaEquipo, avisos: vistaAvisos
  };

  // ---------- Render ----------
  function render() {
    var login = $('#login'), app = $('#app');

    if (!s.logged) {
      login.classList.remove('oculto');
      app.classList.add('oculto');
      document.body.classList.add('en-login');
      return;
    }
    login.classList.add('oculto');
    app.classList.remove('oculto');
    document.body.classList.remove('en-login');

    var pend = pendientes();
    $('#nav').innerHTML = NAV.map(function (n) {
      var badge = n.k === 'cocina' ? pend : n.k === 'avisos' ? s.alerts.length : 0;
      return '<button class="nav-item' + (s.view === n.k ? ' activo' : '') +
        '" data-accion="ir" data-vista="' + n.k + '">' +
        '<span>' + n.label + '</span>' +
        (badge ? '<span class="badge">' + badge + '</span>' : '') + '</button>';
    }).join('');

    var t = TITULOS[s.view] || TITULOS.mesas;
    $('#titulo').textContent = t[0];
    $('#subtitulo').textContent = t[1];
    $('#alertas').textContent = s.alerts.length + ' avisos · ' + pend + ' pedidos activos';

    $('#contenido').innerHTML = (VISTAS[s.view] || vistaMesas)();

    var side = $('#side'), velo = $('#velo');
    side.classList.toggle('abierto', s.menuAbierto);
    velo.classList.toggle('oculto', !s.menuAbierto);
  }

  // ---------- Eventos (delegación) ----------
  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-accion]');
    if (!el) return;
    var a = el.getAttribute('data-accion');

    if (a === 'login')  { ev.preventDefault(); set({ logged: true }); return; }
    if (a === 'logout') { set({ logged: false, view: 'mesas', menuAbierto: false }); return; }
    if (a === 'menu')   { set({ menuAbierto: !s.menuAbierto }); return; }
    if (a === 'cerrar-menu') { set({ menuAbierto: false }); return; }
    if (a === 'ir')     { irA(el.getAttribute('data-vista')); return; }
    if (a === 'mesa')   { set({ activeTable: +el.getAttribute('data-n'), view: 'pedido' }); return; }
    if (a === 'mesa-qr'){ set({ activeTable: +el.getAttribute('data-n') }); return; }
    if (a === 'cat')    { set({ cat: el.getAttribute('data-cat') }); return; }
    if (a === 'modo')   { set({ mode: el.getAttribute('data-modo') }); return; }
    if (a === 'qty+')   { bumpQty(el.getAttribute('data-id'), 1); return; }
    if (a === 'qty-')   { bumpQty(el.getAttribute('data-id'), -1); return; }
    if (a === 'add') {
      var id = el.getAttribute('data-id');
      var item = MENU.find(function (m) { return m.id === id; });
      if (item) addToCart(item);
      return;
    }
    if (a === 'linea+') { bumpLine(el.getAttribute('data-id'), 1); return; }
    if (a === 'linea-') { bumpLine(el.getAttribute('data-id'), -1); return; }
    if (a === 'enviar') { enviarACocina(); return; }
    if (a === 'avanzar'){ avanzar(+el.getAttribute('data-id')); return; }
  });

  document.addEventListener('DOMContentLoaded', render);
  if (document.readyState !== 'loading') render();
})();
