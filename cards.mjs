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
  if (big && p.shots.length) {
    return `<div class="visual shot">
      <img id="d-shot" src="${esc(p.shots[0])}" alt="Captura de ${esc(p.title)}">
      ${p.shots.length > 1 ? `<div class="thumbs">${p.shots.map((s, i) =>
        `<button type="button" class="${i ? '' : 'on'}" data-src="${esc(s)}" aria-label="Captura ${i + 1}"><img src="${esc(s)}" alt=""></button>`).join('')}</div>` : ''}
    </div>`;
  }
  const size = big ? 120 : 88;
  const mark = p.logo
    ? `<img class="logo" src="${esc(p.logo)}" alt="Logo de ${esc(p.title)}" width="${size}" height="${size}" loading="lazy" decoding="async">`
    : `<span class="logo monogram" aria-hidden="true">${esc(p.title[0])}</span>`;
  return `<div class="visual">${mark}</div>`;
}

export function langBar(langs, legend = false) {
  const bar = `<div class="langbar">${langs.map((l) =>
    `<span style="width:${l.pct}%;background:${l.color || '#666'}" title="${esc(l.name)} ${l.pct}%"></span>`).join('')}</div>`;
  if (!legend) return bar;
  return bar + `<ul class="legend">${langs.filter((l) => l.pct >= 1).map((l) =>
    `<li><i style="background:${l.color || '#666'}"></i>${esc(l.name)} <span class="muted">${l.pct}%</span></li>`).join('')}</ul>`;
}

export const kind = (p) => (p.fork ? `fork de ${p.fork.nameWithOwner}` : [p.language, ...p.topics.slice(0, 2)].filter(Boolean).join(' · '));
export const meta = (p) => `<span class="mono muted">★ ${p.stars}</span><span class="mono muted" title="Último push">↻ <time datetime="${p.pushedAt}">${ago(p.pushedAt)}</time></span>`;
// "Nombre: texto" pone el nombre en negrita
export const feature = (f) => esc(f).replace(/^([^:]{2,40}):\s/, '<strong>$1:</strong> ');

export const card = (p, i) => `
    <a class="card reveal" href="/proyectos/${p.slug}/" data-i="${i}" style="--c:${p.accent}">
      <div class="card-inner">
        ${visual(p)}
        <div class="card-body">
          <span class="kind mono">${esc(kind(p))}</span>
          <h3>${esc(p.title)}</h3>
          <p${langAttr(p.description)}>${esc(p.description)}</p>
          ${langBar(p.langs)}
          <div class="card-foot">${meta(p)}<span class="more">Detalles →</span></div>
        </div>
      </div>
    </a>`;
