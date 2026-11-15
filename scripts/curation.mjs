import { readFile } from 'node:fs/promises'
import { chooseTopics, eligible, normalize, parseTopics, topicKeys, validateFiche } from './carnet.mjs'
import { discoverNews, hasAI, writeFiche } from './editorial-ai.mjs'

const root = new URL('../', import.meta.url)

async function canonicalTopic(title) {
  const url = new URL('https://fr.wikipedia.org/w/api.php')
  url.search = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', titles: title,
    redirects: '1', prop: 'pageprops', ppprop: 'wikibase_item|disambiguation',
  })
  const response = await fetch(url, {
    headers: { 'User-Agent': 'QG-Carnets/2.0 (https://github.com/VachetVirginie/qg)' },
    signal: AbortSignal.timeout(15_000),
  })
  if (!response.ok) throw new Error(`Wikipédia a répondu avec le statut ${response.status}.`)
  const data = await response.json()
  const [article] = data.query?.pages ?? []
  if (!article?.pageid || article.ns !== 0 || 'disambiguation' in (article.pageprops ?? {})) {
    throw new Error(`Identité du sujet à préciser : ${title}.`)
  }
  return { pageId: article.pageid, entity: article.pageprops?.wikibase_item, aliases: [article.title] }
}

async function makeFiche(topic, history) {
  if (topic.prepared) return validateFiche(topic.prepared)
  const { canonicalTitle, ...written } = await writeFiche(topic, history)
  const canonical = await canonicalTopic(canonicalTitle)
  const domain = ['Mythologie', 'Légende'].includes(topic.domain) ? topic.domain : written.domain
  return validateFiche({ ...written, ...canonical, domain, subject: topic.title, source: topic.source, event: topic.event })
}

async function loadPools() {
  const [personal, general, library] = await Promise.all([
    readFile(new URL('sujets.txt', root), 'utf8'),
    readFile(new URL('data/sujets-generaux.txt', root), 'utf8'),
    readFile(new URL('data/fiches-pretes.json', root), 'utf8').then(JSON.parse),
  ])
  const prepared = library.map(validateFiche)
  const fromLists = [...parseTopics(personal, 'personnel'), ...parseTopics(general, 'general')]
  return fromLists.map(topic => {
    const ready = prepared.find(fiche => topicKeys(fiche).includes(normalize(topic.title)))
    return ready ? { ...ready, ...topic, prepared: { ...ready, source: topic.source } } : topic
  })
}

export async function curateFiche(history, today, subject) {
  if (!subject && history.some(fiche => fiche.date === today)) {
    console.log(`Une fiche est déjà disponible pour le ${today}.`)
    return
  }

  const pools = await loadPools()
  if (subject) {
    const topic = pools.find(item => topicKeys(item).includes(normalize(subject)))
      ?? { title: subject, source: 'personnel' }
    if (!eligible(topic, history)) throw new Error('Ce sujet a déjà été traité ou enchaînerait deux mythes.')
    if (!topic.prepared && !hasAI) throw new Error('Ce sujet doit être rédigé ou la rédaction automatique doit être configurée.')
    const fiche = await makeFiche(topic, history)
    if (!eligible(fiche, history)) throw new Error('Ce sujet a déjà été traité ou enchaînerait deux mythes.')
    return fiche
  }

  if (hasAI && !history.slice(-3).some(fiche => fiche.source === 'actualite')) {
    try {
      const news = await discoverNews(today, history)
      if (news) pools.push(news)
    } catch (error) {
      console.warn(`Écho à l’actualité indisponible. ${error.message}`)
    }
  }

  const candidates = chooseTopics(pools.filter(topic => hasAI || topic.prepared), history)
  let generatedAttempts = 0
  for (const topic of candidates) {
    if (!topic.prepared && generatedAttempts++ >= 3) continue
    try {
      const fiche = await makeFiche(topic, history)
      if (eligible(fiche, history)) return fiche
      console.log(`Écarté après identification : ${topic.title}.`)
    } catch (error) {
      console.warn(`Sujet écarté · ${topic.title}. ${error.message}`)
    }
  }

  throw new Error(hasAI
    ? 'Aucun sujet inédit n’a produit une fiche conforme.'
    : 'La réserve éditoriale est épuisée. Ajoute une fiche validée ou configure OPENAI_API_KEY.')
}
