var pull = require('pull-stream')
var splitter = require('pull-split')

module.exports = function (ps, _JSON) {
  _JSON = _JSON || JSON
  return {
    sink: pull(splitter(), function(read) {
      return ps.sink(function(abort, cb) {
        read(abort, function(ended, data) {
          if (ended) return cb(ended)
          if (typeof data == 'string' && data)
            data = _JSON.parse(data)
          cb(ended, data)
        })
      })
    }),
    source: function(abort, cb) {
      return ps.source(abort, function(ended, data) {
        if (ended) return cb(ended)
        if (data !== void 0)
          data = _JSON.stringify(data) + '\n'
        cb(ended, data)
      })
    }
  }
}