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

    await Promise.all(word.kanji.split('').map(kanji => {
      return graph.query(`MERGE (:kanji {character: '${kanji}'})`)
    }))
  }
}

module.exports = addWordFunctionFactory
