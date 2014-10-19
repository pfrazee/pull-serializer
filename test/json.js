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
          if (ended) return cb(ended)

          if (data.charAt(0) == '{') // the last object?
            return cb(null, last + data) // go ahead and finish

          // emit half, and save the rest for next time
          var i = Math.floor(data.length / 2)
          cb(null, last + data.slice(0, i))
          last = data.slice(i)
        })
      }
    })(),
    theDuplex
  )
})

tape('parse errors', function (t) {
  var theDuplex = serializer({
    source: pull.values(['test']),
    sink: pull.collect(function(err, values) {
      console.log(err, values)
      t.equal(!!err, true)
      t.equal(values.length, 0)
      t.end()
    })
  })
  
  pull(
    theDuplex,
    pull.Through(function (read) {
      // screw up the data
      return function (abort, cb) {
        read(abort, function (ended, data) {
          if (ended) return cb(ended)
          cb(null, '"bad json')
        })
      }
    })(),
    theDuplex
  )
})

tape('error suppression', function (t) {
  var theDuplex = serializer({
    source: pull.values(['fail', 'success']),
    sink: pull.collect(function(err, values) {
      console.log(values)
      if (err) throw err
      t.equal(values[0], 'success')
      t.end()
    })
  }, undefined, {ignoreErrors: true})

  pull(
    theDuplex,
    pull.Through(function (read) {
      // screw up the fail message
      return function (abort, cb) {
        read(abort, function (ended, data) {
          if (ended) return cb(ended)
          if (data == '"fail"\n') return cb(null, '"bad json\n')
          cb(null, data)
        })
      }
    })(),
    theDuplex
  )
})
