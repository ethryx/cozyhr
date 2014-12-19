var Cozy = angular.module('cozyhr-app', ['ng', 'ngRoute', 'ngSanitize', 'ngSails']);

Cozy.config(function($routeProvider, $locationProvider) {
  $routeProvider
    .when('/dash', {
      templateUrl: '/templates/dash.html',
      controller: 'DashController'
    })
    .otherwise({
      redirectTo: '/dash'
  });

  $locationProvider
    .html5Mode(false)
    .hashPrefix('!');
});

Cozy.controller('PageController', function($scope, $rootScope, $sails, $authUser) {

  // First, let's set up third-party integrations.
  $(document).on('mouseover', '.tt', function() {
    if(!$(this).data('tt-init')) {
      $(this).jBox('Tooltip');
      $(this).data('tt-init', true);
      $(this).mouseover();
    }
  });

  // Next, disable right click.
  $(document).bind('contextmenu', function(e) {
    e.preventDefault();
  });

  // Then, set up global socket events (can happen anywhere in the app)
  $sails.on('exception', function(exceptionData) {
    //CozyHR.exception(exceptionData.stack);
  });

  // And now, set up global-page scope
  $scope.pageTitle = function() {
    if($rootScope.subsection) {
      return 'CozyHR: ' + $rootScope.subsection;
    } else {
      return 'CozyHR';
    }
  };

  // Next, set up rootScope (avail to all controllers)
  $rootScope.fancyDate = function(a, b, fancyReturn, opt) {
    var _MS_PER_DAY = 1000 * 60 * 60 * 24;
    var _MS_PER_HOUR = 1000 * 60 * 60;
    var _MS_PER_MINUTE = 1000 * 60;
    var _MS_PER_SECOND = 1000;

    // Discard the time and time-zone information.
    var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate(), a.getHours(), a.getMinutes(), a.getSeconds());
    var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate(), b.getHours(), b.getMinutes(), b.getSeconds());

    var ret = {};

    ret.days = Math.floor((utc2 - utc1) / _MS_PER_DAY);
    ret.hours = Math.floor((utc2 - utc1) / _MS_PER_HOUR) - (ret.days * 24);
    ret.minutes = Math.floor((utc2 - utc1) / _MS_PER_MINUTE) - (ret.days * 1440) - (ret.hours * 60);
    ret.seconds = Math.floor((utc2 - utc1) / _MS_PER_SECOND) - (ret.days * 86400) - (ret.hours * 3600) - (ret.minutes * 60);

    if(!opt) { opt = {}; }

    var options = {
      now: ((opt.now) ? opt.now : 'Just now'),
      withinHour: ((opt.withinHour) ? opt.withinHour : '%mm ago'),
      withinDay: ((opt.withinDay) ? opt.withinDay : '%hh ago'),
      yesterday: ((opt.yesterday) ? opt.yesterday : 'Yesterday'),
      withinMonth: ((opt.withinMonth) ? opt.withinMonth : '%dd ago')
    };

    if(!fancyReturn)
      return ret;

    if(ret.days == 0 && ret.hours == 0 && ret.minutes == 0) {
      return options.now.replace('%s', ret.seconds);
    }
    else if(ret.days == 0 && ret.hours == 0 && ret.minutes >= 1) {
      return options.withinHour.replace('%s', ret.seconds).replace('%m', ret.minutes);
    }
    else if(ret.days == 0 && ret.hours >= 1) {
      return options.withinDay.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours);
    }
    else if(ret.days == 1) {
      return options.yesterday.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours);
    }
    else {
      if(ret.days > 30 && Math.floor(ret.days / 30) < 12) {
        return Math.floor(ret.days / 30) + ' months ago';
      } else if(ret.days > 30 && Math.floor(ret.days / 30) >= 12) {
        return Math.floor( Math.floor(ret.days / 30) / 12 ) + ' years ago';
      } else {
        return options.withinMonth.replace('%s', ret.seconds).replace('%m', ret.minutes).replace('%h', ret.hours).replace('%d', ret.days);
      }
    }
  };

  // And finally, only show the app when authenticated.
  // The promise below will only succeed when authenticated.
  $authUser.getUserInfo().then(function() {
    $scope.session = $authUser.getSession();

    console.log('$scope.session', $scope.session);

    ['#topMenu', '#bottomMenu'].forEach(function(_menu) {
      $(_menu).hide().css({opacity: 1}).slideDown();

      $scope.appVisible = true;
    });
  });
});