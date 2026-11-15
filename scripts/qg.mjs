import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { validateFiche } from './carnet.mjs'
import { curateFiche } from './curation.mjs'
import { carnet, escapeHtml, tools } from './maquette.mjs'

const root = new URL('../', import.meta.url)
const content = new URL('contenu/', root)
const pages = new URL('fiches/', root)
const today = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }).format(new Date())
const frenchDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' })

function identifier(fiche) {
  return String(fiche.number).padStart(3, '0')
}

function displayNumber(fiche) {
  return String(fiche.number).padStart(2, '0')
}

function dateTag(fiche) {
  return `<time datetime="${fiche.date}">${frenchDate.format(new Date(fiche.date + 'T00:00:00Z'))}</time>`
}

function html(title, relative, markup, description, interactive = false) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <title>${escapeHtml(title)}</title>
${interactive ? `  <link rel="stylesheet" href="${relative}tailwind.css">
  <script src="${relative}carnet.js" defer></script>
` : ''}  <link rel="stylesheet" href="${relative}style.css">
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
          <span class="eyebrow">Fiche #${displayNumber(fiche)}${fiche.domain ? ` · ${escapeHtml(fiche.domain)}` : ''}</span>
          <h3>${escapeHtml(fiche.title)}</h3>
          ${dateTag(fiche)}
        </a></li>`

  return html('QG — Carnets de culture générale', '', `<main class="shell">
  <header class="masthead">
    <div>
      <p class="eyebrow">QG · Collection A5</p>
      <h1>Carnets de<br class="display-break"> culture générale</h1>
      <p class="intro">Une fiche à découvrir chaque jour, à lire ou à imprimer.</p>
      <a class="topics-link" href="https://github.com/VachetVirginie/qg/edit/main/sujets.txt">Ajouter des sujets sur GitHub</a>
    </div>
    <p class="count"><strong>${fiches.length}</strong> ${fiches.length === 1 ? 'fiche' : 'fiches'}</p>
  </header>
  ${latest ? `<section class="featured" aria-labelledby="latest-title">
    <p class="eyebrow">Dernière fiche · #${displayNumber(latest)}${latest.domain ? ` · ${escapeHtml(latest.domain)}` : ''}</p>
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
  if (fiche.intro) {
    validateFiche(fiche)
    return html(`Fiche #${displayNumber(fiche)} — ${fiche.title} | QG`, '../', `<main class="shell reader carnet-reader">
  <nav aria-label="Collection"><a class="back" href="../">← Toutes les fiches</a></nav>
  ${tools()}
  ${carnet(fiche, displayNumber(fiche))}
</main>`, `Fiche de culture générale sur ${fiche.title}, au format A5.`, true)
  }

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

const subject = values.subject?.trim()
if (subject || values.daily) {
  const selected = await curateFiche(fiches, today, subject)
  if (selected) {
    const fiche = { ...selected, date: today, number: (fiches.at(-1)?.number ?? 0) + 1 }
    await writeFile(new URL(`${identifier(fiche)}.json`, content), JSON.stringify(fiche, null, 2) + '\n', { flag: 'wx' })
    fiches.push(fiche)
    console.log(`Fiche #${displayNumber(fiche)} créée · ${fiche.title}`)
  }
}
await writeFile(new URL('index.html', root), homepage(fiches))
await Promise.all(fiches.map(fiche => writeFile(new URL(`${identifier(fiche)}.html`, pages), fichePage(fiche))))
