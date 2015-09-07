var ractive,
    triggerStartTime = Date.now(),
    minTriggerResetTimeMs = 3 * 1000;

$.get('/config').then(initWithConfig);

function initWithConfig(config) {
  var collectorBase = 'http://' + config.collector.host + ':' + config.collector.port;
  var client = new Faye.Client(collectorBase + '/faye');
  ractive = new Ractive({
    el: '#ui',
    template: '#ui-template',
    computed: {
    },
    data: {
      collectorBase: collectorBase,
      currentView: 'images',
      isTriggering: false,
      filterNoAps: function (data) {
        return _.filter(data, function (d) {
          return d.aps != '';
        });
      }
    }
  });

  client.subscribe('/trigger', handleTrigger);
  client.subscribe('/reload', handleReload);
  client.subscribe('/render', handleRender);
  handleRender({}); // Initial render

  function renderNextView() {
    var currentView = ractive.get('currentView'),
        nextView,
        views = _.map(ractive.findAll('.view'), function(x) {
      var viewId = x.getAttribute('id');

      if(viewId != currentView) {
        return viewId;
      }
    });

    views = _.compact(views);
    nextView = _.sample(views);

    console.log(nextView);

    ractive.set({incomingView: nextView});
    ractive.set({outgoingView: currentView});

    setTimeout(function() {
      ractive.set({
        incomingView: null, outgoingView: null, currentView: nextView
      });

      setTimeout(renderNextView, 2000);
    }, 4000);
  }

  //setTimeout(renderNextView, 2000);

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
    $.get(collectorBase + '/state')
      .then(function (data) {
        console.log('data', data);
        window.d = data;
        ractive.set(data);

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
