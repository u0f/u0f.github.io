const USER = 'u0f';
const repoUrl = (r) => `https://github.com/${USER}/${r}`;
const raw = (r, path, branch = 'main') => `https://raw.githubusercontent.com/${USER}/${r}/${branch}/${path}`;

const LANG_COLORS = {
  'C#': '#178600', C: '#8a8a8a', PowerShell: '#5391fe', Batchfile: '#c1f12e',
  Python: '#3572a5', TypeScript: '#3178c6', JavaScript: '#f1e05a', Lua: '#6b6bff',
  CSS: '#8f5fd6', HTML: '#e34c26', Shell: '#89e051', Dockerfile: '#5e8ea3', Go: '#00add8',
};

// Los repos pineados de GitHub. Para añadir uno, copia un bloque.
const PROJECTS = [
  {
    repo: 'BlocPlus',
    name: 'BlocPlus',
    kind: 'App de escritorio · Windows',
    accent: '#8b5cf6',
    tagline: 'Sustituto ligero del Bloc de notas de Windows.',
    desc: 'Un editor de texto en un solo archivo C#, sin dependencias, que compila con el compilador que ya trae Windows. Nada de Visual Studio ni del SDK de .NET.',
    features: [
      'Pestañas con reordenado, Ctrl+Tab y reabrir la última cerrada',
      'Sesiones como el Bloc de notas moderno: el texto sin guardar vuelve al abrir',
      'Resaltado de sintaxis para más de 20 lenguajes',
      'Multicursor estilo VS Code y buscar/reemplazar con regex',
      'Tema claro, oscuro o del sistema, e interfaz en 33 idiomas',
    ],
    langs: { 'C#': 93.2, C: 3.7, PowerShell: 2.5, Batchfile: 0.5 },
    logo: raw('BlocPlus', 'assets/logo.png'),
    links: [
      { label: 'Microsoft Store', href: 'https://apps.microsoft.com/detail/9PBMQDG1JZV9' },
      { label: 'Descargar', href: repoUrl('BlocPlus') + '/releases/latest' },
    ],
  },
  {
    repo: 'pokemon_overlay',
    name: 'PokeStream',
    kind: 'Overlay para OBS · Streaming',
    accent: '#ff5c7a',
    tagline: 'Overlays automáticos de Pokémon para OBS, leyendo la memoria del emulador.',
    desc: 'App local con panel web en español. El equipo, las medallas y los datos de la partida se actualizan solos a partir de la memoria de mGBA. Gratis y de código abierto, hecha para la comunidad.',
    features: [
      'Equipo, PS, nivel, estado, dinero, ubicación y Pokédex en directo',
      'Overlay personalizable: posiciones, tamaños, colores, temas y perfiles',
      'Alertas, historial de eventos y registro Nuzlocke',
      'Esmeralda, Rubí, Zafiro, Rojo Fuego y Verde Hoja (GBA)',
    ],
    langs: { Python: 61.9, TypeScript: 28.4, Lua: 4.5, JavaScript: 2.5, PowerShell: 1.2, CSS: 0.8 },
    logo: raw('pokemon_overlay', 'assets/pokestream-logo.png'),
    shots: [
      raw('pokemon_overlay', 'docs/screenshots/overlay-obs.png'),
      raw('pokemon_overlay', 'docs/screenshots/panel-web.png'),
    ],
    links: [{ label: 'Descargar', href: repoUrl('pokemon_overlay') + '/releases/latest' }],
  },
  {
    repo: 'Rastro',
    name: 'Rastro',
    kind: 'App de escritorio · Magic: The Gathering',
    accent: '#f5a524',
    tagline: 'Encuentra tus cartas de Magic en tus tiendas de Cardmarket y dónde salen más baratas.',
    desc: 'Le das una lista de cartas o un mazo y tus tiendas favoritas, y te enseña en una sola tabla qué tiene cada tienda, a qué precio y dónde comprar cada carta para gastar menos.',
    features: [
      'Revisa el stock de todas tus tiendas a la vez, con filtros de idioma, estado y precio',
      'Mazos con curva de maná, legalidad, bracket de Commander y combos',
      'Colección por ediciones, manos iniciales y partida de prueba',
      'Asistente IA para mazos y un juez de reglas con las Comprehensive Rules',
      'Se actualiza solo',
    ],
    langs: { JavaScript: 48.6, CSS: 21.9, Python: 21.5, HTML: 7.5, Shell: 0.2, Batchfile: 0.1 },
    logo: raw('Rastro', 'src/assets/logo.png'),
    links: [{ label: 'Descargar', href: repoUrl('Rastro') + '/releases/latest' }],
  },
  {
    repo: 'db_editor',
    name: 'DB Editor',
    kind: 'Self-hosted · Docker',
    accent: '#34d399',
    tagline: 'Interfaz web para ver y editar las bases SQLite de tus contenedores Docker.',
    desc: 'Descubre los contenedores en marcha, recorre sus volúmenes y encuentra las bases de datos SQLite. Lo bastante ligera para cualquier host, incluida una Raspberry Pi o CasaOS.',
    features: [
      'Descubrimiento automático a través de docker.sock',
      'Esquema leído en tiempo real: tablas, índices y claves foráneas',
      'Editar, insertar y borrar filas, con copia de seguridad previa',
      'Consola SQL opcional con confirmación para escrituras',
      'Multi-arquitectura, protegida con contraseña y en 6 idiomas',
    ],
    langs: { Python: 54.6, JavaScript: 33.5, CSS: 8.8, HTML: 1.9, Dockerfile: 0.9 },
    logo: raw('db_editor', 'app/static/icon.svg', 'master'),
    links: [],
  },
  {
    repo: 'cli',
    name: 'Spicetify (fork)',
    kind: 'CLI · Personalización de Spotify',
    accent: '#1ed760',
    tagline: 'Mi fork de spicetify/cli: recortado, reforzado y con extras.',
    desc: 'Herramienta de línea de comandos para personalizar el cliente de Spotify en Windows, macOS y Linux. El fork se sincroniza a diario con el original y añade lo que yo echaba en falta.',
    features: [
      'Selector de temas en tiempo de ejecución, con temas incluidos',
      'Auto-actualización firmada desde las releases del fork',
      'Trash Skip: manda canciones y artistas a la papelera para saltarlos',
      'Añade tus propias extensiones y temas desde el menú de perfil',
      'PR automática cada día cuando hay cambios en spicetify/cli',
    ],
    langs: { JavaScript: 59.3, CSS: 20.8, Go: 19.8 },
    glyph: 'spice',
    links: [{ label: 'Original: spicetify/cli', href: 'https://github.com/spicetify/cli' }],
  },
];

