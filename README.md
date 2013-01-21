# PrettyMidi

A simple MIDI file decoding library for audio applications.

## Download

### Node.js

Soon you'll be able to install with `npm install prettymidi`. Not yet though ;).

### Browser

**Development:** [prettymidi.js](https://raw.github.com/nick-thompson/prettymidi/master/prettymidi.js)
**Production:** [prettymidi.min.js](https://raw.github.com/nick-thompson/prettymidi/master/prettymidi.min.js)

## Getting Started

```javascript
var data  = pm.decode(myMidiFileBuffer)
  , time  = context.currentTime
  , bpm   = 140 // beats per minute
  , tpb   = 8; // ticks per beat

data.tracks[0].events.forEach(function (e) {
  time += e.delta * bpm * tpb;
  switch (e.type) {
    case "noteOn":
      mySynth.voiceOn(e.note, time);
      break;
    case "noteOff";
      mySynth.voiceOff(e.note, time);
      break;
    default:
      break;
  }
});
```

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
