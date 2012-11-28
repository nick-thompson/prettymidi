# PrettyMidi

Decode MIDI files into easily comprehensible javascript objects.

## Motivation
If you're doing any sort of sequencing with the Web Audio API, you need some way
to represent timed events! Chances are you won't try to redefine the industry
standard (MIDI). So what then? Let PrettyMidi parse your MIDI files into 
intuitive JSON objects, and you'll be rolling in no time ;)

## Usage
Right now, PrettyMidi is solely a command line tool. The usage section below
defines how you might use it in the browser, which is basically the focus of
PrettyMidi, but the browser api is not available yet. Right now you can just
parse local midi files into json files from your command line.

Soon you'll be able to install with npm, but I haven't registered it yet.
For now you'll have to clone this repo and run `npm link`. I'll register it
as soon as I touch it up a little :)

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
