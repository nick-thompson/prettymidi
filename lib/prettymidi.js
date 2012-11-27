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
 * Step entry point. Load a file and engage decoder.
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
    , type = data.getUint8(offset = tmp.idx)
    , evt = {
        deltaTime: tmp.result
    };

  offset = (type === 0xff)
    ? decodeMetaEvent(data, offset, track, evt)
    : (type === 0xf0 || type === 0xf7)
      ? decodeSysexEvent(data, offset, track, evt)
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

function decodeVariableLengthValue(data, trackOffset ) {
  var i;
  var idx = trackOffset;
  var result = 0;

  do   {
    i = data.getUint8(idx++);
    result = result << 7;   // left-shift by 7 bits
    result += (i & 0x7f); // mask off the top bit
  } while (i>0x80);

  return {idx:idx,result:result};
}

function decodeMetaEvent( data, trackOffset, track, trackEvent ) {
  var idx = trackOffset + 1;  // we already know the first byte is 0xff
  var result;
  var length;
  var end;
  var metaData = [];

  trackEvent.type = "meta";

  trackEvent.metaType = data.getUint8(idx++);
  /*  Type  Event Type  Event
      0x00   Sequence number   
      0x01   Text event  
      0x02   Copyright notice  
      0x03   Sequence or track name  
      0x04   Instrument name   
      0x05   Lyric text  
      0x06   Marker text   
      0x07   Cue point
      0x20   MIDI channel prefix assignment
      0x2F   End of track
      0x51   Tempo setting
      0x54   SMPTE offset
      0x58   Time signature
      0x59   Key signature
      0x7F   Sequencer specific event */

  result = decodeVariableLengthValue( data, idx );
  idx = result.idx;
  length = result.result;
  end = idx + length;

  while (idx < end) {
    metaData.push(data.getUint8(idx++));
  }

  trackEvent.metaData = metaData;

  if (trackEvent.metaType == 0x03) {
    var str = "";
    var i;
    for (i=0; i<metaData.length; i++)
      str += String.fromCharCode( metaData[i]);
    track.trackName = str;
  }

  return idx;
}

function decodeSysexEvent( data, trackOffset, track, trackEvent ) {
  var idx = trackOffset;
  var metaData = [];
  var d;

  trackEvent.type = "sysex";
  metaData.push(data.getUint8(idx++));

  do {
    d = data.getUint8(idx++);
    metaData.push(d);
  } while (d!=0xf7);

  trackEvent.metaData = metaData;
  return idx;
}

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
