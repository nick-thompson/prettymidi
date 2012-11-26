
var exec    = require("child_process").exec
  , fs      = require("fs")
  , chai    = require("chai")
  , expect  = chai.expect
  , should  = chai.should()
  , exists  = fs.existsSync;

describe("step default", function () {

  afterEach(function (done) {
    exec("rm -rf stepfiles", done);
  });

  it("Decodes a midi file", function (done) {
    exec("bin/step test/fixtures/example-ctwykm.mid", function (err, stdout) {
      if (err) { done(err); }
      stdout.should.include("written");
      expect(exists("stepfiles/example-ctwykm.js")).to.equal(true);
      done();
    });
  });

  it("Can print plain json", function (done) {
    exec("bin/step -j test/fixtures/example-ctwykm.mid", function (err, stdout) {
      if (err) { done(err); }
      stdout.should.include("written");
      expect(exists("stepfiles/example-ctwykm.json")).to.equal(true);

      var data = JSON.parse(fs.readFileSync("stepfiles/example-ctwykm.json"));
      expect(data).to.be.a("object");
      data.should.have.property("nTracks");
      done();
    });
  });

});
