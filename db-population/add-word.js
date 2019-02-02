// words looks like:
// {
//   kanji: '初め',
//   pronunciation: [
//     'はじめ'
//   ],
//   meaning: 'beginning'
// }

function addWordFunctionFactory (graph) {
  return async (word) => {
    // to add a word to the graph:
    // create a new WORD node for the word itself. include the meaning and pronunciations
    // for each kanji in the word:
    //   if the kanji doesn't exist as a KANJI node, create it
    //   create a relationship between the WORD and the KANJI

    let kanji = getNonKanaKanji(word.kanji)

    try {
      await Promise.all(kanji.map(kanji => {
        return graph.query(`MERGE (:kanji {character: '${kanji}'})`)
      }))
    } catch (e) {
      console.log('messed up word', word, e.message)
      return
    }

    let whereClause = kanji.map(k => {
      return `k.character = '${k}'`
    }).join(' OR ')
    whereClause += ` AND w.kanji = '${word.kanji}'`

    await graph.query(`CREATE (:word {kanji: '${word.kanji}', pronunciation: '${word.pronunciation.join(',')}', meaning: '${word.meaning}'})`)
    let ex = await graph.query(`MATCH (k:kanji), (w:word) WHERE ${whereClause} CREATE (w)-[:writtenWith]->(k)`)
    console.log('PLAN', ex.meta)
  }
}

function getNonKanaKanji (string) {
  return string.split('').filter(char => {
    return /[\u3400-\u4DB5\u4E00-\u9FCB\uF900-\uFA6A]/.test(char) // from https://stackoverflow.com/a/53807563/375688
  })
}

module.exports = addWordFunctionFactory
