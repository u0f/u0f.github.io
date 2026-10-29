// Los proyectos salen de projects.json, que genera scripts/update-projects.mjs
// a partir de los repos pineados en GitHub.
const ACCENTS = ['#8b5cf6', '#ff5c7a', '#f5a524', '#34d399', '#5ee7ff', '#1ed760'];

const $ = (s, el = document) => el.querySelector(s);
const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function visual(p, big = false) {
  if (big && p.shots.length) {
    return `<div class="visual shot">
      <img id="d-shot" src="${esc(p.shots[0])}" alt="Captura de ${esc(p.title)}">
      ${p.shots.length > 1 ? `<div class="thumbs">${p.shots.map((s, i) =>
        `<button type="button" class="${i ? '' : 'on'}" data-src="${esc(s)}" aria-label="Captura ${i + 1}"><img src="${esc(s)}" alt=""></button>`).join('')}</div>` : ''}
    </div>`;
  }
  const mark = p.logo
    ? `<img class="logo" src="${esc(p.logo)}" alt="Logo de ${esc(p.title)}" loading="lazy">`
    : `<span class="logo monogram">${esc(p.title[0])}</span>`;
  return `<div class="visual">${mark}</div>`;
}

function langBar(langs, legend = false) {
  const bar = `<div class="langbar">${langs.map((l) =>
    `<span style="width:${l.pct}%;background:${l.color || '#666'}" title="${esc(l.name)} ${l.pct}%"></span>`).join('')}</div>`;
  if (!legend) return bar;
  return bar + `<ul class="legend">${langs.filter((l) => l.pct >= 1).map((l) =>
    `<li><i style="background:${l.color || '#666'}"></i>${esc(l.name)} <span class="muted">${l.pct}%</span></li>`).join('')}</ul>`;
}

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
function ago(iso) {
  const hours = (Date.parse(iso) - Date.now()) / 36e5;
  if (hours > -23.5) return rtf.format(Math.round(hours), 'hour');
  if (hours > -24 * 30) return rtf.format(Math.round(hours / 24), 'day');
  return rtf.format(Math.round(hours / 24 / 30), 'month');
}

const kind = (p) => (p.fork ? `fork de ${p.fork.nameWithOwner}` : [p.language, ...p.topics.slice(0, 2)].filter(Boolean).join(' · '));
const meta = (p) => `<span class="mono muted">★ ${p.stars}</span><span class="mono muted" title="Último push">↻ ${ago(p.pushedAt)}</span>`;
// "Nombre: texto" pone el nombre en negrita
const feature = (f) => esc(f).replace(/^([^:]{2,40}):\s/, '<strong>$1:</strong> ');

function render(projects) {
  $('#grid').innerHTML = projects.map((p, i) => `
    <button class="card reveal" type="button" data-i="${i}" style="--c:${p.accent}">
      <div class="card-inner">
        ${visual(p)}
        <div class="card-body">
          <span class="kind mono">${esc(kind(p))}</span>
          <h3>${esc(p.title)}</h3>
          <p>${esc(p.description)}</p>
          ${langBar(p.langs)}
          <div class="card-foot">${meta(p)}<span class="more">Detalles →</span></div>
        </div>
      </div>
    </button>`).join('');
  $('#active-count').textContent = projects.length;
  const languages = [...new Set(projects.map((p) => p.language).filter(Boolean))];
  $('#stack').textContent = languages.join(' · ');
}

const dialog = $('#detail');
function openDetail(p) {
  const links = [
    p.homepage && ['Web', p.homepage],
    p.release && ['Descargar', p.release],
    p.fork && [`Original: ${p.fork.nameWithOwner}`, p.fork.url],
  ].filter(Boolean);
  $('#d-body').innerHTML = `
    <div style="--c:${p.accent}">
      ${visual(p, true)}
      <div class="d-content">
        <span class="kind mono">${esc(kind(p))}</span>
        <h2 id="d-title">${esc(p.title)}</h2>
        <p class="lead">${esc(p.intro || p.description)}</p>
        ${p.features.length ? `<ul class="features">${p.features.map((f) => `<li>${feature(f)}</li>`).join('')}</ul>` : ''}
        ${p.topics.length ? `<div class="topics">${p.topics.map((t) => `<span class="mono">#${esc(t)}</span>`).join('')}</div>` : ''}
        ${langBar(p.langs, true)}
        <div class="d-actions">
          <a class="btn primary" href="${esc(p.url)}" target="_blank" rel="noopener">Ver en GitHub ↗</a>
          ${links.map(([label, href]) => `<a class="btn" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`).join('')}
          <span class="d-meta">${meta(p)}</span>
        </div>
      </div>
    </div>`;
  dialog.showModal();
}

let projects = [];
$('#grid').addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (card) openDetail(projects[card.dataset.i]);
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

// Aparición suave al hacer scroll
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
}), { threshold: 0.12 });
const reveal = () => document.querySelectorAll('.reveal:not(.in)').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 5) * 60}ms`;
  io.observe(el);
});
reveal();

fetch('projects.json', { cache: 'no-cache' })
  .then((r) => r.json())
  .then((data) => {
    projects = data.projects.map((p, i) => ({ ...p, accent: ACCENTS[i % ACCENTS.length] }));
    render(projects);
    reveal();
  })
  .catch(() => {
    $('#grid').innerHTML = '<p class="muted">No se pudieron cargar los proyectos. Míralos en <a href="https://github.com/u0f">GitHub</a>.</p>';
  });

$('#year').textContent = new Date().getFullYear();

// Efecto "descifrado" del nombre
const target = $('#scramble');
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
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
