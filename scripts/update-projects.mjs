// Genera projects.json con los repos pineados en GitHub y, a partir de él,
// las tarjetas y el JSON-LD de index.html, una página por proyecto,
// sitemap.xml y llms.txt.
// Uso local: GITHUB_TOKEN=$(gh auth token) node scripts/update-projects.mjs
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { card, esc, feature, kind, langAttr, langBar, meta, visual } from '../cards.mjs';

const SITE = 'https://u0f.es';
const ACCENTS = ['#8b5cf6', '#ff5c7a', '#f5a524', '#34d399', '#5ee7ff', '#1ed760'];
// Fecha de la última edición a mano de servicios/bots-vinted-wallapop/index.html
const SERVICES_UPDATED = '2026-11-01';

// Textos en español y slugs para los repos cuyo README está en inglés.
// Un repo que no aparezca aquí usa lo que traiga GitHub.
const OVERRIDES = {
  BlocPlus: {
    tagline: 'Bloc de notas ligero para Windows',
    description: 'Sustituto ligero del Bloc de notas de Windows: pestañas, resaltado de sintaxis, tema oscuro y sesiones. Un solo archivo C#, sin dependencias.',
    intro: 'Un editor de texto ligero que sustituye al Bloc de notas de Windows. Es un único archivo C# sin dependencias que se compila con el compilador que ya trae Windows: no necesitas Visual Studio, el SDK de .NET ni descargar nada más.',
  },
  pokemon_overlay: { tagline: 'Overlays de Pokémon para OBS' },
  cli: { slug: 'spicetify', tagline: 'Spicetify recortado y endurecido' },
  Rastro: { tagline: 'Cartas de Magic al mejor precio en Cardmarket' },
  db_editor: {
    tagline: 'Editor web de SQLite para contenedores Docker',
    description: 'Interfaz web self-hosted para ver y editar las bases de datos SQLite de tus contenedores Docker. Multiarquitectura, con contraseña, copias de seguridad y consola SQL.',
    intro: 'Visor y editor web para las bases de datos SQLite de tus contenedores Docker en marcha. Es lo bastante ligero para cualquier host Docker, incluida una Raspberry Pi o CasaOS.',
  },
  blandis: {
    tagline: 'Juego de físicas blandas para el navegador',
    description: 'Lanza, aplasta y fusiona blobs blanditos numerados hasta llegar a 2048. Juego gratis para el navegador con físicas de cuerpos blandos.',
    intro: 'Elige, lanza, aplasta y fusiona blobs blanditos con números. Un puzle de físicas gratis y muy satisfactorio que funciona en el navegador, en ordenador y en móvil, sin instalar nada.',
  },
};

const USER = process.env.GH_USER || 'u0f';
const TOKEN = process.env.GITHUB_TOKEN;
if (!TOKEN) throw new Error('Falta GITHUB_TOKEN');

const QUERY = `query($login: String!) {
  user(login: $login) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name nameWithOwner description url homepageUrl stargazerCount pushedAt
          parent { nameWithOwner url }
          primaryLanguage { name }
          languages(first: 8, orderBy: { field: SIZE, direction: DESC }) { totalSize edges { size node { name color } } }
          repositoryTopics(first: 6) { nodes { topic { name } } }
          latestRelease { url }
          defaultBranchRef { name }
          readme: object(expression: "HEAD:README.md") { ... on Blob { text } }
        }
      }
    }
  }
}`;

