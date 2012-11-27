/*
 * Step
 * https://github.com/nick/step
 *
 * Copyright (c) 2012 Nick Thompson
 * MIT License
 */

var utils   = require("./utils")
  , fs      = require("fs")
  , exists  = fs.existsSync
  , path    = require("path")
  , doT     = require("dot");

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
        ? "stepfiles/" + name + ".json"
        : "stepfiles/" + name + ".js";

  if (!exists("stepfiles")) { 
    fs.mkdirSync("stepfiles"); 
  }
  fs.writeFile(file, out, function (err) {
    if (err) { throw err; }
    utils.log(file + " written.");
  });
};

/**
 * Decode a MIDI file buffer
 *
 * Derived from Chris Wilson's Standard-MIDI-File-Reader
 * https://github.com/cwilso/Standard-MIDI-File-reader
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
        var tracks = new Array(nTracks)
          , index = 14;
        for (var i = 0; i < nTracks; i++) {
          tracks[i] = {};
          index = decodeTrack(data, tracks[i], index);
          if (index === -1) {
            utils.error("error reading track #" + i);
          }
        }
        return tracks;
      })()
  };

};

var decodeTrack = function (data, track, offset) {
  var idx = offset;
  var length;
  var end;

  //   char           ID[4];  // Track header "MTrk" 
  if ( (data.getUint8(idx++) != 0x4d) ||
      (data.getUint8(idx++) != 0x54) ||
      (data.getUint8(idx++) != 0x72) ||
      (data.getUint8(idx++) != 0x6b) )
  {error("malformed track header"); return -1;}

  //   unsigned long length;  // length of track chunk in bytes
  track.byteLength = data.getUint32(idx);
  idx+=4;
  end = idx + track.byteLength;

  track.events = [];  // creates an empty array

  // any number of trackEvents.
  while (idx < end) {
    idx = decodeTrackEvent( data, track, idx );
    if (idx == -1)
    {error("error decoding track event"); return -1;}
  }

  //  {error("error"); return -1;}
  return idx;
};



function decodeTrackEvent( data, track, trackOffset ) {
  var eventLength; // in bytes
  var time;   // time this event occurs (delta)
  var trackEvent = {};
  var result;
  var idx = trackOffset;
  var lastEventIdx = track.events.length;

  result = decodeVariableLengthValue( data, idx );
  idx = result.idx;
  trackEvent.delta = result.result;

  // switch (data.getUint8(idx)) {
  //   case 0xff:
  //   case 0xf0:
  //   case 0xf7:
  //     // update index...
  //     break;
  //   default:
  //     if (i & 0x80) { idx = decodeMIDIEvent(data, idx, trackEvent); }
  //     else if (lastEventIdx > 0) { utils.error }
  //     break;
  // }

  // figure out what type of event we have - DON'T increment the index!!
  var i = data.getUint8(idx);
  if (i==0xff)
    idx = decodeMetaEvent( data, idx, track, trackEvent );
  else if ((i==0xf0)||(i==0xf7))
    idx = decodeSysexEvent( data, idx, track, trackEvent );
  else if (i & 0x80) // non-running-mode MIDI Event
    idx = decodeMIDIEvent( data, idx, trackEvent );
  else if (lastEventIdx > 0)
    idx = decodeRunningModeMIDIEvent( data, idx, trackEvent, track.events[track.events.length-1] );
  else {error("Running mode event with no previous event!"); return -1;}

  track.events.push(trackEvent);

  return idx;
}

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
