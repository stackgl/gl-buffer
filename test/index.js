var createBuffer = require('../')
var test         = require('tape')

var data = {
  basic: [0, 1, 2, 3, 4, 5]
}

var gl = getContext()
function getContext() {
  var canvas = document.body.appendChild(document.createElement('canvas'))
  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
  return gl
}


test('buffer.handle', function(t) {
  var buffer = createBuffer(gl, data.basic)
  t.ok(buffer.handle instanceof WebGLBuffer, 'buffer.handle is a WebGLBuffer instance')
  t.end()
})

test('buffer.gl', function(t) {
  var buffer = createBuffer(gl, data.basic)
  t.equal(gl, buffer.gl, 'buffer.gl === gl')
  t.end()
})

test('buffer(): accepts Float32Arrays', function(t) {
  t.plan(1)
  t.doesNotThrow(function() {
    createBuffer(gl, new Float32Array(data.basic))
  }, 'does not throw on creation')
})

test('buffer(): checks for a valid type', function(t) {
  t.plan(4)

  t.throws(function() {
    createBuffer(gl, data.basic, -10)
  }, 'throws on creation when type is invalid')

  t.doesNotThrow(function() {
    createBuffer(gl, data.basic, gl.ARRAY_BUFFER)
  }, 'does now throw for gl.ARRAY_BUFFER')

  t.doesNotThrow(function() {
    createBuffer(gl, data.basic, gl.ELEMENT_ARRAY_BUFFER)
  }, 'does now throw for gl.ELEMENT_ARRAY_BUFFER')

  t.doesNotThrow(function() {
    createBuffer(gl, data.basic, null)
  }, 'passing null is acceptable')
})

test('buffer(): checks for a valid usage', function(t) {
  t.plan(5)

  t.throws(function() {
    createBuffer(gl, data.basic, null, -10)
  }, 'throws on creation when usage is invalid')

  t.doesNotThrow(function() {
    createBuffer(gl, data.basic, null, gl.DYNAMIC_DRAW)
  }, 'does now throw for gl.DYNAMIC_DRAW')

  t.doesNotThrow(function() {
    createBuffer(gl, data.basic, null, gl.STATIC_DRAW)
  }, 'does now throw for gl.STATIC_DRAW')

  t.doesNotThrow(function() {
    createBuffer(gl, data.basic, null, gl.STREAM_DRAW)
  }, 'does now throw for gl.STREAM_DRAW')

  t.doesNotThrow(function() {
    createBuffer(gl, data.basic, null, null)
  }, 'null is acceptable')
})

test('buffer(): handles being created without data', function(t) {
  var buffer = createBuffer(gl)
  t.ok(buffer.handle)
  t.end()
})

test('buffer.length', function(t) {
  var ui8a = new Uint8Array(data.basic)
  var f32a = new Float32Array(data.basic)
  var buffer

  buffer = createBuffer(gl, data.basic)
  t.equal(buffer.length, data.basic.length * 4, 'vanilla arrays: correct byte length')

  buffer = createBuffer(gl, f32a)
  t.equal(buffer.length, f32a.byteLength, 'Float32Arrays: correct byte length')

  buffer = createBuffer(gl, ui8a)
  t.equal(buffer.length, ui8a.byteLength, 'Uint8Arrays: correct byte length')

  t.end()
})

test('buffer.bind()', function(t) {
  var buffer = createBuffer(gl, data.basic)

  t.ok(gl.getParameter(gl.ARRAY_BUFFER_BINDING) === buffer.handle
    , 'initially will be bound on creation')

  buffer.unbind()
  t.ok(gl.getParameter(gl.ARRAY_BUFFER_BINDING) === null
    , '.unbind() will bind to null')

  buffer.bind()
  t.ok(gl.getParameter(gl.ARRAY_BUFFER_BINDING) === buffer.handle
    , 'bind() will bind to gl.ARRAY_BUFFER by default')

  // TODO: test ELEMENT_ARRAY_BUFFER_BINDING, which I haven't been
  // able to get working properly yet.
  t.end()
})

test('shutdown', function(t) {
  t.end()
  setTimeout(function() {
    window.close()
  })
})
