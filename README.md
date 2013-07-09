# PrettyMIDI

PrettyMIDI is a simple MIDI utility library for audio applications.

## Installation

```
$ npm install prettymidi
```

Interested in browser development? Check out [Browserify](http://browserify.org/).

## Example Usage

### Decoding
```javascript
var fs = require('fs')
  , pm = require('pm')
  , Decoder = pm.Decoder;

// Decode a MIDI file, returning a pretty and easily consumable JSON object.
fs.readFile('/path/to/drums.mid', function (err, data) {
  if (err) throw err;
  var data  = new Decoder().decode(buffer);
  data.tracks[0].events.forEach(function (e) {
    console.log(e.delta); // Delta time since last MIDI event.
    switch (e.type) {
      case 'noteOn':
        mySynth.voiceOn(e.note, e.velocity);
        break;
      case 'noteOff';
        mySynth.voiceOff(e.note, e.velocity);
        break;
      default:
        break;
    }
  });
});
```

### Web MIDI
```javascript
var pm = require('prettymidi')
  , Controller = pm.Controller;

navigator.requestMIDIAccess().then(function (access) {
  console.log(pm.readDevices(access));
  var padKontrol = new Controller(access, 1);
  padKontrol.on('message', function (msg) {
    switch (msg.type) {
      // Message type is decoded for you
      case 'noteOn':
        console.log(msg.note);
        console.log(msg.velocity);
        break;
      ...
      case 'pitchBend':
        // Parameter names decoded depending on message type.
        console.log(msg.lowValue);
        console.log(msg.highValue);
        break;
      default:
        break;
    }
  });
}, function (message) {
  console.log('Error: ' + message);
});
```

## Attribution

The following projects were hugely helpful and inspirational in building
PrettyMIDI:

* [Standard-MIDI-File-Reader](https://github.com/cwilso/Standard-MIDI-File-reader)
* [MIDI.js](https://github.com/mudcube/MIDI.js).

## License
Copyright (c) 2012 Nick Thompson

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
