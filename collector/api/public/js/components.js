var ViewComponent = Ractive.extend({
  template: '#ui-view',
  oninit: function () {
    var name = this.get('name');
    this.observe('currentView', function (newValue, oldValue) {
      if (newValue === name) {
        console.log('View has mounted', name);
        this.startFrameScroll();
      }
    });
  },
  startFrameScroll: function () {
    if (!this.el) { return; }

    var el = this.el.querySelector('.scrollable-frame > *'),
        height;

    if (el) {
      setTimeout(function () {
        height = el.scrollHeight / 2;
        console.log('height', el.scrollHeight, height, el);
        el.style.transform = 'translateY(-' + height + 'px)';
      }, 0);
    }
  }
});


// scrollable-frame

var ImagesComponent = Ractive.extend({
  template: '#ui-images',
  oninit: function () {
    console.log('init');
    this.root.observe('latestImages', this.randomiseImages);
    //setInterval(this.randomiseImages.bind(this), 5000);
  },
  randomiseImages: function () {
    var img = this.get('latestImages') || [];
    var num_to_drop = 0;
    console.log("ZZZZ num to drop is "+num_to_drop);
    if(img.length > 4){
       num_to_drop = img.length - 4;
    }
    console.log("ZZZZ num to drop is "+num_to_drop);
//    this.set('randomImages', _.sample(img, 4));
    this.set('randomImages', _.drop(img, num_to_drop).reverse());
  }
//  lastFourImages: function () {
//    var img = this.get('latestImages') || [];
  //  this.set('lastImages', img.slice(-4));
  //}
});

var RecentDevicesComponent = Ractive.extend({ template: '#ui-recent-devices' });

Ractive.components = {
  View: ViewComponent,
  Devices: Ractive.extend({ template: '#ui-devices' }),
  ImageTotals: Ractive.extend({ template: '#ui-image-totals' }),
  Images: ImagesComponent,
  RecentDevices: RecentDevicesComponent,
  Credits: Ractive.extend({ template: '#ui-credits' })
};
