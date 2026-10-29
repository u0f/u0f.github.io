// Genera projects.json con los repos pineados en GitHub.
// Uso local: GITHUB_TOKEN=$(gh auth token) node scripts/update-projects.mjs
import { writeFile } from 'node:fs/promises';

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

const projects = json.data.user.pinnedItems.nodes.map((r) => {
  const readme = parseReadme(r.readme?.text || '', r.nameWithOwner, r.defaultBranchRef?.name || 'main');
  const total = r.languages.totalSize || 1;
  return {
    name: r.name,
    title: readme.title || r.name,
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
  };
});

await writeFile(new URL('../projects.json', import.meta.url), JSON.stringify({ user: USER, projects }, null, 2) + '\n');
console.log(`projects.json: ${projects.map((p) => p.name).join(', ')}`);
