let through = require('through2-concurrent').obj
let fs = require('fs')

let RedisGraph = require('ioredisgraph')
let words = require('../data-gathering/parse-raw.js')
let graph = new RedisGraph('kanji')
let addWordToGraph = require('./add-word.js')(graph)

async function populateDb () {
  // delete graph if it exists
  try {
    await graph.delete()
  } catch {}
  // make graph exist
  await graph.query(`CREATE (:genesis)`)

  let add = through(async (chunk, enc, callback) => {
    await addWordToGraph(chunk)
    callback()
  })

  let sink = fs.createWriteStream('/dev/null')

  let added = words.pipe(add)
  added.on('end', () => graph.quit())
  added.pipe(sink)
}

populateDb()
