exports.buildUri = function(path) {
  var baseUri = 'http://localhost:3000';
  return baseUri + path;
};

// from https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Date
exports.getTimestamp = function(d) {
  function pad(n){return n<10 ? '0'+n : n}
  return d.getUTCFullYear()+'-'
    + pad(d.getUTCMonth()+1)+'-'
    + pad(d.getUTCDate())+'T'
    + pad(d.getUTCHours())+':'
    + pad(d.getUTCMinutes())+':'
    + pad(d.getUTCSeconds())+'Z'
};
