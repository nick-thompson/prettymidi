# PrettyMidi

Decode MIDI files into easily comprehensible javascript objects.

## Motivation
If you're doing any sort of sequencing with the Web Audio API, you need some way
to represent timed events! Chances are you won't try to redefine the industry
standard (MIDI). So what then? Let PrettyMidi parse your MIDI files into 
intuitive JSON objects, and you'll be rolling in no time ;)

## Usage
Install the module with: `npm install prettymidi`

### Command Line

### Node.js

### Browser

```javascript
var data  = prettyMidi.decode(myMidiFileBuffer)
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
MIT License
