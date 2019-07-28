let RedisGraph = require('ioredisgraph')

let graph = new RedisGraph('kanji')

async function getFirst () {
  let res = await graph.query(`MATCH (w:word)-[r:writtenWith]->(k:kanji) RETURN k.character, id(k), count(w.kanji) as c order by c desc LIMIT 1`)
  let first = res[0]
  return first
}

async function getWords (id) {
  let res = await graph.query(`MATCH (k2:kanji)<-[r]-(w:word)-[]->(k:kanji) WHERE id(k) = ${id} AND id(k2) != id(k) AND id(w) = 3013 RETURN w.kanji, w.meaning, r`)
  return res
}

async function run () {
  let first = await getFirst()
  let words = await getWords(first['id(k)'])
  console.log(words)
  graph.quit()
}

//run()

async function test () {
  let res = await graph.query(`MATCH (k:kanji), (w:word) WHERE (k.character = '湿' OR k.character = '気') AND w.kanji = '湿気' RETURN k, w`)
  console.log(res)
}
test()
