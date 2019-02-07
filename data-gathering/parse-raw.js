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

let errorStream = through((chunk, enc, callback) => {
  callback(null, chunk)
})

let parse = through((chunk, enc, callback) => {
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
files = ['sample.txt']

files = files.map(name => path.resolve(__dirname, 'raw', name))

fileStreams = files.map(filename => {
  return fs.createReadStream(filename, 'utf8')
        .pipe(split())
})

rawLines = merge(fileStreams)

let words = rawLines.pipe(parse)

module.exports = words
// words.on('finish', () => {
//   console.log('parsing finished')
//   errorStream.pipe(jsonify).pipe(errPrint)
// })
