
require("colors");

var print = function (type, msg) {
  var out = "prettymidi ".grey + type + " " + msg;
  console.log(out);
};

/**
 * Log an error to the console
 *
 * @param {String} msg : error message
 */

exports.error = function (msg) {
  print("error".red, msg);
};

/**
 * Log a message to the console
 *
 * @param {String} msg
 */

exports.log = function (msg) {
  print("log".green, msg);
};
