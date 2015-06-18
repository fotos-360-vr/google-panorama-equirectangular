var getTiles = require('./lib/image-tiles')
var loader = require('async-image-loader')
var Emitter = require('events').EventEmitter

module.exports = loadEquirectangular
function loadEquirectangular (id, opt) {
  opt = opt || {}
  var zoom = (typeof opt.zoom === 'number' ? opt.zoom : 1) | 0 // integer value
  if (zoom < 0 || zoom > 5) {
    throw new Error('zoom is out of range, must be between 0 - 5 (inclusive)')
  }
  var data = getTiles(id, zoom, opt.tiles)

  var canvas = opt.canvas || document.createElement('canvas')
  var context = canvas.getContext('2d')
  var canvasWidth = data.width
  var canvasHeight = data.height

  // failed tiles will be transparent
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  context.clearRect(0, 0, canvasWidth, canvasHeight)

  var emitter = new Emitter()
  var images = data.images
  var zero = [0, 0]

  process.nextTick(start)
  return emitter

  function done () {
    emitter.emit('complete', canvas)
  }

  function start () {
    emitter.emit('start', data)
    loader(images, { crossOrigin: opt.crossOrigin }, done)
      .on('not-found', function (tile) {
        emitter.emit('not-found', tile)
      })
      .on('progress', function (ev) {
        var tile = ev.tile
        var position = tile.position || zero
        if (ev.image) {
          context.drawImage(ev.image, position[0], position[1])
        }
        emitter.emit('progress', {
          count: ev.count,
          total: ev.total,
          image: ev.image,
          position: position
        })
      })
  }
}
