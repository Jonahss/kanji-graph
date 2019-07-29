// boy I sure love streams
let fs = require('fs')
let path = require('path')
let merge = require('merge2')
let split = require('split2')
let through = require('through2-concurrent').obj
let parser = require('./parser.js')

let print = through((chunk, enc, callback) => {
  console.log(chunk)
  callback()
})

let errPrint = through((chunk, enc, callback) => {
  console.error(chunk)
  callback()
})

let jsonify = through((chunk, enc, callback) => {
  callback(null, JSON.stringify(chunk))
})

let meter = through(function (chunk, enc, callback) {
  if (!this.count) {
    this.count = 1
  } else {
    this.count++
  }
  console.log(this.count)
  callback(null, chunk)
})

let sink = fs.createWriteStream('/dev/null')

let annotateStream = (key, val) => {
  return through((chunk, enc, callback) => {
    chunk[key] = val
    callback(null, chunk)
  })
}

let errorStream = through((chunk, enc, callback) => {
  callback(null, chunk)
})

// warn of a duplicate chunk passing through this stream
// keyFunc is called with the chunk, return unique key to check duplication
let noDuplicate = (keyFunc) => {
  keys = {}
  let noDupStream = through((chunk, enc, callback) => {
    let key = keyFunc(chunk)
    if (keys[key]) {
      return callback(new Error(`Duplicate with key ${key} in stream`))
    }
    keys[key] = true
    callback(null, chunk)
  })
  return noDupStream
}

let parse = () => through((chunk, enc, callback) => {
  let words
  try {
    words = parser(chunk)
  } catch (e) {
    errorStream.push({
      word: chunk,
      error: e.message
    })
    return callback()
  }
  for (word of words) {
    callback(null, word)
  }
})

let files = [
  'N1-vocab.txt',
  'N2-vocab.txt',
  'N3-vocab.txt',
  'N4-vocab.txt',
  'N5-vocab.txt'
]
// for testing
//files = ['sample.txt']

files = files.map(name => path.resolve(__dirname, 'raw', name))

fileStreams = files.map(filename => {
  return fs.createReadStream(filename, 'utf8')
           .pipe(split())
           .pipe(parse())
           .pipe(annotateStream('jlptLevel', filename.slice(-12, -10)))
           .pipe(noDuplicate((word) => word.kanji + '#' + word.pronunciation))
})

let words = merge(fileStreams)

module.exports = words
// words.on('finish', () => {
//   console.log('parsing finished')
//   errorStream.pipe(jsonify).pipe(errPrint)
// })
