var tape = require('tape')
var pull = require('pull-stream')
var serializer = require('../')

tape('JSON', function (t) {

  var theDuplex = serializer({
    source: pull.values([5, "foo", [1,2,3], {hello: 'world'}]),
    sink: pull.collect(function(err, values) {
      console.log(values)
      if (err) throw err
      t.equal(values[0], 5)
      t.equal(values[1], "foo")
      t.equal(values[2].length, 3)
      t.equal(values[3].hello, 'world')
      t.end()
    })
  })

  pull(
    theDuplex,
    pull.map(function(str) {
      console.log(typeof str, str)
      t.assert(typeof str == 'string')
      return str
    }),
    theDuplex
  )
})

tape('chunky', function (t) {

  var theDuplex = serializer({
    source: pull.values([55, "foo", [1,2,3], {hello: 'world'}]),
    sink: pull.collect(function(err, values) {
      console.log(values)
      if (err) throw err
      t.equal(values[0], 55)
      t.equal(values[1], "foo")
      t.equal(values[2].length, 3)
      t.equal(values[3].hello, 'world')
      t.end()
    })
  })

  pull(
    theDuplex,
    pull.Through(function (read) {
      // split each string in half (chunkify it)
      var last = ''
      return function (abort, cb) {
        read(abort, function (ended, data) {
          if (ended) return cb(ended, last)

          if (data.charAt(0) == '{') // the last object?
            return cb(null, last + data) // go ahead and finish

          // emit half, and save the rest for next time
          var i = Math.floor(data.length / 2)
          cb(null, last + data.slice(0, i))
          last = data.slice(i)
        })
      }
    })(),
    pull.map(function(str) {
      console.log(typeof str, str)
      t.assert(typeof str == 'string')
      return str
    }),
    theDuplex
  )
})
