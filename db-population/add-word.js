// words looks like:
// {
//   kanji: '初め',
//   pronunciation: [
//     'はじめ'
//   ],
//   meaning: 'beginning',
//   jlptLevel: 'N1'
// }

//console.log('messed up word', word, e.message)

function addWordFunctionFactory (graph) {
  let addWordFunc = async (word) => {
    // to add a word to the graph:
    // create a new WORD node for the word itself. include the meaning and pronunciations
    // for each kanji in the word:
    //   if the kanji doesn't exist as a KANJI node, create it
    //   create a relationship between the WORD and the KANJI
    let kanji = getNonKanaKanji(word.kanji)

    if (!kanji.length) {
      return
    }

    // sanitize
    word.meaning = word.meaning.replace("'", "\\'")

    await Promise.all(kanji.map(async (kanji) => {
      // query first to find duplicates
      let existing = await graph.query(`MATCH (existing:kanji {character: '${kanji}'}) RETURN ID(existing), existing.jlptLevel`)
      if (existing.length === 0) {
        // create if not exist
        return graph.query(`MERGE (:kanji {character: '${kanji}', jlptLevel: '${word.jlptLevel}'})`)
      } else {
        // if it exists, make sure we have the minimum jlpt level (meaning the largest number)
        if (existing[0]['existing.jlptLevel'] < word.jlptLevel && word.jlptLevel.length) {
          return graph.query(`MATCH (existing:kanji {character: '${kanji}'}) SET existing.jlptLevel = '${word.jlptLevel}'`)
        }
      }
    }))

    let whereClause = kanji.map(k => {
      return `k.character = '${k}'`
    }).join(' OR ')
    whereClause = `(${whereClause}) AND w.kanji = '${word.kanji}'`

    // create the node for this word
    await graph.query(`CREATE (:word {kanji: '${word.kanji}', pronunciation: '${word.pronunciation.join(',')}', meaning: '${word.meaning}', jlptLevel: '${word.jlptLevel}'})`)
    // create relationships with kaji in this word
    let ex = await graph.query(`MATCH (k:kanji), (w:word) WHERE ${whereClause} CREATE (w)-[:writtenWith]->(k)`)
    console.log(`kanji: ${word.kanji}, num kanji in word: ${kanji.length} relationships created ${ex.meta.relationshipsCreated}`)
  }

  return async (word) => {
    return addWordFunc(word).catch((e) => {
      throw new Error(`Failed to add word to graph. word: ${JSON.stringify(word)} error: ${e.message}`)
    })
  }
}

function getNonKanaKanji (string) {
  if (!string || !string.length) {
    return []
  }
  return string.split('').filter(char => {
    return /[\u3400-\u4DB5\u4E00-\u9FCB\uF900-\uFA6A]/.test(char) // from https://stackoverflow.com/a/53807563/375688
  })
}

module.exports = addWordFunctionFactory
