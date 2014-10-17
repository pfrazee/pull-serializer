# pull-serializer

Serializes and parses pull-streams, eg for sending over a channel.

Takes a duplex pull-stream and returns a wrapped version which will emit/consume the serialized format. The second parameter optionally takes an object with `{stringify: Function, parse: Function}` defined (the `JSON` signature).

```js
var serializer = require('pull-serializer')

var theduplex = serializer({
  source: pull.values([5, "foo", [1,2,3], {hello: 'world'}]),
  sink: pull.collect(console.log) // => false [5, "foo", [1,2,3], {hello: 'world'}]
})

pull(
  theduplex,
  pull.map(function(chunk) {
    assert(typeof chunk == 'string')
    return chunk
  }),
  theduplex
)
```