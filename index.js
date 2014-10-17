var pull = require('pull-stream')
var splitter = require('pull-split')

module.exports = function (ps, _JSON, opts) {
  _JSON = _JSON || JSON
  opts = opts || {}
  return {
    sink: pull(
      splitter(),
      pull.map(function(data) {
        try { return _JSON.parse(data) }
        catch (e) {
          if (!opts.ignoreErrors)
            return e
        }
      }),
      pull.filter(),
      ps.sink
    ),
    source: pull(
      ps.source,
      pull.map(function(data) {
        if (data !== void 0)
          return _JSON.stringify(data) + '\n'
      })
    )
  }
}