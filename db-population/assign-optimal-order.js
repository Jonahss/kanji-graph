let RedisGraph = require('ioredisgraph')
let _ = require('lodash')

let graph = new RedisGraph('kanji')

async function getFirst () {
  let res = await graph.query(`MATCH (w:word)-[r:writtenWith]->(k:kanji) RETURN k.character, id(k), count(w.kanji) as c order by c desc LIMIT 1`)
  let first = res[0]
  return first
}

// 'touched' words have a relationship to a known kanji
async function touchAdjacentWords () {
  let res = await graph.query(`MATCH (k:kanji {state: 'known'})<-[r]-(w:word) SET w.state = 'touched'`)
  return res
}

// 'known' words can be found by comparing all 'touched' words with all 'touched' words which have relationships with unknown kanji.
async function updateTouchedToKnown () {
  let touched = await getWordsWithState('touched')
  let touchedButNotReadyToLearn = await graph.query(`MATCH (w:word {state: 'touched'})-[]->(k:kanji) WHERE k.state != 'known' RETURN w`)
  console.log('touched', touched.length, 'touched but not ready to learn', touchedButNotReadyToLearn.length)
  let toLearn = _.differenceBy(touched, touchedButNotReadyToLearn, (w) => w.w.id)

  await setNodeState(toLearn.map(w => w.w.id), 'known')

  return toLearn
}

async function getWordsWithState (state) {
  let res = await graph.query(`MATCH (w:word {state: '${state}'}) RETURN w`)
  return res
}

async function setNodeState (ids, state) {
  ids = [].concat(ids) // make it an array, even if you pass in a single id
  if (!ids.length) {
    console.warn(`no nodes to set to state ${state}`)
    return []
  }
  let whereClause = ids.map(id => `id(n) = ${id}`).join(' OR ')
  console.log(`MATCH (n) WHERE ${whereClause} SET n.state = '${state}'`)
  let res = await graph.query(`MATCH (n) WHERE ${whereClause} SET n.state = '${state}'`)
  return res
}

async function run () {
  // genesis
  let first = await getFirst()
  console.log('first', first)
  await setNodeState(first['id(k)'], 'known') // learn the first kanji

  // learn words
  let words = await touchAdjacentWords()
  console.log(words)

  let touched = await getWordsWithState('touched')

  console.log('touched', touched.map(w => w.w.kanji), touched.length)

  let justLearned = await updateTouchedToKnown()

  console.log('words just learned', justLearned.map(w => w.w.kanji), justLearned.length)

  // learn next kanji


  graph.quit()
}

// cool! to get next: "MATCH (k:kanji)<-[]-(w:word {state: 'touched'}) WHERE id(k) != 49 RETURN k, count(k) as c order by c desc LIMIT 1"

run()

// async function test () {
//   let res = await graph.query(`MATCH (k:kanji), (w:word {kanji: '消しゴム', pronunciation: 'けしゴム'}) WHERE k.character = '消' RETURN k,w`)
//   console.log(res)
// }
// test()
