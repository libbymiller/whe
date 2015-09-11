var ractive,
    viewCount = 0,
    triggerStartTime = Date.now(),
    printLengthPerPrintCm = 5,
    minTriggerResetTimeMs = 3 * 1000,
    viewTransitionTimeMs = 2000;

$.get('/config').then(initWithConfig);

function initWithConfig(config) {
  var collectorBase = 'http://' + config.collector.host + ':' + config.collector.port;
  var client = new Faye.Client(collectorBase + '/faye');
  ractive = new Ractive({
    el: '#ui',
    template: '#ui-template',
    computed: {
      recentDevices: function () {
        // var devices = _.sortByOrder(this.get('metadata'), ['time']);
        var devices = _.shuffle(this.get('metadata'));
        return devices;
      },
      deviceTotalsByManufacturer: function () {
        var counts = _( this.get('metadata') )
                      .countBy('shortName')
                      .value();

        if (counts['undefined']) {
          counts['Unknown'] = counts['undefined'];
          delete counts['undefined'];
        }

        // Sort
        counts = _(counts)
          .pairs()
          .sortBy(function (item) { return item[1]; })
          .reverse()
          .map(function (item) {
            return {
              name : item[0],
              count: item[1]
            };
          })
          .value();

        return counts;
      },
      totalDevices: function () {
        return this.get('metadata').length;
      },
      printLength: function () {
        return this.get('printCount') * printLengthPerPrintCm;
      },
      totalCameras: function () {
        return this.get('latestImages').length;
      }
    },
    data: {
      collectorBase: collectorBase,
      currentView: 'images',
      isTriggering: false,
      latestImages: [],
      metadata: [],
      printCount: 0,
      imageCount: 0,
      filterNoAps: function (data) {
        return _.filter(data, function (d) {
          return d.aps != '';
        });
      }
    }
  });

  window.onhashchange = renderNextView;

  function viewInUrlHash() {
    if (window.location.hash) {
      return window.location.hash.replace('#', '');
    } else {
      return null;
    }
  }

  client.subscribe('/trigger', handleTrigger);
  client.subscribe('/reload', handleReload);
  client.subscribe('/render', handleRender);
  handleRender({}); // Initial render

  document.body.addEventListener('click', function () {
    document.body.webkitRequestFullscreen();
  });


  function incrementPrintCount() {
    ractive.set('printCount', ractive.get('printCount') + 1);
  }

  function incrementImageCount() {
    ractive.set('imageCount', ractive.get('imageCount') + 1);
  }

  // Transition to new view when the
  // 'nextView' property is set
  ractive.observe('nextView', function (newValue, oldValue, keypath) {
    if (newValue == null) { return; }

    var currentView = ractive.get('currentView'),
        nextView = newValue;

    if (currentView === nextView) {
      console.info('Views are the same, will not transition', currentView);
      return;
    }

    ractive.set({incomingView: nextView});
    ractive.set({outgoingView: currentView});

    setTimeout(function() {
      ractive.set({
        incomingView: null, outgoingView: null, currentView: nextView
      });
    }, viewTransitionTimeMs);
  });

  renderNextView();

  function renderNextView() {
    var currentView = ractive.get('currentView'),
        timeBetweenViewsMs,
        nextView,
        views;

    if(viewCount % 3 === 0 && currentView != 'images') {
      nextView = 'images';
    } else {
      views = _.map(ractive.findAll('.view'), function(x) {
        var viewId = x.getAttribute('id');

        if(viewId != currentView) {
          return viewId;
        }
      });

      views = _.compact(views);
      nextView = _.sample(views);
    }

    if (viewInUrlHash()) {
      console.warn('URL hash is overriding random view selection');
      nextView = viewInUrlHash();
    }

    console.log('nextView', nextView);
    ractive.set('nextView', nextView);

    if(nextView === 'images') {
      timeBetweenViewsMs = viewTransitionTimeMs + 15000;
    } else {
      timeBetweenViewsMs = viewTransitionTimeMs + 10000;
    }

    viewCount++;
    setTimeout(renderNextView, timeBetweenViewsMs);
  }

  function handleTrigger(msg) {
    console.log('TRIGGER', msg);
    ractive.set('isTriggering', true);
    triggerStartTime = Date.now();
  }

  function handleReload(msg) {
    console.log('RELOAD', msg);
    window.location.reload(false);
  }

  function handleRender(msg) {
    console.log('RENDER', msg);

    incrementPrintCount();

    $.get(collectorBase + '/state')
      .then(function (data) {
        console.log('data', data);
        window.d = data;
        ractive.set(data);
        incrementImageCount();

        var renderInterval = Date.now() - triggerStartTime,
        timeLeft = minTriggerResetTimeMs - renderInterval;

        if (timeLeft <= 0) {
          ractive.set('isTriggering', false);
        } else {
          setTimeout(function () {
            ractive.set('isTriggering', false);
          }, timeLeft);
        }
      });
  }

  function addCachebuster(url) {
    return url + '?' + Date.now();
  }
}
