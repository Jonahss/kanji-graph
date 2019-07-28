let test = require('ava')
let _ = require('lodash')
let RedisGraph = require('ioredisgraph')

test.beforeEach(async t => {
  t.context.graph = new RedisGraph(`test:${t.title.match(/beforeEach hook for (.*)/)[1]}`)
  await t.context.graph.query(`CREATE (:genesis)`)
  t.context.addWord = require('./add-word.js')(t.context.graph)
})

test.afterEach.always(async t => {
  return t.context.graph.delete().catch(() => {})
})

test('add-word', async t => {
  let word = {
    kanji: '片付く',
    pronunciation: [
      'かたづく'
    ],
    meaning: 'to put in order,to dispose of,to solve'
  }

  let results = await t.context.addWord(word)

  let kanjiNodes = await t.context.graph.query(`MATCH (k:kanji) RETURN k`)
  t.true(_.difference(kanjiNodes.map(n => n.k.character), ['片', '付']).length == 0)

  let expectedWord = {
    w: {
      kanji: '片付く',
      meaning: 'to put in order,to dispose of,to solve',
      pronunciation: 'かたづく',
    }
  }

  let wordNodes = await t.context.graph.query(`MATCH (w:word) RETURN w`)
  t.is(wordNodes[0].kanji, expectedWord.kanji)
  t.is(wordNodes[0].meaning, expectedWord.meaning)
  t.is(wordNodes[0].pronunciation, expectedWord.pronunciation)
  t.true(wordNodes.length == 1)

  let connections = await t.context.graph.query(`MATCH (:word)-[e:writtenWith]->(:kanji) RETURN e`)
  t.true(connections.length == 2)
})
