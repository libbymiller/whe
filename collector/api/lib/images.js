var AmpersandCollection = require('ampersand-collection'),
    _ = require('lodash');

var Images = AmpersandCollection.extend({
  mainIndex: 'source'
});

/*
  Convenience method to see if each item
  exists in the collection and to remove
  it and add the new one if it does
*/
Images.prototype.replace = function (data) {
  if (data.forEach) {
    data.forEach(this.replace.bind(this));
  } else {
    if ( this.get(data.source) ) {
      this.remove(data, { silent: true });
    }
    this.add(data);
  }
};

/*
  find a specific image file object in a collection
*/
Images.prototype.findFile = function (name) {
  return _(this.models)
          .pluck('files')
          .flatten()
          .find(function (file) { return file.name === name; });
};

module.exports = Images;