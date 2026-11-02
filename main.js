// Las tarjetas vienen ya en el HTML (las genera scripts/update-projects.mjs);
// aquí se abre la ventana de detalle y se actualizan fechas relativas.
import { ago, esc, feature, kind, langAttr, langBar, meta, visual } from './cards.mjs';

const $ = (s, el = document) => el.querySelector(s);

const dialog = $('#detail');
function openDetail(p) {
  if (!dialog) return;
  const links = [
    ['Página del proyecto', `/proyectos/${p.slug}/`, false],
    p.homepage && ['Web', p.homepage],
    p.release && ['Descargar', p.release],
    p.fork && [`Original: ${p.fork.nameWithOwner}`, p.fork.url],
  ].filter(Boolean);
  const intro = p.intro || p.description;
  const dBody = $('#d-body');
  if (dBody) {
    dBody.innerHTML = `
      <div>
        ${visual(p, true)}
        <div class="d-content">
          <span class="kind mono">${esc(kind(p))}</span>
          <h2 id="d-title">${esc(p.title)}</h2>
          <p class="lead"${langAttr(intro)}>${esc(intro)}</p>
          ${p.features && p.features.length ? `<ul class="features">${p.features.map((f) => `<li${langAttr(f)}>${feature(f)}</li>`).join('')}</ul>` : ''}
          ${p.topics && p.topics.length ? `<div class="topics">${p.topics.map((t) => `<span class="mono">#${esc(t)}</span>`).join('')}</div>` : ''}
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
  }
  document.body.style.overflow = 'hidden';
  dialog.showModal();
}

// Sin datos (o con Ctrl/clic central) la tarjeta navega a la página del proyecto
let projects = [];
const grid = $('#grid');
if (grid) {
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.card');
    if (!card || !projects.length || e.ctrlKey || e.metaKey || e.shiftKey) return;
    e.preventDefault();
    openDetail(projects[card.dataset.i]);
  });
}

if (dialog) {
  const unlockScroll = () => {
    document.body.style.overflow = '';
  };
  dialog.addEventListener('close', unlockScroll);
  dialog.addEventListener('cancel', unlockScroll);

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog || e.target.closest('.close')) {
      dialog.close();
      unlockScroll();
    }
    const thumb = e.target.closest('.thumbs button');
    if (thumb) {
      const shot = $('#d-shot');
      if (shot) shot.src = thumb.dataset.src;
      dialog.querySelectorAll('.thumbs button').forEach((b) => b.classList.toggle('on', b === thumb));
    }
  });
}

// Aparición suave al hacer scroll (solo con JS activo)
const io = new IntersectionObserver((entries) => entries.forEach((e) => {
  if (e.isIntersecting) {
    e.target.classList.add('in');
    io.unobserve(e.target);
  }
}), { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${(i % 4) * 50}ms`;
  io.observe(el);
});

// Fechas relativas
document.querySelectorAll('time[datetime]').forEach((t) => {
  t.textContent = ago(t.dateTime);
});

fetch('/projects.json', { cache: 'no-cache' })
  .then((r) => r.json())
  .then((data) => { projects = data.projects; })
  .catch(() => {});

// Actualización automática del año
const currentYear = new Date().getFullYear();
document.querySelectorAll('#year, .current-year').forEach((el) => {
  el.textContent = currentYear;
});

// Horas dinámicas en mensajes estilo Telegram según formato 12h/24h del dispositivo
const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});
const nowMs = Date.now();
document.querySelectorAll('.tg-msg-time').forEach((el) => {
  const offsetMin = parseInt(el.dataset.offset || '0', 10);
  el.textContent = timeFmt.format(new Date(nowMs + offsetMin * 60000));
});

// Efecto de descifrado terminal del identificador u0f
const target = $('#scramble');
if (target && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const final = target.textContent.trim();
  const chars = '!<>-_/[]{}=+*^?#01';
  let step = 0;
  const stagger = 8;
  const baseFrames = 12;

  const tick = () => {
    target.textContent = [...final].map((ch, i) => {
      const lockAt = baseFrames + (i * stagger);
      return step >= lockAt ? ch : chars[Math.floor(Math.random() * chars.length)];
    }).join('');

    const maxSteps = baseFrames + (final.length * stagger);
    if (step++ < maxSteps) {
      setTimeout(tick, 45);
    } else {
      target.textContent = final;
    }
  };

  setTimeout(tick, 400);
}
