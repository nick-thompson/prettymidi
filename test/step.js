
var exec    = require("child_process").exec
  , fs      = require("fs")
  , chai    = require("chai")
  , expect  = chai.expect
  , should  = chai.should();

describe("step default", function () {

  afterEach(function (done) {
    exec("rm -rf step", done);
  });

  it("Decodes a midi file", function (done) {
    exec("bin/step test/fixtures/example-yctwykm.mid", function (err, stdout) {
      done();
    });
  });

});
