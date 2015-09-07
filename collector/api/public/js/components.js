Ractive.components = {
  View: Ractive.extend({ template: '#ui-view' }),
  Images: Ractive.extend({
    template: '#ui-images', oninit: pickRandom
  }),
  Networks: Ractive.extend({ template: '#ui-networks' }),
  Credits: Ractive.extend({ template: '#ui-credits' })
};

function rnd() {
  var img = this.get('latestImages') || [];

  this.set('randomImages', _.sample(img, 4));
}

function pickRandom() {
  console.log('pick');
  //this.observe('latestImages', rnd.bind(this));
  setTimeout(rnd.bind(this), 500);
  setInterval(rnd.bind(this), 5000);
}
