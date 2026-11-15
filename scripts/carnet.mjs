export const domains = ['Mythologie', 'Légende', 'Philosophie', 'Sciences', 'Architecture', 'Droit', 'Psychologie', 'Histoire', 'Art', 'Économie', 'Société', 'Géographie']
export const motifs = ['cycle', 'equilibre', 'branches', 'trajectoire', 'couches', 'rayonnement', 'grille', 'tour', 'relief', 'onde', 'lentille']
export const sourceNames = { personnel: 'Liste personnelle', general: 'Culture générale', actualite: 'Écho à l’actualité' }

const words = new Intl.Segmenter('fr', { granularity: 'word' })
const sentences = new Intl.Segmenter('fr', { granularity: 'sentence' })

export function countWords(fiche) {
  const text = [...fiche.intro, fiche.mecanisme, fiche.portee, fiche.posterite, fiche.anecdote, fiche.reference.label].join(' ')
  return [...words.segment(text)].filter(word => word.isWordLike).length
}

export function httpsUrl(value) {
  if (typeof value !== 'string') return
  const url = URL.parse(value)
  if (url?.protocol === 'https:' && !url.username && !url.password) return url.href
}

export function normalize(value) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^\p{Letter}\p{Number}]+/gu, ' ').trim()
}

export function topicKeys(fiche) {
  return [
    ...[fiche.title, fiche.subject, ...(fiche.aliases ?? [])].filter(Boolean).map(normalize),
    ...(fiche.pageId ? ['wiki:' + fiche.pageId] : []),
    ...(fiche.entity ? ['wikidata:' + fiche.entity] : []),
  ]
}

export function isMyth(topic) {
  return ['Mythologie', 'Légende'].includes(topic.domain)
}

export function validateFiche(fiche) {
  const text = [fiche.title, ...fiche.intro, fiche.mecanisme, fiche.portee, fiche.posterite, fiche.anecdote, fiche.reference.label, fiche.sketch.caption]
  if (text.some(value => typeof value !== 'string' || !value.trim() || /[\r\n<>]/.test(value))) {
    throw new Error('Les rubriques doivent contenir du texte simple sur une ligne.')
  }
  if (!domains.includes(fiche.domain) || !motifs.includes(fiche.sketch.motif) || !Object.hasOwn(sourceNames, fiche.source)) {
    throw new Error('Domaine, origine ou motif de croquis invalide.')
  }
  if (fiche.intro.length !== 2 || fiche.intro.some(line => [...sentences.segment(line)].length !== 1 || !/[.!?…]$/.test(line))) {
    throw new Error('L’accroche doit contenir exactement deux phrases complètes.')
  }
  if (!httpsUrl(fiche.reference.url) || fiche.title.length > 100 || fiche.sketch.caption.length > 100 || fiche.reference.label.length > 130) {
    throw new Error('Titre, légende du croquis ou référence inadéquate.')
  }
  if (fiche.source === 'actualite' && (!fiche.event?.title || !httpsUrl(fiche.event.url) || !/^\d{4}-\d{2}-\d{2}$/.test(fiche.event.date) || !Number.isFinite(Date.parse(fiche.event.date)))) {
    throw new Error('Une fiche d’actualité doit être rattachée à un événement daté et sourcé.')
  }
  const count = countWords(fiche)
  if (count < 185 || count > 200) throw new Error(`Longueur hors calibration : ${count} mots.`)
  return fiche
}

export function parseTopics(text, source) {
  return text.split(/\r?\n/).flatMap(line => {
    const cleaned = line.trim().replace(/^(?:[-*•]|\d+[.)])\s+/, '')
    if (!cleaned || cleaned.startsWith('#')) return []
    const [prefix, ...rest] = cleaned.split('|')
    const domain = domains.find(label => normalize(label) === normalize(prefix))
    return domain && rest.length
      ? [{ title: rest.join('|').trim(), domain, source }].filter(topic => topic.title)
      : [{ title: cleaned, source }]
  })
}

export function eligible(topic, history) {
  const previous = history.at(-1)
  if (previous && isMyth(previous) && isMyth(topic)) return false
  const used = new Set(history.flatMap(topicKeys))
  return !topicKeys(topic).some(key => used.has(key))
}

export function chooseTopics(topics, history, random = Math.random) {
  const pools = new Map()
  for (const topic of topics.filter(topic => eligible(topic, history))) {
    if (!pools.has(topic.source)) pools.set(topic.source, [])
    pools.get(topic.source).push(topic)
  }

  const weights = { personnel: 2, general: 2, actualite: 1 }
  const recent = history.slice(-10)
  const chosen = []
  while (pools.size) {
    const ranked = [...pools.keys()].map(source => {
      const total = recent.filter(fiche => fiche.source === source).length + chosen.filter(topic => topic.source === source).length
      return { source, score: (total + random()) / weights[source] }
    }).sort((first, second) => first.score - second.score)
    const { source } = ranked[0]
    const pool = pools.get(source)
    const [topic] = pool.splice(Math.floor(random() * pool.length), 1)
    if (!pool.length) pools.delete(source)
    chosen.push(topic)
  }
  return chosen
}
