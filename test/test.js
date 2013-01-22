var pm      = require("../index")
  , chai    = require("chai")
  , expect  = chai.expect
  , should  = chai.should()
  , fs      = require("fs")
  , path    = require("path");

describe("prettymidi", function () {

  var fp = path.resolve(__dirname, "fixtures/break.mid")
    , buffer = fs.readFileSync(fp);

  it("Correctly decodes a MIDI file buffer.", function () {

    var data = pm.decode(buffer);
    expect(data).to.be.a("object");
    expect(data.format).to.be.equal(1);
    expect(data.tracks.length).to.be.equal(1);
    expect(data.tracks[0].events.length > 0).to.be.equal(true);

  });

});
