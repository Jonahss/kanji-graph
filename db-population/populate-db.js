let RedisGraph = require('ioredisgraph')
let words = require('../data-gathering/parser.js')
let graph = new RedisGraph('kanji')
let addWordToGraph = require('./add-word.js')(graph)

words.on('data', addWordToGraph)
