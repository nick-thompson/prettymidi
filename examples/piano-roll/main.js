
var context = new webkitAudioContext();

var map = [{
  zone: {
    low: 60,
    high: 61,
  },
  root: 60,
  url: "audio/606bass.wav",
  name: "Kick"
}, {
  zone: {
    low: 62,
    high: 62
  },
  root: 62,
  url: "audio/606snare.wav",
  name: "Snare"
}, {
  zone: {
    low: 65,
    high: 66,
  },
  root: 65,
  url: "audio/606bass.wav",
  name: "Kick2"
}, {
  zone: {
    low: 67,
    high: 68
  },
  root: 67,
  url: "audio/606snare.wav",
  name: "Snare2"
}, {
  zone: {
    low: 63,
    high: 63
  },
  root: 63,
  url: "audio/606chat.wav",
  name: "CHat"
}, {
  zone: {
    low: 70,
    high: 70
  },
  root: 70,
  url: "audio/606chat.wav",
  name: "CHat2"
}, {
  zone: {
    low: 69,
    high: 69
  },
  root: 69,
  url: "audio/606htom.wav",
  name: "HTom"
}, {
  zone: {
    low: 64,
    high: 64
  },
  root: 64,
  url: "audio/606htom.wav",
  name: "HTom2"
}];

var s = new Sampler(context, map, function () {
  d3.json("break.json", function (midi) {
    var time = context.currentTime

      // Midi file time metrics
      , bpm = 180
      , tpb = midi.ticksPerBeat
      , division = 60 / bpm / tpb

      // Restructured data format for d3.js
      , data = []
      , map = {}

      // Style attributes
      , margin = 20
      , width = window.innerWidth - (margin * 2)
      , height = 100;

    var chart = d3.select("body").append("svg")
      .attr("class", "chart")
      .attr("width", width)
      .attr("height", height);

    // Restructure the midi event data
    midi.tracks[0].events.forEach(function (e, i) {
      time += e.deltaTime * division;
      if (e.type === "noteOn") { 
        map[e.note] = {
          start: { x: time, y: e.note },
          stop: { y: e.note }
        };
        s.noteOn(e.note, e.velocity, time);
      } else if (e.type === "noteOff") {
        map[e.note].stop.x = time;
        data.push(map[e.note]);
        map[e.note] = null;
      }
    });

    var x = d3.scale.linear()
              .domain([
                0, 
                d3.max(data, function (d) { return d.stop.x; })
              ])
              .range([0, width])

      , y = d3.scale.linear()
              .domain([
                d3.min(data, function (d) { return d.stop.y; }) - 1,
                d3.max(data, function (d) { return d.stop.y; }) + 1
              ])
              .range([height, 0]);

    chart.selectAll("rect")
      .data(data)
      .enter().append("rect")
        .attr("x", function (d, i) { return x(d.start.x); })
        .attr("y", function(d, i) { return y(d.start.y); })
        .attr("width", function (d) { return x(d.stop.x) - x(d.start.x); })
        .attr("height", 8);

  });

});

