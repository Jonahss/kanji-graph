let test = require('ava')

let RedisGraph = require('ioredisgraph')
let graph = new RedisGraph('kanji')
let addWord = require('./add-word.js')(graph)

test('add-word', async t => {
  let word = {
    kanji: '歯',
    pronunciation: [
      'は'
    ],
    meaning: 'tooth'
  }

  let results = await addWord(word)

  let inDb = await graph.query(`MATCH (k:kanji) RETURN k`)
  t.log(JSON.stringify(inDb, null, 2))
})
