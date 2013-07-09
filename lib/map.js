
module.exports = {
  0x8: {
    type: "noteOff",
    params: ["note", "velocity"]
  },
  0x9: {
    type: "noteOn",
    params: ["note", "velocity"]
  },
  0xA: {
    type: "noteAftertouch",
    params: ["note", "value"]
  },
  0xB: {
    type: "controller",
    params: ["controllerNumber", "value"]
  },
  0xC: {
    type: "programChange",
    params: ["programNumber"]
  },
  0xD: {
    type: "channelAftertouch",
    params: ["value"]
  },
  0xE: {
    type: "pitchBend",
    params: ["lowValue", "highValue"]
  }
};

