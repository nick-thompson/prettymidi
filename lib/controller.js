
var map = require('./map')
  , EventEmitter = require('events').EventEmitter;

/**
 * Controller constructor.
 *
 * @api public
 */

function Controller (access, port) {
  var that = this;
  this.input = access.getInput(port);
  this.input.onmidimessage = function (event) {
    var struct = map[(event.data[0] & 0xf0) >> 4]
      , message = {};

    message.type = struct.type;
    message.channel = event.data[0] & 0x0f;
    message.timestamp = event.receivedTime;
    struct.params.forEach(function (param, index) {
      message[param] = event.data[index + 1];
    });
    that.emit('message', message);
  };
}

// Inherit the event emitter prototype.
Controller.prototype = Object.create(EventEmitter.prototype);

// Expose constructor
module.exports = Controller;

