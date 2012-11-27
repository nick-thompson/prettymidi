/*
 * PrettyMIDI
 * https://github.com/nick/prettymidi
 *
 * Copyright (c) 2012 Nick Thompson
 * MIT License
 */

var utils   = require("./utils")
  , fs      = require("fs")
  , path    = require("path")
  , doT     = require("dot")
  , exists  = fs.existsSync;

/**
 * Entry point. Load a file and engage decoder.
 *
 * @param {Array} files
 */

exports.load = function (file, options) {
  fs.readFile(path.resolve(file), function (err, data) {
    if (err) { throw err; }
    var name = path.basename(file, ".mid");
    exports.save(name, exports.decode(data), options.json);
  });
};

/**
 * Export data to javascript files
 *
 * @param {String} name : file name
 * @param {Object} data : decoded midi data
 * @param {Boolean} json : write plain json to file
 */

var template = doT.template([
    "(function (context, definition) {",
    "  if (typeof module !== \"undefined\" && module.exports) {",
    "    module.exports = definition(context);",
    "  } else if (typeof define === \"function\" && define.amd) {",
    "    define(definition);",
    "  } else {",
    "    context[{{= it.name }}] = definition(context);",
    "  }",
    "})(this, function () {",
    "  return {{= it.data }};",
    "});"
  ].join("\n"));

exports.save = function (name, data, json) {
  var out = json
        ? JSON.stringify(data)
        : template({ name: name, data: JSON.stringify(data) })
    , file = json
        ? "prettymidifiles/" + name + ".json"
        : "prettymidifiles/" + name + ".js";

  if (!exists("prettymidifiles")) { 
    fs.mkdirSync("prettymidifiles"); 
  }
  fs.writeFile(file, out, function (err) {
    if (err) { throw err; }
    utils.log(file + " written.");
  });
};

/**
 * Decode a MIDI file buffer
 *
 * @param {Buffer} buffer
 */

exports.decode = function (buffer) {
  var data = new DataView(buffer)
    , index = 0
    , invalidHeader = false
        || (data.getUint8(0) !== 0x4d) 
        || (data.getUint8(1) !== 0x54) 
        || (data.getUint8(2) !== 0x68) 
        || (data.getUint8(3) !== 0x64)
        || (data.getUint32(4) !== 6)

    , format = data.getUint16(8)
    , nTracks = data.getUint16(10)
    , ticksPerBeat = data.getUint16(12);

  if (invalidHeader) {
    utils.error("malformed file header");
    process.exit();
  }

  if (format !== 1) {
    utils.error("Only MIDI file format type 1 is supported.");
    process.exit();
  }

  return {
      format: format
    , nTracks: nTracks
    , ticksPerBeat: ticksPerBeat
    , tracks: (function () {
        var tracks = []
          , index = 14;
        for (var i = 0; i < nTracks; i++) {
          index = decodeTrack(data, tracks, index);
          if (index === -1) {
            utils.error("error reading track #" + i);
          }
        }
        return tracks;
      })()
  };

};

/**
 * Helper method for decoding a single track.
 *
 * @param {DataView} data : midi data
 * @param {Array} tracks
 * @param {int} offset : offset pointer into the midi data
 */

var decodeTrack = function (data, tracks, offset) {
  var invalidHeader = false 
        || (data.getUint8(offset++) !== 0x4d) 
        || (data.getUint8(offset++) !== 0x54)
        || (data.getUint8(offset++) !== 0x72) 
        || (data.getUint8(offset++) !== 0x6b)

    , byteLength = data.getUint32(offset)
    , end = offset + byteLength + 4
    , track = {
        byteLength: byteLength
      , events: []
    };

  if (invalidHeader) {
    utils.error("malformed track header");
    return -1;
  }

  offset += 4;
  while (offset < end) {
    offset = decodeTrackEvent(data, track, offset);
    if (offset === -1) {
      utils.error("error decoding track event");
      return -1;
    }
  }

  tracks.push(track);
  return offset;
};

/**
 * Helper method for decoding a specific event within a track
 *
 * @param {DataView} data : midi data
 * @param {object} track
 * @param {int} offset
 */

var decodeTrackEvent = function (data, track, offset) {
  var nEvents = track.events.length
    , tmp = decodeVariableLengthValue(data, offset)
    , type = data.getUint8(offset = tmp.offset)
    , evt = {
        deltaTime: tmp.value
    };

  offset = (type === 0xff)
    ? ignoreMetaEvent(data, offset)
    : (type === 0xf0 || type === 0xf7)
      ? ignoreSysexEvent(data, offset)
      : (type & 0x80)
        ? decodeMIDIEvent(data, offset, evt)
        : (lastEventoffset > 0)
          ? decodeRunningModeMIDIEvent(data, offset, evt, track.events[nEvents - 1])
          : -1;

  if (offset === -1) {
    utils.error("running mode event with no previous event");
    return offset;
  }

  track.events.push(evt);
  return offset;
};

/**
 * Find the end of a variable length value, update the pointer
 * and return the value.
 *
 * @param {DataView} data
 * @param {int} offset
 */

var decodeVariableLengthValue = function (data, offset) {
  var value = 0
    , nextByte;

  do {
    nextByte = data.getUint8(offset++);
    value = value << 7;
    value += (nextByte & 0x7f);
  } while (nextByte > 0x80);

  return {
      offset: offset
    , value: value
  };
}

/**
 * Update the pointer to account for a Meta event,
 * but don't actually parse the event.
 *
 * @param {DataView} data
 * @param {int} offset
 */

var ignoreMetaEvent = function (data, offset) {
  var tmp = decodeVariableLengthValue(data, offset + 2);
  return tmp.offset + tmp.value;
};

/**
 * Update the pointer to account for a Sysex event,
 * but don't actually parse the event.
 *
 * @param {DataView} data
 * @param {int} offset
 */

var ignoreSysexEvent = function (data, offset) {
  do {} while (data.getUint8(offset++) !== 0xf7);
  return offset;
};

function decodeMIDIEvent( data, idx, trackEvent ) {
  var eventType = data.getUint8(idx++);

  trackEvent.type = "MIDI";

  trackEvent.midiEventType = (eventType & 0xf0)>>4;
  trackEvent.midiChannel = eventType & 0x0f;

  trackEvent.parameter1 = data.getUint8(idx++);

  // program change and channel aftertouch don't have a param2
  if ((trackEvent.midiEventType != 0x0c)&&(trackEvent.midiEventType != 0x0d))
    trackEvent.parameter2 = data.getUint8(idx++);

  return (idx);
}

function decodeRunningModeMIDIEvent( data, idx, trackEvent, lastEvent ) {
  trackEvent.type = "MIDI";
  trackEvent.midiEventType = lastEvent.midiEventType;
  trackEvent.midiChannel = lastEvent.midiChannel;

  trackEvent.parameter1 = data.getUint8(idx++);

  // program change and channel aftertouch don't have a param2
  if ((trackEvent.midiEventType != 0x0c)&&(trackEvent.midiEventType != 0x0d))
    trackEvent.parameter2 = data.getUint8(idx++);

  return (idx);
}
