
var exec    = require("child_process").exec
  , fs      = require("fs")
  , path    = require("path")
  , chai    = require("chai")
  , expect  = chai.expect
  , should  = chai.should()
  , exists  = fs.existsSync;

describe("prettymidi", function () {

  describe("Decoding a single file", function () {

    var input = "test/fixtures/break.mid"
      , outFile = path.basename(input, ".mid") + ".json";

    it("outputs a json file in the same directory", function (done) {
      exec("bin/prettymidi " + input, function (err, stdout) {
        if (err) { done(err); }
        stdout.should.include("reading");
        stdout.should.include("writing");
        expect(exists(outFile)).to.equal(true);

        var data = JSON.parse(fs.readFileSync(outFile));
        expect(data).to.be.a("object");
        data.should.have.property("ticksPerBeat");

        exec("rm " + outFile, function (err, stdout) {
          if (err) { done(err); }
          done();
        });
      });
    });

    it("accepts an output destination flag", function (done) {
      exec("bin/prettymidi -o output " + input, function (err, stdout) {
        if (err) { done(err); }
        stdout.should.include("reading");
        stdout.should.include("writing");

        outFile = "output/" + outFile;
        expect(exists(outFile)).to.equal(true);

        var data = JSON.parse(fs.readFileSync(outFile));
        expect(data).to.be.a("object");
        data.should.have.property("ticksPerBeat");

        exec("rm -r output", function (err, stdout) {
          if (err) { done(err); }
          done();
        });
      });
    });
  });

  describe("Decoding several files", function () {
  });

  describe("Decoding a directory", function () {
  });

});