const GLYPHS = {
  // Ondas de sonido, para proyectos sin logo propio.
  spice: '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"><path d="M10 26v12M20 18v28M30 10v44M40 20v24M50 28v8"/></svg>',
};

const $ = (s, el = document) => el.querySelector(s);

function visual(p, big = false) {
  const style = `style="--c:${p.accent}"`;
  if (big && p.shots?.length) {
    return `<div class="visual shot" ${style}>
      <img id="d-shot" src="${p.shots[0]}" alt="Captura de ${p.name}">
      ${p.shots.length > 1 ? `<div class="thumbs">${p.shots.map((s, i) =>
        `<button type="button" class="${i ? '' : 'on'}" data-src="${s}" aria-label="Captura ${i + 1}"><img src="${s}" alt=""></button>`).join('')}</div>` : ''}
    </div>`;
  }
  const mark = p.logo
    ? `<img class="logo" src="${p.logo}" alt="Logo de ${p.name}" loading="lazy">`
    : `<span class="logo glyph">${GLYPHS[p.glyph]}</span>`;
  return `<div class="visual" ${style}>${mark}</div>`;
}

function langBar(langs, legend = false) {
  const entries = Object.entries(langs);
  const bar = `<div class="langbar">${entries.map(([l, v]) =>
    `<span style="width:${v}%;background:${LANG_COLORS[l] || '#666'}" title="${l} ${v}%"></span>`).join('')}</div>`;
  if (!legend) return bar;
  return bar + `<ul class="legend">${entries.filter(([, v]) => v >= 1).map(([l, v]) =>
    `<li><i style="background:${LANG_COLORS[l] || '#666'}"></i>${l} <span class="muted">${v}%</span></li>`).join('')}</ul>`;
}

