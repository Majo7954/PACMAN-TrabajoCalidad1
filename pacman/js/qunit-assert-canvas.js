QUnit.extend(QUnit.assert, {
  pixelEqual: function(canvas, x, y, r, g, b, a, message) {
    var actual = Array.prototype.slice.apply(canvas.getContext("2d").getImageData(x, y, 1, 1).data),
        expected = [r, g, b, a];
    QUnit.push(QUnit.equiv(actual, expected), actual, expected, message);
  },
  pixelNotEqual: function(canvas, x, y, r, g, b, a, message) {
    var actual = Array.prototype.slice.apply(canvas.getContext("2d").getImageData(x, y, 1, 1).data),
        expected = [r, g, b, a];
    message = message || "should not be " + expected;
    QUnit.push(!QUnit.equiv(actual, expected), actual, expected, message);
  }

});