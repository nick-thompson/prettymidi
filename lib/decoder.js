
var map = require('./map');

/**
 * Decoder constructor.
 *
 * @api public
 */

function Decoder () {}

// Expose constructor
module.exports = Decoder;

/**
 * Decode a MIDI file buffer.
 *
 * @param {ArrayBuffer} buffer
 * @api private
 */

Decoder.prototype.decode = function (buffer) {
  this.buffer = new DataView(buffer);

  var invalidHeader = false
        || (this.buffer.getUint8(0)  !== 0x4d)
        || (this.buffer.getUint8(1)  !== 0x54)
        || (this.buffer.getUint8(2)  !== 0x68)
        || (this.buffer.getUint8(3)  !== 0x64)
        || (this.buffer.getUint32(4) !== 0x06)

    , format = this.buffer.getUint16(8)
    , nTracks = this.buffer.getUint16(10)
    , ticksPerBeat = this.buffer.getUint16(12)

  if (invalidHeader) {
    throw new Error("malformed file header");
  }

  if (format !== 1) {
    throw new Error("Only MIDI file format type 1 is supported.");
  }

  this.data = {
      format: format
    , nTracks: nTracks
    , ticksPerBeat: ticksPerBeat
    , tracks: []
  };

  this.pointer = 14;

  while (--nTracks) {
    this.decodeTrack();
  }

  return this.data;

};

/**
 * Decode the next buffer segment as a new track.
 *
 * @api private
 */

Decoder.prototype.decodeTrack = function () {
  var invalidHeader = false
        || (this.buffer.getUint8(this.pointer++) !== 0x4d)
        || (this.buffer.getUint8(this.pointer++) !== 0x54)
        || (this.buffer.getUint8(this.pointer++) !== 0x72)
        || (this.buffer.getUint8(this.pointer++) !== 0x6b)

    , byteLength = this.buffer.getUint32(this.pointer)
    , end = this.pointer + byteLength + 4
    , track = {
        byteLength: byteLength
      , events: []
    };

  if (invalidHeader) {
    throw new Error("Malformed track header.");
  }

  this.pointer += 4;
  while (this.pointer < end) {
    track.events.push(this.decodeTrackEvent());
  }

  this.data.tracks.push(track);

};

/**
 * Decode next track event.
 *
 * @api private
 */

Decoder.prototype.decodeTrackEvent = function () {
  var deltaTime = this.decodeVarInt()
    , type = this.buffer.getUint8(this.pointer)
    , evt;

  switch (type) {
    case 0xff:
      // Currently ignoring Meta events
      this.pointer += 2;
      this.decodeVarInt();
      evt = {};
      break;
    case 0xf0:
    case 0xf7:
      // Currently ignoring Sysex events
      do {} while (this.buffer.getUint8(this.pointer++) !== 0xf7);
      evt = {};
      break;
    default:
      if (type & 0x80) {
        evt = this.decodeMidiEvent();
      } else {
        evt = this.decodeRunningMidiEvent();
      }
      break;
  }

  evt.deltaTime = deltaTime;
  return evt;

};

/**
 * Decode a variable length integer from the file buffer.
 *
 * @api private
 */

Decoder.prototype.decodeVarInt = function () {
  var value = 0
    , nextByte;

  do {
    nextByte = this.buffer.getUint8(this.pointer++);
    value = value << 7;
    value += (nextByte & 0x7f);
  } while (nextByte > 0x80);

  return value;

};

/**
 * Decode a MIDI channel event from the file buffer.
 *
 * @api private
 */

Decoder.prototype.decodeMidiEvent = function () {
  var tmp = this.buffer.getUint8(this.pointer++)
    , type = (tmp & 0xf0) >> 4
    , channel = (tmp & 0x0f)
    , evt = {
          type: map[type].type
        , channel: channel
      };

  map[type].params.forEach(function (param) {
    evt[param] = this.buffer.getUint8(this.pointer++);
  }.bind(this));

  this.lastEvent = {
      type: type
    , channel: channel
  };

  return evt;

};

/**
 * Decode a running mode MIDI Channel event from the file buffer.
 *
 * @api private
 */

Decoder.prototype.decodeRunningMidiEvent = function () {
  var evt = {
      type: this.lastEvent.type
    , channel: this.lastEvent.channel
  };

  map[evt.type].params.forEach(function (param) {
    evt[param] = this.buffer.getUint8(this.pointer++);
  }.bind(this));

  return evt;

};

