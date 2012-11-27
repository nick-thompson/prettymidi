
var exec    = require("child_process").exec
  , fs      = require("fs")
  , chai    = require("chai")
  , expect  = chai.expect
  , should  = chai.should()
  , exists  = fs.existsSync;

describe("prettymidi default", function () {

  describe("Decoding a single file", function () {

    it("outputs a json file in the same directory", function (done) {
      exec("bin/prettymidi test/fixtures/example-ctwykm.mid", function (err, stdout) {
        if (err) { done(err); }
        stdout.should.include("written");
        expect(exists("example-ctwykm.json")).to.equal(true);

        var data = JSON.parse(fs.readFileSync("example-ctwykm.json"));
        expect(data).to.be.a("object");
        data.should.have.property("ticksPerBeat");

        exec("rm example-ctwykm.json", function (err, stdout) {
          if (err) { done(err); }
          done();
        });
      });
    });

    it("accepts an output destination flag", function (done) {
      done();
    });
  });

  describe("Decoding several files", function () {
  });

  describe("Decoding a directory", function () {
  });

});
