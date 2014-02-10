var shell = require("gl-now")()
var createShader = require("gl-shader")
var createBuffer = require("../buffer.js")

var buffer, shader

shell.on("gl-init", function() {
  var gl = shell.gl

  //Create shader
  shader = createShader(gl,
    "attribute vec2 position;\
    varying vec2 uv;\
    void main() {\
      gl_Position = vec4(position, 0.0, 1.0);\
      uv = position.xy;\
    }",
    "precision highp float;\
    uniform vec2 tp;\
    varying vec2 uv;\
    void main() {\
      gl_FragColor = vec4(0.5*(uv+1.0), 0.5*(cos(tp.x)+1.0), 1.0);\
    }")

  
  //Create buffer
  buffer = createBuffer(gl, [-1, 0, 0,-1, 1, 1])
  
  //Set up attributes
  shader.bind()
  buffer.bind()
  shader.attributes.position.pointer()
  shader.attributes.position.enable()
})

shell.on("gl-render", function(t) {
  shell.gl.drawArrays(shell.gl.TRIANGLES, 0, 3)
})