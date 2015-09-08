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

var RecentDevicesComponent = Ractive.extend({ template: '#ui-recent-devices' });


var NetworksComponent = Ractive.extend({ template: '#ui-networks' });

Ractive.components = {
  View: Ractive.extend({ template: '#ui-view' }),
  Images: ImagesComponent,
  Networks: NetworksComponent,
  RecentDevices: RecentDevicesComponent,
  Credits: Ractive.extend({ template: '#ui-credits' })
};
