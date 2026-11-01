// Las tarjetas vienen ya en el HTML (las genera scripts/update-projects.mjs);
// aquí solo se abre la ventana de detalle y se animan cosas.
import { ago, esc, feature, kind, langAttr, langBar, meta, visual } from './cards.mjs';

const $ = (s, el = document) => el.querySelector(s);

const dialog = $('#detail');
function openDetail(p) {
  const links = [
    ['Página del proyecto', `/proyectos/${p.slug}/`, false],
    p.homepage && ['Web', p.homepage],
    p.release && ['Descargar', p.release],
    p.fork && [`Original: ${p.fork.nameWithOwner}`, p.fork.url],
  ].filter(Boolean);
  const intro = p.intro || p.description;
  $('#d-body').innerHTML = `
    <div style="--c:${p.accent}">
      ${visual(p, true)}
      <div class="d-content">
        <span class="kind mono">${esc(kind(p))}</span>
        <h2 id="d-title">${esc(p.title)}</h2>
        <p class="lead"${langAttr(intro)}>${esc(intro)}</p>
        ${p.features.length ? `<ul class="features">${p.features.map((f) => `<li${langAttr(f)}>${feature(f)}</li>`).join('')}</ul>` : ''}
        ${p.topics.length ? `<div class="topics">${p.topics.map((t) => `<span class="mono">#${esc(t)}</span>`).join('')}</div>` : ''}
        ${langBar(p.langs, true)}
        <div class="d-actions">
          <a class="btn primary" href="${esc(p.url)}" target="_blank" rel="noopener">Ver en GitHub ↗</a>
          ${links.map(([label, href, external = true]) => external
            ? `<a class="btn" href="${esc(href)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`
            : `<a class="btn" href="${esc(href)}">${esc(label)} →</a>`).join('')}
          <span class="d-meta">${meta(p)}</span>
        </div>
      </div>
    </div>`;
  dialog.showModal();
}

// Sin datos (o con Ctrl/clic central) la tarjeta navega a la página del proyecto
let projects = [];
$('#grid').addEventListener('click', (e) => {
  const card = e.target.closest('.card');
  if (!card || !projects.length || e.ctrlKey || e.metaKey || e.shiftKey) return;
  e.preventDefault();
  openDetail(projects[card.dataset.i]);
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
document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 5) * 60}ms`;
  io.observe(el);
});

// Las fechas del HTML son de la hora del build
document.querySelectorAll('time[datetime]').forEach((t) => { t.textContent = ago(t.dateTime); });

fetch('/projects.json', { cache: 'no-cache' })
  .then((r) => r.json())
  .then((data) => { projects = data.projects; })
  .catch(() => {});

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
