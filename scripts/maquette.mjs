import { countWords, httpsUrl, sourceNames } from './carnet.mjs'

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char])
}

const eventDate = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long', timeZone: 'UTC' })

const drawings = {
  cycle: '<path d="M22 36a20 20 0 1 1 8 14m-9-1 9 1-1-9"/>',
  equilibre: '<path d="M40 15v34m-16 0h32M16 24h48M20 24l-8 16h16zm40 0-8 16h16z"/>',
  branches: '<path d="M40 51V30m0 0L22 15m18 15 18-15"/><circle cx="22" cy="15" r="4"/><circle cx="58" cy="15" r="4"/>',
  trajectoire: '<path d="M12 49Q36 6 68 23m-7-8 7 8-9 5"/><circle cx="12" cy="49" r="3"/>',
  couches: '<path d="M40 8 68 25 40 42 12 25ZM12 34l28 17 28-17M12 42l28 17 28-17"/>',
  rayonnement: '<path d="M40 8v9m0 30v9M16 32h9m30 0h9M23 15l7 7m20 20 7 7m0-34-7 7M30 42l-7 7"/><circle cx="40" cy="32" r="9"/>',
  grille: '<path d="M10 23h60v22H10zm15 0v22m15-22v22m15-22v22M40 9v10m-4-4 4 4 4-4"/>',
  tour: '<path d="M40 7 19 54m21-47 21 47M29 36h22M24 47h32M13 54h54M36 13a8 8 0 0 0-7 5m15-5a8 8 0 0 1 7 5"/>',
  relief: '<path d="M8 49h64M11 49l24-30 16 18 8-8 12 20M35 19V9h12v10"/>',
  lentille: '<circle cx="40" cy="32" r="9"/><circle cx="9" cy="32" r="2"/><circle cx="71" cy="32" r="2"/><path d="M12 32q28-38 56 0m-56 0q28 38 56 0"/>',
  fil: '<path d="M20 8v45M20 15l-9 14 9 13 9-13zM29 29c10 0 9 12 19 12h10m-5-5 13 10m-13 3 13-10"/><circle cx="69" cy="36" r="4"/><circle cx="69" cy="49" r="4"/>',
  onde: '<path d="M8 32h64M8 32q8-28 16 0t16 0 16 0 16 0"/>',
}

export function sketchSvg(motif) {
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 80 64" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${drawings[motif] ?? drawings.rayonnement}</svg>`
}

export function tools() {
  return `<div class="carnet-tools flex flex-wrap items-center gap-2" hidden>
    <div class="theme-switch flex flex-wrap" role="group" aria-label="Thème de la fiche">
      <button type="button" data-theme-choice="paper" aria-pressed="true">Papier carnet</button>
      <button type="button" data-theme-choice="dark" aria-pressed="false">Mode sombre</button>
    </div>
    <button type="button" data-grid-toggle aria-pressed="false">Grille 5 mm</button>
    <button type="button" data-print>Exporter en PDF A5</button>
    <button type="button" data-instagram hidden>Exporter pour Instagram <span aria-hidden="true">↗</span></button>
  </div>`
}

export function instagramDialog() {
  return `<dialog class="instagram-dialog" aria-labelledby="instagram-title">
    <div class="instagram-head">
      <div>
        <h2 id="instagram-title">Carrousel Instagram</h2>
        <p>3 images PNG · 1080 × 1350 px</p>
      </div>
      <form method="dialog"><button type="submit" autofocus>Fermer</button></form>
    </div>
    <p class="instagram-status" role="status"></p>
    <div class="instagram-preview" hidden>
      <img width="1080" height="1350" alt="">
      <div class="instagram-nav" role="group" aria-label="Images du carrousel">
        <button type="button" data-previous aria-label="Image précédente">←</button>
        <span data-slide-label aria-live="polite" aria-atomic="true"></span>
        <button type="button" data-next aria-label="Image suivante">→</button>
      </div>
      <div class="instagram-actions">
        <a data-download download>Télécharger ce PNG</a>
        <a data-zip download>Télécharger les 3 (ZIP)</a>
        <button type="button" data-share hidden>Partager les 3 images</button>
      </div>
    </div>
  </dialog>`
}

export function carnet(fiche, number) {
  const escape = escapeHtml
  const { reference, sketch, event } = fiche
  return `<article class="sheet carnet" data-fiche-number="${number}" data-fiche-domain="${escape(fiche.domain)}">
    <header class="carnet-title">
      <p class="eyebrow">Fiche #${number} · ${escape(fiche.domain)}</p>
      <h1>${escape(fiche.title)}</h1>
      <p class="carnet-meta">${sourceNames[fiche.source]} · ${countWords(fiche)} mots</p>
    </header>
    <div class="bento grid gap-3">
      <section class="tile lead">
        <h2>L’essentiel en bref</h2>
        <p>${fiche.intro.map(escape).join(' ')}</p>
${event ? `        <p class="event">Événement d’origine · <a href="${escape(httpsUrl(event.url))}">${escape(event.title)}</a> <time datetime="${escape(event.date)}">(${escape(eventDate.format(new Date(event.date + 'T00:00:00Z')))})</time></p>
` : ''}      </section>
      <section class="tile key-points min-w-0">
        <h2>Les 3 points clés</h2>
        <ol>
          <li><strong>Mécanisme.</strong> ${escape(fiche.mecanisme)}</li>
          <li><strong>Portée.</strong> ${escape(fiche.portee)}</li>
          <li><strong>Postérité.</strong> ${escape(fiche.posterite)}</li>
        </ol>
      </section>
      <figure class="tile sketch min-w-0">
        <figcaption><strong>Croquis mémo</strong><span>${escape(sketch.caption)}</span></figcaption>
        ${sketchSvg(sketch.motif)}
      </figure>
      <section class="tile anecdote">
        <h2>L’anecdote à retenir</h2>
        <p>${escape(fiche.anecdote)}</p>
      </section>
      <section class="tile reference">
        <h2>Pour aller plus loin</h2>
        <p><a href="${escape(httpsUrl(reference.url))}">${escape(reference.label)}</a></p>
      </section>
    </div>
  </article>`
}
