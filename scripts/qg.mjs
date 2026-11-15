import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'

const root = new URL('../', import.meta.url)
const content = new URL('contenu/', root)
const pages = new URL('fiches/', root)
const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date())
const frenchDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' })
const sentenceSegmenter = new Intl.Segmenter('fr', { granularity: 'sentence' })
const words = new Intl.Segmenter('fr', { granularity: 'word' })

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char])
}

function countWords(text) {
  return [...words.segment(text)].filter(segment => segment.isWordLike).length
}

function getExcerpt(text) {
  const selected = []
  let total = 0
  for (const paragraph of text.trim().split(/\n+/)) {
    const sentences = []
    for (const { segment } of sentenceSegmenter.segment(paragraph.trim())) {
      const size = countWords(segment)
      if (total + size > 205) {
        if (sentences.length) selected.push(sentences.join(' '))
        return total >= 135 ? selected : []
      }
      if (size) {
        sentences.push(segment.trim())
        total += size
      }
    }
    if (sentences.length) selected.push(sentences.join(' '))
    if (total >= 180) break
  }
  return total >= 135 ? selected : []
}

async function wiki(parameters) {
  const url = new URL('https://fr.wikipedia.org/w/api.php')
  url.search = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', ...parameters })
  const response = await fetch(url, {
    headers: { 'User-Agent': 'QG-Carnets/1.0 (https://github.com/VachetVirginie/qg)' },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`Wikipédia a répondu avec le statut ${response.status}.`)
  const data = await response.json()
  if (data.error) throw new Error(data.error.info)
  return data
}

async function* qualityArticles() {
  const candidates = []
  let continuation
  do {
    const data = await wiki({
      list: 'categorymembers',
      cmtitle: 'Catégorie:Article de qualité',
      cmnamespace: '0',
      cmlimit: '500',
      ...continuation,
    })
    candidates.push(...data.query.categorymembers)
    continuation = data.continue
  } while (continuation)

  while (candidates.length) {
    const index = Math.floor(Math.random() * candidates.length)
    const [candidate] = candidates.splice(index, 1)
    yield { pageids: candidate.pageid }
  }
}

async function createFiche(fiches, subject) {
  const used = new Set(fiches.map(fiche => fiche.pageId))
  if (!subject && fiches.some(fiche => fiche.date === today)) {
    console.log(`Une fiche est déjà disponible pour le ${today}.`)
    return
  }

  let attempts = 0
  for await (const query of subject ? [{ titles: subject }] : qualityArticles()) {
    if (used.has(query.pageids)) continue
    if (attempts++ >= 24) break
    const data = await wiki({
      ...query, prop: 'extracts|info|pageprops', exintro: '1',
      explaintext: '1', redirects: '1', ppprop: 'disambiguation',
    })
    const [article] = data.query?.pages ?? []
    if (!article || article.missing || article.ns !== 0 || 'disambiguation' in (article.pageprops ?? {})) continue
    if (used.has(article.pageid)) {
      if (!subject) continue
      console.log(`Une fiche existe déjà pour « ${article.title} ».`)
      return
    }
    const paragraphs = getExcerpt(article.extract ?? '')
    if (!paragraphs.length) continue
    const fiche = {
      number: (fiches.at(-1)?.number ?? 0) + 1,
      date: today,
      title: article.title,
      pageId: article.pageid,
      revision: article.lastrevid,
      paragraphs,
    }
    await writeFile(new URL(`${identifier(fiche)}.json`, content), JSON.stringify(fiche, null, 2) + '\n', { flag: 'wx' })
    fiches.push(fiche)
    console.log(`Fiche #${identifier(fiche)} créée · ${fiche.title}`)
    return
  }

  throw new Error(subject
    ? `Aucun extrait adapté pour « ${subject} ». Utilise le titre exact d’un article de Wikipédia en français.`
    : 'Aucun article inédit avec un extrait de longueur adaptée n’a été trouvé.')
}

function identifier(fiche) {
  return String(fiche.number).padStart(3, '0')
}

function dateTag(fiche) {
  return `<time datetime="${fiche.date}">${frenchDate.format(new Date(fiche.date + 'T00:00:00Z'))}</time>`
}

function html(title, relative, markup, description) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${relative}style.css">
</head>
<body>
${markup}
</body>
</html>
`
}

function homepage(fiches) {
  const [latest, ...archive] = [...fiches].reverse()
  const card = fiche => `<li><a class="card" href="fiches/${identifier(fiche)}.html">
          <span class="eyebrow">Fiche #${identifier(fiche)}</span>
          <h3>${escapeHtml(fiche.title)}</h3>
          ${dateTag(fiche)}
        </a></li>`

  return html('QG — Carnets de culture générale', '', `<main class="shell">
  <header class="masthead">
    <div>
      <p class="eyebrow">QG · Collection A5</p>
      <h1>Carnets de<br class="display-break"> culture générale</h1>
      <p class="intro">Une fiche à découvrir chaque jour, à lire ou à imprimer.</p>
    </div>
    <p class="count"><strong>${fiches.length}</strong> ${fiches.length === 1 ? 'fiche' : 'fiches'}</p>
  </header>
  ${latest ? `<section class="featured" aria-labelledby="latest-title">
    <p class="eyebrow">Dernière fiche · #${identifier(latest)}</p>
    <h2 id="latest-title">${escapeHtml(latest.title)}</h2>
    <p class="feature-date">${dateTag(latest)}</p>
    <a class="read-link" href="fiches/${identifier(latest)}.html">Lire la fiche <span aria-hidden="true">↗</span></a>
  </section>` : '<p>La collection accueillera bientôt sa première fiche.</p>'}
  ${archive.length ? `<section class="archive" aria-labelledby="archive-title">
    <h2 id="archive-title">Fiches précédentes</h2>
    <ul class="grid" role="list">
        ${archive.map(card).join('\n        ')}
    </ul>
  </section>` : ''}
</main>`, 'Une fiche de culture générale en français chaque jour, au format A5.')
}

function fichePage(fiche) {
  const revisionUrl = new URL('/w/index.php', 'https://fr.wikipedia.org')
  revisionUrl.searchParams.set('oldid', fiche.revision)
  return html(`Fiche #${identifier(fiche)} — ${fiche.title} | QG`, '../', `<main class="shell reader">
  <nav aria-label="Collection"><a class="back" href="../">← Toutes les fiches</a></nav>
  <article class="sheet">
    <header>
      <p class="eyebrow">QG · Fiche #${identifier(fiche)}</p>
      <h1>${escapeHtml(fiche.title)}</h1>
      <p class="feature-date">${dateTag(fiche)}</p>
    </header>
    <div class="reading">
      ${fiche.paragraphs.map(paragraph => `<p>${escapeHtml(paragraph)}</p>`).join('\n      ')}
    </div>
    <footer class="source">
      <p>Source · <a href="${escapeHtml(revisionUrl.href)}">« ${escapeHtml(fiche.title)} » sur Wikipédia</a></p>
      <p>Texte des contributeurs de Wikipédia, abrégé pour cette fiche. Licence <a rel="license" href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr">CC BY-SA 4.0</a>.</p>
    </footer>
  </article>
</main>`, `Fiche de culture générale sur ${fiche.title}, à lire ou à imprimer au format A5.`)
}

const { values } = parseArgs({
  options: { daily: { type: 'boolean' }, subject: { type: 'string' } },
})
await mkdir(content, { recursive: true })
await mkdir(pages, { recursive: true })
const filenames = (await readdir(content)).filter(name => /^\d+\.json$/.test(name))
const fiches = await Promise.all(filenames.map(async name => JSON.parse(await readFile(new URL(name, content), 'utf8'))))
fiches.sort((first, second) => first.number - second.number)

if (values.daily || values.subject?.trim()) await createFiche(fiches, values.subject?.trim())
await writeFile(new URL('index.html', root), homepage(fiches))
await Promise.all(fiches.map(fiche => writeFile(new URL(`${identifier(fiche)}.html`, pages), fichePage(fiche))))
