// boy I sure love streams
let fs = require('fs')
let path = require('path')
let merge = require('merge2')
let split = require('split2')
let through = require('through2-concurrent').obj

let print = through((chunk, enc, callback) => {
  console.log(chunk)
  callback()
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

let files = [
  'N1-vocab.txt',
  'N2-vocab.txt',
  'N3-vocab.txt',
  'N4-vocab.txt',
  'N5-vocab.txt'
]
files = files.map(name => path.resolve(__dirname, 'raw', name))

fileStreams = files.map(filename => {
  return fs.createReadStream(filename, 'utf8')
        .pipe(split())
})

rawLines = merge(fileStreams)

rawLines.pipe(meter).pipe(sink)
