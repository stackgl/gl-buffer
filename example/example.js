var shell = require("gl-now")()
var glslify = require("glslify")
var createBuffer = require("../buffer.js")

var createShader = glslify({
  vertex: "\
    attribute vec2 position;\
    varying vec2 uv;\
    void main() {\
      gl_Position = vec4(position, 0.0, 1.0);\
      uv = position.xy;\
    }",
  fragment: "\
    precision highp float;\
    uniform float tick;\
    varying vec2 uv;\
    void main() {\
      gl_FragColor = vec4(0.5*(uv+1.0), 0.5*(cos(tick)+1.0), 1.0);\
    }",
  inline: true
})

var buffer, shader

shell.on("gl-init", function() {
  var gl = shell.gl

  //Create buffer
  buffer = createBuffer(gl, [-1, 0, 0,-1, 1, 1])
  
  //Create shader
  shader = createShader(gl)
  shader.attributes.position.location = 0
})

shell.on("gl-render", function(t) {
  var gl = shell.gl
  shader.bind()
  buffer.bind()
  shader.attributes.position.pointer()
  shader.uniforms.tick = Date.now() / 1000.0
  gl.drawArrays(gl.TRIANGLES, 0, 3)
})