const meta = (p) => `<span class="mono muted" data-stars="${p.repo}"></span><span class="mono muted" data-updated="${p.repo}"></span>`;

$('#grid').innerHTML = PROJECTS.map((p, i) => `
  <button class="card reveal" type="button" data-i="${i}" style="--c:${p.accent}">
    <div class="card-inner">
      ${visual(p)}
      <div class="card-body">
        <span class="kind mono">${p.kind}</span>
        <h3>${p.name}</h3>
        <p>${p.tagline}</p>
        ${langBar(p.langs)}
        <div class="card-foot">${meta(p)}<span class="more">Detalles →</span></div>
      </div>
    </div>
  </button>`).join('');
$('#active-count').textContent = PROJECTS.length;
$('#year').textContent = new Date().getFullYear();

// Detalle en un <dialog> nativo
const dialog = $('#detail');
function openDetail(p) {
  $('#d-body').innerHTML = `
    ${visual(p, true)}
    <div class="d-content" style="--c:${p.accent}">
      <span class="kind mono">${p.kind}</span>
      <h2 id="d-title">${p.name}</h2>
      <p class="lead">${p.desc}</p>
      <ul class="features">${p.features.map((f) => `<li>${f}</li>`).join('')}</ul>
      ${langBar(p.langs, true)}
      <div class="d-actions">
        <a class="btn primary" href="${repoUrl(p.repo)}" target="_blank" rel="noopener">Ver en GitHub ↗</a>
        ${p.links.map((l) => `<a class="btn" href="${l.href}" target="_blank" rel="noopener">${l.label} ↗</a>`).join('')}
        <span class="d-meta">${meta(p)}</span>
      </div>
    </div>`;
  fillRepoData();
  dialog.showModal();
}
$('#grid').addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (card) openDetail(PROJECTS[card.dataset.i]);
});
dialog.addEventListener('click', (e) => {
  if (e.target === dialog || e.target.closest('.close')) dialog.close();
  const thumb = e.target.closest('.thumbs button');
  if (thumb) {
    $('#d-shot').src = thumb.dataset.src;
    dialog.querySelectorAll('.thumbs button').forEach((b) => b.classList.toggle('on', b === thumb));
  }
});

// Foco de luz que sigue al ratón en las tarjetas
$('#grid').addEventListener('pointermove', (e) => {
  const card = e.target.closest('.card');
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty('--x', `${e.clientX - r.left}px`);
  card.style.setProperty('--y', `${e.clientY - r.top}px`);
});

// Estrellas y última actividad en vivo desde la API pública de GitHub
let repoData = {};
const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
function ago(iso) {
  const hours = (Date.parse(iso) - Date.now()) / 36e5;
  if (hours > -24) return rtf.format(Math.round(hours), 'hour');
  if (hours > -24 * 30) return rtf.format(Math.round(hours / 24), 'day');
  return rtf.format(Math.round(hours / 24 / 30), 'month');
}
function fillRepoData() {
  document.querySelectorAll('[data-stars]').forEach((el) => {
    const d = repoData[el.dataset.stars];
    if (d) el.textContent = `★ ${d.stargazers_count}`;
  });
  document.querySelectorAll('[data-updated]').forEach((el) => {
    const d = repoData[el.dataset.updated];
    if (d) { el.textContent = `↻ ${ago(d.pushed_at)}`; el.title = 'Último push'; }
  });
}
fetch(`https://api.github.com/users/${USER}/repos?per_page=100`)
  .then((r) => (r.ok ? r.json() : []))
  .then((list) => {
    repoData = Object.fromEntries(list.map((r) => [r.name, r]));
    fillRepoData();
  })
  .catch(() => {});

// Aparición suave al hacer scroll
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 5) * 60}ms`;
  io.observe(el);
});

// Efecto "descifrado" del nombre
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const target = $('#scramble');
if (!reduced) {
  const final = target.textContent;
  const chars = '!<>-_\\/[]{}=+*^?#01';
  let frame = 0;
  const tick = () => {
    target.textContent = [...final].map((ch, i) =>
      frame > 8 + i * 6 ? ch : chars[Math.floor(Math.random() * chars.length)]).join('');
    if (frame++ < 8 + final.length * 6) requestAnimationFrame(tick);
  };
  setTimeout(tick, 250);
}
