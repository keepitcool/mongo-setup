exports.securePath = function (path) {
  if (path.indexOf('/') !== 0 && path.indexOf('./') !== 0 && path.indexOf('../') !== 0) {
    path = './' + path;
  }
  return path;
};
