"use strict"

var pool = require("typedarray-pool")
var ops = require("ndarray-ops")
var ndarray = require("ndarray")

function GLBuffer(gl, type, handle, length, usage) {
  this.gl = gl
  this.type = type
  this.handle = handle
  this.length = length
  this.usage = usage
}

GLBuffer.prototype.bind = function() {
  this.gl.bindBuffer(this.type, this.handle)
}

GLBuffer.prototype.dispose = function() {
  this.gl.deleteBuffer(this.handle)
}

function updateTypeArray(gl, type, len, usage, data, offset) {
  if(offset <= 0 && data.length > len) {
    gl.bufferData(type, data, usage)
    return data.length
  }
  if(data.length + offset > len) {
    throw new Error("gl-buffer: If resizing buffer, offset must be 0")
  }
  gl.bufferSubData(type, offset, data)
  return len
}

function makeScratchTypeArray(array, dtype) {
  var res = pool.malloc(array.length, dtype)
  var n = array.length
  for(var i=0; i<n; ++i) {
    res[i] = array[i]
  }
  return res
}

GLBuffer.prototype.update = function(array, offset) {
  if(!offset) {
    offset = 0
  }
  this.bind()
  if(typeof array === "number") {
    if(offset > 0) {
      throw new Error("gl-buffer: Cannot specify offset when resizing buffer")
    }
    this.gl.bufferData(this.type, array, this.usage)
    this.length = array
  } else if(array.shape) {
    var dtype = array.dtype
    if(dtype === "float64" || dtype === "array" || dtype === "generic") {
      dtype = "float32"
    }
    if(this.type === this.gl.ELEMENT_ARRAY_BUFFER) {
      dtype = "uint16"
    }
    if(array.shape.length !== 1) {
      throw new Error("gl-buffer: Array length must be 1")
    }
    if(dtype === array.dtype && array.stride[0] === 1) {
      if(array.offset === 0 && array.data.length === array.shape[0]) {
        this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, array.data, offset)
      } else {
        this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, array.data.subarray(array.offset, array.shape[0]), offset)
      }
    } else {
      var tmp = pool.malloc(array.shape[0], dtype)
      var ndt = ndarray(tmp)
      ops.assign(ndt, array)
      this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, tmp, offset)
      pool.free(tmp)
    }
  } else if(Array.isArray(array)) {
    if(this.type === this.gl.ELEMENT_ARRAY_BUFFER) {
      var t = makeScratchTypeArray(array, "uint16")
      this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, t.subarray(0, array.length), offset)
      pool.freeUint16(t)
    } else {
      var t = makeScratchTypeArray(array, "float32")
      this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, t.subarray(0, array.length), offset)
      pool.freeFloat32(t)
    }
  } else {
    this.length = updateTypeArray(this.gl, this.type, this.length, this.usage, array, offset)
  }
}

GLBuffer.prototype.draw = function(mode, count, offset) {
  offset = offset || 0
  var gl = this.gl
  if(this.type === gl.ARRAY_BUFFER) {
    gl.drawArrays(mode, offset, count)
  } else if(this.type === gl.ELEMENT_ARRAY_BUFFER) {
    this.bind()
    gl.drawElements(mode, count, gl.UNSIGNED_SHORT, offset)
  } else {
    throw new Error("Invalid type for WebGL buffer")
  }
}

function createBuffer(gl, type, data, usage) {
  if(data === undefined) {
    data = type
    type = gl.ARRAY_BUFFER
  }
  if(!usage) {
    usage = gl.DYNAMIC_DRAW
  }
  var len = 0
  var handle = gl.createBuffer()
  gl.bindBuffer(type, handle)
  if(typeof data === "number") {
    gl.bufferData(type, data, usage)
    len = data
  } else if(data instanceof Array) {
    if(type === gl.ELEMENT_ARRAY_BUFFER) {
      gl.bufferData(type, new Uint16Array(data), usage)
    } else {
      gl.bufferData(type, new Float32Array(data), usage)
    }
    len = data.length
  } else if(data.length) {
    gl.bufferData(type, data, usage)
    len = data.length
  } else if(data.shape) {
    var dtype = data.dtype
    if(dtype === "float64" || dtype === "array" || dtype === "generic") {
      dtype = "float32"
    }
    if(type === gl.ELEMENT_ARRAY_BUFFER) {
      dtype = "uint16"
    }
    if(data.shape.length !== 1) {
      throw new Error("gl-buffer: Array shape must be 1D")
    }
    var len = data.shape[0]
    if(dtype === data.type && data.stride[0] === 1) {
      gl.bufferData(type, data.data.subarray(data.offset, data.offset+len), usage)
    } else {
      var tmp = pool.malloc(data.shape[0], dtype)
      var ndt = ndarray(tmp)
      ops.assign(ndt, data)
      gl.bufferData(type, tmp, usage)
      pool.free(tmp)
    }
  } else {
    throw new Error("gl-buffer: Invalid format for buffer data")
  }
  if(type !== gl.ARRAY_BUFFER && type !== gl.ELEMENT_ARRAY_BUFFER) {
    throw new Error("gl-buffer: Invalid type for webgl buffer")
  }
  if(usage !== gl.DYNAMIC_DRAW && usage !== gl.STATIC_DRAW && usage !== gl.STREAM_DRAW) {
    throw new Error("gl-buffer: Invalid usage for buffer")
  }
  return new GLBuffer(gl, type, handle, len, usage)
}

module.exports = createBuffer