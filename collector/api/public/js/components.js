var ImagesComponent = Ractive.extend({
  template: '#ui-images',
  oninit: function () {
    console.log('init');
    this.root.observe('latestImages', this.randomiseImages);
    setInterval(this.randomiseImages.bind(this), 5000);
  },
  randomiseImages: function () {
    var img = this.get('latestImages') || [];
    this.set('randomImages', _.sample(img, 4));
  }
});

Ractive.components = {
  View: Ractive.extend({ template: '#ui-view' }),
  Images: ImagesComponent,
  Networks: Ractive.extend({ template: '#ui-networks' }),
  Credits: Ractive.extend({ template: '#ui-credits' })
};
