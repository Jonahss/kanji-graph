let RedisGraph = require('ioredisgraph')
let graph = new RedisGraph('kanji')

let orderedByFrequency = graph.query(`MATCH (w:word)-[r:writtenWith]->(k:kanji) RETURN k.character, count(w.meaning) as c order by c desc`)

orderedByFrequency.then(async (results) => {
  results = results.filter((res) => {
    return res.c > 20
  })
  results.forEach((res) => {
    console.log(`${res['k.character']} found in ${res.c} words`)
  })

  console.log('total', results.length)

  let topTen = results.slice(0, 10)
  let whereClauseA = topTen.map((res) => `k.character = '${res['k.character']}'`).join(' OR ')
  let whereClauseB = topTen.map((res) => `kk.character = '${res['k.character']}'`).join(' OR ')
  results = await graph.query(`MATCH (kk:kanji)<-[]-(w:word)-[]->(k:kanji) WHERE (${whereClauseA}) AND (${whereClauseB}) AND (k.character != kk.character) RETURN w.kanji, w.meaning`)

  results.forEach((res) => {
    console.log(`${res['w.kanji']} ${res['w.meaning']}`)
  })

  console.log(results.length, ' words found in top 10 most used kanji')
})
