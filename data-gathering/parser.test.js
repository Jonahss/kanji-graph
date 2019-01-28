let test = require('ava')

let parse = require('./parser.js')

test('歯, は -tooth', t => {
  let expect = [
    {
      kanji: '歯',
      pronunciation: [
        'は'
      ],
      meaning: 'tooth'
    }
  ]

  t.deepEqual(parse('歯, は -tooth'), expect)
})

test('パーティー -party', t => {
  let expect = [
    {
      kanji: null,
      pronunciation: [
        'パーティー'
      ],
      meaning: 'party'
    }
  ]

  t.deepEqual(parse('パーティー -party'), expect)
})

test('初め / 始め, はじめ -beginning', t => {
  let expect = [
    {
      kanji: '初め',
      pronunciation: [
        'はじめ'
      ],
      meaning: 'beginning'
    },
    {
      kanji: '始め',
      pronunciation: [
        'はじめ'
      ],
      meaning: 'beginning'
    }
  ]

  t.deepEqual(parse('初め / 始め, はじめ -beginning'), expect)
})

test('毎月, まいげつ / まいつき -every month', t => {
  let expect = [
    {
      kanji: '毎月',
      pronunciation: [
        'まいげつ',
        'まいつき'
      ],
      meaning: 'every month'
    }
  ]

  t.deepEqual(parse('毎月, まいげつ / まいつき -every month'), expect)
})
