// parses one of the lines from N.-vocab.txt
// lines seem to be of form: kanjiSpelling( / kanjiSpelling)*,? hiraganaOrKatakanaSpelling( / hiraganaOrKatakanaSpelling)* -meaning(,meaning)*
// ex
// 歯, は -tooth
// パーティー -party
// 初め / 始め, はじめ -beginning
// 毎月, まいげつ / まいつき -every month


// when there are multiple kanji spellings, let's split into multiple words
// so expect getting back an array of results I guess.

module.exports = (definition) => {

  let [all, _, kanjis, pronunciation, meaning] = definition.match(/((.*),)?(.*) -(.*)/)

  if (!kanjis) {
    kanjis = ''
  }

  // for multiple kanji separated by `/`, return multiple parsed words
  return kanjis.split('/')
              .map(s => s.trim())
              .map(kanji => {
                return {
                  kanji: kanji.length? kanji : null,
                  pronunciation: pronunciation.split('/').map(s => s.trim()),
                  meaning: meaning
                }
              })
}
