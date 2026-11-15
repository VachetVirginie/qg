import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { chooseTopics, countWords, eligible, parseTopics, validateFiche } from './carnet.mjs'

const readJson = async path => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'))
const prepared = await readJson('../data/fiches-pretes.json')
const actualite = await readJson('../contenu/005.json')
const archive = await Promise.all([1, 2, 3, 4].map(n => readJson(`../contenu/00${n}.json`)))

test('le corps des fiches tient entre 185 et 200 mots et l’accroche a deux phrases', () => {
  for (const fiche of [...archive, actualite, ...prepared]) {
    assert.equal(fiche.intro.length, 2)
    assert.ok(countWords(validateFiche(fiche)) >= 185)
    assert.ok(countWords(fiche) <= 200)
  }
  const [fiche] = archive
  assert.throws(() => validateFiche({ ...fiche, intro: ['Phrase unique.'] }), /exactement deux phrases/)
  assert.throws(() => validateFiche({ ...fiche, mecanisme: 'Bref.' }), /calibration/)
  assert.throws(() => validateFiche({ ...fiche, reference: { ...fiche.reference, url: 'javascript:alert(1)' } }), /référence/)
})

test('la liste personnelle accepte des lignes simples, des puces et des domaines', () => {
  assert.deepEqual(parseTopics('# commentaire\n51. MyTHologie | Les Danaïdes\n• La séparation des pouvoirs\n', 'personnel'), [
    { title: 'Les Danaïdes', domain: 'Mythologie', source: 'personnel' },
    { title: 'La séparation des pouvoirs', source: 'personnel' },
  ])
})

test('l’archive entière bloque les doublons par titre, alias et page canonique', () => {
  const [tantale] = prepared
  const history = [tantale, ...archive]
  assert.equal(eligible({ title: 'TANTALE' }, history), false)
  assert.equal(eligible({ title: 'Une autre formulation', pageId: tantale.pageId }, history), false)
  assert.equal(eligible({ title: 'Un nouveau titre', entity: tantale.entity }, history), false)
  assert.equal(eligible({ title: 'Les horloges atomiques' }, history), true)
})

test('un mythe ne peut pas suivre un autre mythe ou une légende', () => {
  const [tantale, danaides] = prepared
  assert.equal(eligible(danaides, [tantale]), false)
  assert.equal(eligible(danaides, [{ title: 'Merlin', domain: 'Légende' }]), false)
  assert.equal(eligible(danaides, [tantale, ...archive]), true)
})

test('un tirage privilégie les sources sous-représentées et tire dans le bon groupe', () => {
  const history = archive.slice()
  const news = { title: 'Sujet inédit', source: 'actualite' }
  const ranked = chooseTopics([...prepared, news], history, () => 0.5)
  assert.equal(ranked[0].source, 'personnel')
  assert.equal(ranked[1].source, 'actualite')
  assert.ok(ranked.includes(news))
  assert.equal(chooseTopics(prepared, history, () => 0.5).some(topic => topic.source === 'actualite'), false)
})

test('le mode sans clé tire une fiche contrôlée et conserve un seul tirage par date', async () => {
  const { curateFiche } = await import('./curation.mjs')
  if (process.env.OPENAI_API_KEY) return
  const history = [...archive, actualite]
  assert.equal(await curateFiche(history, actualite.date), undefined)
  const fiche = await curateFiche(history, '2026-11-16')
  assert.ok(prepared.some(item => item.pageId === fiche.pageId))
  assert.ok(eligible(fiche, history))
})

test('la rédaction contrôle le nombre de mots et les liens renvoyés par la recherche', async context => {
  const { writeFiche } = await import('./editorial-ai.mjs')
  const fiche = { ...prepared[0], canonicalTitle: 'Tantale' }
  const attempts = []
  context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses')
    const request = JSON.parse(options.body)
    attempts.push(JSON.parse(request.input))
    const draft = attempts.length === 1 ? { ...fiche, mecanisme: 'Bref.' } : fiche
    return new Response(JSON.stringify({ status: 'completed', output: [
      { type: 'web_search_call', action: { sources: [{ url: fiche.reference.url }] } },
      { type: 'message', content: [{ type: 'output_text', text: JSON.stringify(draft), annotations: [] }] },
    ] }))
  })
  const written = await writeFiche({ title: 'Tantale', source: 'personnel' }, archive)
  assert.equal(written.canonicalTitle, 'Tantale')
  assert.equal(attempts.length, 2)
  assert.ok(attempts[1].previousCount < 185)
})
