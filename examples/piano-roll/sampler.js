
var Sampler = function (context, map, callback) {
  this.context = context;
  this.dest = context.destination;
  this.data = {};
  this.voices = {};

  var left = map.length;
  map.forEach(function (sample) {
    this.load(sample, function () {
      if (--left === 0) {
        callback();
      }
    }.bind(this));
  }.bind(this));
};

Sampler.prototype.load = function (sample, callback) {
  var request = new XMLHttpRequest();
  request.open("get", sample.url, true);
  request.responseType = "arraybuffer";
  request.onload = function () {
    this.context.decodeAudioData(request.response, function (buffer) {
      sample.buffer = buffer;
      this.data[sample.name] = sample;
      callback();
    }.bind(this));
  }.bind(this);
  request.send();
};
 
Sampler.prototype.noteOn = function (note, velocity, when, offset, duration) {
  for (var prop in this.data) {
    var sample = this.data[prop];
    if (sample.zone.low <= note && sample.zone.high >= note) {
      var node = this.context.createBufferSource();
      node.buffer = sample.buffer;
      node.connect(this.dest);
      node.start(when, offset, duration);
      this.voices[note] = node;
      break;
    }
  }
};
  
