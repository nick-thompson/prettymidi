
var exec    = require("child_process").exec
  , fs      = require("fs")
  , chai    = require("chai")
  , expect  = chai.expect
  , should  = chai.should()
  , exists  = fs.existsSync;

describe("prettymidi default", function () {

  afterEach(function (done) {
    exec("rm -rf prettymidifiles", done);
  });

  it("Decodes a midi file", function (done) {
    exec("bin/prettymidi test/fixtures/example-ctwykm.mid", function (err, stdout) {
      if (err) { done(err); }
      stdout.should.include("written");
      expect(exists("prettymidifiles/example-ctwykm.js")).to.equal(true);
      done();
    });
  });

  it("Can print plain json", function (done) {
    exec("bin/prettymidi -j test/fixtures/example-ctwykm.mid", function (err, stdout) {
      if (err) { done(err); }
      stdout.should.include("written");
      expect(exists("prettymidifiles/example-ctwykm.json")).to.equal(true);

      var data = JSON.parse(fs.readFileSync("prettymidifiles/example-ctwykm.json"));
      expect(data).to.be.a("object");
      data.should.have.property("nTracks");
      done();
    });
  });

  describe("Decoding a single file", function () {

    it("outputs a json file in the same directory", function (done) {
      done();
    });

    it("accepts an output destination flag", function (done) {
      done();
    });

    it("accepts an amd wrapper flag", function (done) {
      done();
    });
  });

  describe("Decoding several files", function () {
  });

  describe("Decoding a directory", function () {
  });

});
