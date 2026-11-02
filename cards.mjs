// Plantillas compartidas: las usa el build (tarjetas y páginas de proyecto)
// y main.js (ventana de detalle).
export const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Marca con lang="en" los textos que vienen en inglés de los README
const EN = /\b(the|and|or|in|an|are|from|with|your|you|for|of|to|is|it|on)\b/gi;
const ES = /\b(el|la|los|las|de|del|que|con|para|y|en|tu|es|un|una)\b/gi;
export const langAttr = (s = '') => ((s.match(EN)?.length || 0) > (s.match(ES)?.length || 0) ? ' lang="en"' : '');

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
export function ago(iso) {
  const hours = (Date.parse(iso) - Date.now()) / 36e5;
  if (hours > -23.5) return rtf.format(Math.round(hours), 'hour');
  if (hours > -24 * 30) return rtf.format(Math.round(hours / 24), 'day');
  return rtf.format(Math.round(hours / 24 / 30), 'month');
}

export function visual(p, big = false) {
  if (big && p.shots && p.shots.length) {
    return `<div class="visual shot">
      <img id="d-shot" src="${esc(p.shots[0])}" alt="Captura de ${esc(p.title)}">
      ${p.shots.length > 1 ? `<div class="thumbs">${p.shots.map((s, i) =>
        `<button type="button" class="${i ? '' : 'on'}" data-src="${esc(s)}" aria-label="Captura ${i + 1}"><img src="${esc(s)}" alt=""></button>`).join('')}</div>` : ''}
    </div>`;
  }
  const size = big ? 96 : 72;
  const mark = p.logo
    ? `<img class="logo" src="${esc(p.logo)}" alt="Logo de ${esc(p.title)}" width="${size}" height="${size}" loading="lazy" decoding="async">`
    : `<span class="logo monogram" aria-hidden="true">${esc(p.title[0])}</span>`;
  return `<div class="visual">${mark}</div>`;
}

export function langBar(langs, legend = false) {
  if (!langs || !langs.length) return '';
  const bar = `<div class="langbar">${langs.map((l) =>
    `<span style="width:${l.pct}%;background:${l.color || '#666'}" title="${esc(l.name)} ${l.pct}%"></span>`).join('')}</div>`;
  if (!legend) return bar;
  return bar + `<ul class="legend">${langs.filter((l) => l.pct >= 1).map((l) =>
    `<li><i style="background:${l.color || '#666'}"></i>${esc(l.name)} <span class="muted">${l.pct}%</span></li>`).join('')}</ul>`;
}

export const kind = (p) => (p.fork ? `fork de ${p.fork.nameWithOwner}` : [p.language, ...(p.topics || []).slice(0, 2)].filter(Boolean).join(' · '));

const starIcon = `<svg class="icon icon-star" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
const refreshIcon = `<svg class="icon icon-refresh" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>`;

export const meta = (p) => `<span class="meta-item mono muted">${starIcon} <span>${p.stars ?? 0}</span></span><span class="meta-item mono muted" title="Último push">${refreshIcon} <time datetime="${p.pushedAt}">${ago(p.pushedAt)}</time></span>`;

// "Nombre: texto" pone el nombre en negrita
export const feature = (f) => esc(f).replace(/^([^:]{2,40}):\s/, '<strong>$1:</strong> ');

export const card = (p, i) => `
    <a class="card reveal" href="/proyectos/${p.slug}/" data-i="${i}">
      <div class="card-inner">
        ${visual(p)}
        <div class="card-body">
          <div class="card-meta">
            <span class="kind mono">${esc(kind(p))}</span>
          </div>
          <h3>${esc(p.title)}</h3>
          <p${langAttr(p.description)}>${esc(p.description)}</p>
          ${langBar(p.langs)}
          <div class="card-foot">
            ${meta(p)}
            <span class="more">Detalles →</span>
          </div>
        </div>
      </div>
    </a>`;
