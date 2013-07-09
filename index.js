
/*!
 * PrettyMIDI
 * https://github.com/nick-thompson/prettymidi
 *
 * Copyright (c) 2012 Nick Thompson
 * MIT License
 */

module.exports = {
  Controller: require('./lib/controller'),
  Decoder: require('./lib/decoder'),
  readDevices: readDevices
};

/**
 * Return valid devices from the Web MIDI API.
 *
 * @param {object} access MidiAccess object.
 * @api public
 */

function readDevices (access) {
  var inputs = access.getInputs()
    , outputs = access.getOutputs()
    , devices = {};

  devices.inputs = inputs.map(function (input, index) {
    input.port = index;
    return input;
  });

  devices.outputs = outputs.map(function (output, index) {
    output.port = index;
    return output;
  });

  return devices;
};