const res = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: { Authorization: `bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
});
const json = await res.json();
if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));

// Markdown/HTML a texto plano
const plain = (s) => s
  .replace(/<[^>]+>/g, '')
  .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\*\*|__|`/g, '')
  .replace(/\*([^*\n]+)\*/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

const short = (s, max = 150) => {
  const cut = s.match(/^.{20,}?\.(?=\s|$)/)?.[0] || s;
  return cut.length > max ? cut.slice(0, max - 1).trimEnd() + '…' : cut;
};

function parseReadme(md, repo, branch) {
  md = md.replace(/```[\s\S]*?```/g, '').replace(/<!--[\s\S]*?-->/g, '');
  const title = plain(md.match(/^#\s+(.+)$/m)?.[1] || md.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || '');

  // Solo imágenes del propio repo o subidas a GitHub (fuera badges externos)
  const images = [];
  for (const m of md.matchAll(/!\[[^\]]*\]\(([^)\s]+)[^)]*\)|<img[^>]+src="([^"]+)"/g)) {
    const src = m[1] || m[2];
    if (/^https?:/.test(src)) {
      if (/^https:\/\/(github\.com\/user-attachments|raw\.githubusercontent\.com)\//.test(src)) images.push(src);
    } else {
      images.push(`https://raw.githubusercontent.com/${repo}/${branch}/${src.replace(/^\.?\//, '')}`);
    }
  }
  // El logo es la primera imagen si aparece antes de la primera sección
  const firstSection = md.search(/^##\s/m);
  const firstImg = md.search(/!\[|<img/);
  const logo = images.length && firstImg !== -1 && (firstSection === -1 || firstImg < firstSection) ? images.shift() : null;

  const intro = md.split(/\n\s*\n/)
    .filter((b) => !/^\s*(#|\||[-*] |>|\d+\.)/.test(b))
    .map(plain)
    .find((t) => t.length > 40) || '';

  // Listas de viñetas con la línea que las presenta. Se prefiere la de
  // "Features" / "Qué incluye"... y si no, la primera que no sea un índice.
  const lists = [];
  let current = [];
  let label = '';
  for (const line of md.split('\n')) {
    const item = line.match(/^[-*]\s+(.+)/);
    if (item) current.push(item[1]);
    else if (/^\s+[-*]\s/.test(line)) continue;
    else if (/^\s+\S/.test(line) && current.length) current[current.length - 1] += ' ' + line.trim();
    else if (line.trim()) {
      if (current.length) lists.push({ label, items: current });
      current = [];
      label = line;
    }
  }
  if (current.length) lists.push({ label, items: current });
  const valid = lists.filter((l) => l.items.length >= 2 && !l.items.some((i) => /^\[[^\]]*\]\(#/.test(i)));
  const list = (valid.find((l) => /feature|incluye|puedes hacer|añadido|what it does|highlights|funciones|características/i.test(l.label)) || valid[0])?.items || [];

  return { title, logo, shots: images.slice(0, 4), intro, features: list.slice(0, 6).map((i) => short(plain(i))) };
}

// Si el README no trae logo, busca en el repo un archivo logo/icon/favicon
async function findLogo(repo, branch) {
  const res = await fetch(`https://api.github.com/repos/${repo}/git/trees/${branch}?recursive=1`, {
    headers: { Authorization: `bearer ${TOKEN}` },
  });
  if (!res.ok) return null;
  const rank = (path) => {
    const name = path.split('/').pop().toLowerCase();
    const kind = ['logo', 'icon', 'favicon'].findIndex((k) => name.startsWith(k));
    return kind * 100 + (name.endsWith('.svg') ? 0 : 10) + path.split('/').length;
  };
  const best = (await res.json()).tree
    .map((f) => f.path)
    .filter((p) => /(^|\/)(logo|icon|favicon)[^/]*\.(svg|png|webp)$/i.test(p) && !/node_modules|vendor|test/i.test(p))
    .sort((a, b) => rank(a) - rank(b))[0];
  return best ? `https://raw.githubusercontent.com/${repo}/${branch}/${best}` : null;
}

const projects = await Promise.all(json.data.user.pinnedItems.nodes.map(async (r, i) => {
  const branch = r.defaultBranchRef?.name || 'main';
  const readme = parseReadme(r.readme?.text || '', r.nameWithOwner, branch);
  readme.logo ||= await findLogo(r.nameWithOwner, branch);
  const total = r.languages.totalSize || 1;
  const { slug, tagline = null, ...texts } = OVERRIDES[r.name] || {};
  return {
    name: r.name,
    slug: slug || r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    accent: ACCENTS[i % ACCENTS.length],
    title: readme.title || r.name,
    tagline,
    // La descripción de un fork es la heredada del original; mejor el README
    description: (!r.parent && r.description) || short(readme.intro, 200),
    intro: readme.intro,
    url: r.url,
    homepage: r.homepageUrl || null,
    release: r.latestRelease?.url || null,
    fork: r.parent,
    stars: r.stargazerCount,
    pushedAt: r.pushedAt,
    language: r.primaryLanguage?.name || null,
    topics: r.repositoryTopics.nodes.map((t) => t.topic.name),
    langs: r.languages.edges
      .map((e) => ({ name: e.node.name, color: e.node.color, pct: Math.round((e.size / total) * 1000) / 10 }))
      .filter((l) => l.pct >= 0.5),
    logo: readme.logo,
    shots: readme.shots,
    features: readme.features,
    ...texts,
  };
}));

const root = (path) => new URL(`../${path}`, import.meta.url);
await writeFile(root('projects.json'), JSON.stringify({ user: USER, projects }, null, 2) + '\n');

const latest = projects.map((p) => p.pushedAt).sort().at(-1);
const pageUrl = (p) => `${SITE}/proyectos/${p.slug}/`;
const person = { '@id': `${SITE}/#joel` };
const ld = (data) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')}</script>`;
// Sustituye lo que haya entre <!-- tag --> y <!-- /tag -->
const fill = (html, tag, content) =>
  html.replace(new RegExp(`(<!-- ${tag} -->)[\\s\\S]*?(<!-- /${tag} -->)`), (_, a, b) => a + content + b);

// Portada: tarjetas, contadores y JSON-LD
const graph = ld({
  '@graph': [
    {
      '@type': 'Person', ...person, name: 'Joel', alternateName: 'u0f', url: `${SITE}/`,
      jobTitle: 'Desarrollador Odoo', knowsLanguage: ['es', 'en'],
      knowsAbout: ['Odoo', 'Python', 'C#', 'JavaScript', 'Docker', 'Bots de Telegram'],
      sameAs: ['https://github.com/u0f', 'https://t.me/aloooo54653'],
    },
    { '@type': 'WebSite', '@id': `${SITE}/#website`, url: `${SITE}/`, name: 'u0f', inLanguage: 'es', publisher: person },
    {
      '@type': 'ProfilePage', '@id': `${SITE}/#page`, url: `${SITE}/`,
      name: 'Joel (u0f) · Desarrollador Odoo y proyectos open source',
      isPartOf: { '@id': `${SITE}/#website` }, mainEntity: person, dateModified: latest,
      hasPart: { '@id': `${SITE}/#proyectos` },
    },
    {
      '@type': 'ItemList', '@id': `${SITE}/#proyectos`, name: 'Proyectos de u0f',
      itemListElement: projects.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: pageUrl(p) })),
    },
  ],
});
const languages = [...new Set(projects.map((p) => p.language).filter(Boolean))];
let index = await readFile(root('index.html'), 'utf8');
index = fill(index, 'ld', graph);
index = fill(index, 'cards', projects.map(card).join('') + '\n      ');
index = fill(index, 'count', projects.length);
index = fill(index, 'stack', esc(languages.join(' · ')));
await writeFile(root('index.html'), index);

// Una página por proyecto
const shell = ({ title, description, path, image, data, body }) => `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${SITE}${path}">
  <meta name="theme-color" content="#090b10">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="u0f">
  <meta property="og:locale" content="es_ES">
  <meta property="og:url" content="${SITE}${path}">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:image" content="${esc(image)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="preload" href="/fonts/sora.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/jetbrains-mono.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/style.css">
  ${ld(data)}
</head>
<body>
  <a class="skip" href="#contenido">Saltar al contenido</a>

  <header class="nav">
    <a class="brand" href="/"><span class="brand-mark">u0f</span><span class="cursor">_</span></a>
    <nav>
      <a href="/#proyectos">Proyectos</a>
      <a href="/servicios/bots-vinted-wallapop/">Servicios</a>
      <a href="/#sobre-mi">Sobre mí</a>
      <a class="nav-gh" href="https://github.com/u0f" target="_blank" rel="noopener">
        <span>GitHub</span>
        <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>
    </nav>
  </header>

  <main id="contenido" class="page">${body}
  </main>

  <footer class="footer">
    <span class="mono muted">© ${new Date().getFullYear()} u0f</span>
    <nav class="footer-links" aria-label="Pie de página">
      <a href="/#proyectos">Proyectos</a>
      <a href="/servicios/bots-vinted-wallapop/">Bots de Vinted y Wallapop</a>
      <a href="https://github.com/u0f" rel="noopener">GitHub</a>
      <a href="https://t.me/aloooo54653" rel="noopener">Telegram</a>
    </nav>
  </footer>
</body>
</html>
`;

const projectPage = (p) => {
  const intro = p.intro || p.description;
  const links = [
    p.release && ['Descargar', p.release],
    p.homepage && ['Web', p.homepage],
    p.fork && [`Original: ${p.fork.nameWithOwner}`, p.fork.url],
  ].filter(Boolean);
  const crumbs = [['Inicio', `${SITE}/`], ['Proyectos', `${SITE}/#proyectos`], [p.title, pageUrl(p)]];
  return shell({
    title: `${p.title}${p.tagline ? ` · ${p.tagline}` : ''} | u0f`,
    description: p.description,
    path: `/proyectos/${p.slug}/`,
    image: p.shots[0] || p.logo || `${SITE}/og.png`,
    data: {
      '@graph': [
        {
          '@type': 'SoftwareSourceCode', '@id': `${pageUrl(p)}#software`, name: p.title, description: p.description,
          url: pageUrl(p), codeRepository: p.url, author: person, dateModified: p.pushedAt,
          ...(p.language && { programmingLanguage: p.language }),
          ...(p.logo && { image: p.logo }),
          ...(p.homepage && { sameAs: p.homepage }),
          ...(p.fork && { isBasedOn: p.fork.url }),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: crumbs.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
        },
      ],
    },
    body: `
    <article class="project">
      <nav class="crumbs mono" aria-label="Migas de pan"><a href="/">Inicio</a> / <a href="/#proyectos">Proyectos</a> / <span aria-current="page">${esc(p.title)}</span></nav>
      <div class="project-head">
        ${visual(p)}
        <div>
          <span class="kind mono">${esc(kind(p))}</span>
          <h1>${esc(p.title)}</h1>
          ${p.tagline ? `<p class="tagline">${esc(p.tagline)}</p>` : ''}
        </div>
      </div>
      <p class="lead"${langAttr(intro)}>${esc(intro)}</p>
      ${p.shots.length ? `<div class="shots">${p.shots.map((s, i) =>
        `<img src="${esc(s)}" alt="Captura ${i + 1} de ${esc(p.title)}"${i ? ' loading="lazy"' : ''} decoding="async">`).join('')}</div>` : ''}
      ${p.features.length ? `<h2>Qué incluye</h2>
      <ul class="features">${p.features.map((f) => `<li${langAttr(f)}>${feature(f)}</li>`).join('')}</ul>` : ''}
      ${p.topics.length ? `<div class="topics">${p.topics.map((t) => `<span class="mono">#${esc(t)}</span>`).join('')}</div>` : ''}
      <h2>Lenguajes</h2>
      ${langBar(p.langs, true)}
      <div class="d-actions">
        <a class="btn primary" href="${esc(p.url)}" rel="noopener">Ver en GitHub ↗</a>
        ${links.map(([label, href]) => `<a class="btn" href="${esc(href)}" rel="noopener">${esc(label)} ↗</a>`).join('')}
        <span class="d-meta">${meta(p)}</span>
      </div>
    </article>

    <section class="section">
      <div class="section-head"><h2>Otros proyectos</h2></div>
      <div class="grid">${projects.filter((q) => q !== p).map((q) => card(q, projects.indexOf(q))).join('')}
      </div>
    </section>`,
  });
};

await rm(root('proyectos'), { recursive: true, force: true });
for (const p of projects) {
  await mkdir(root(`proyectos/${p.slug}`), { recursive: true });
  await writeFile(root(`proyectos/${p.slug}/index.html`), projectPage(p));
}

// sitemap.xml y llms.txt
const urls = [['/', latest], ['/servicios/bots-vinted-wallapop/', SERVICES_UPDATED],
  ...projects.map((p) => [`/proyectos/${p.slug}/`, p.pushedAt])];
await writeFile(root('sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, d]) => `  <url><loc>${SITE}${u}</loc><lastmod>${d.slice(0, 10)}</lastmod></url>`).join('\n')}
</urlset>
`);
await writeFile(root('llms.txt'), `# u0f

> Joel (u0f), desarrollador Odoo. Herramientas open source para Windows, streaming, Magic: The Gathering y self-hosting, y bots de Telegram de pago que avisan de anuncios nuevos en Vinted y Wallapop.

## Proyectos

${projects.map((p) => `- [${p.title}](${pageUrl(p)}): ${p.description}`).join('\n')}

## Servicios

- [Bots de Telegram para Vinted y Wallapop](${SITE}/servicios/bots-vinted-wallapop/): alertas por Telegram en cuanto se publica un anuncio que encaja con tus búsquedas, 24/7.

## Enlaces

- [GitHub](https://github.com/u0f)
- [Telegram](https://t.me/aloooo54653)
`);

console.log(`projects.json, index.html, sitemap.xml, llms.txt y ${projects.length} páginas: ${projects.map((p) => p.slug).join(', ')}`);
