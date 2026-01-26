var appModule = angular.module("mainModule", ['ngRoute', 'angular-loading-bar', 'ngAnimate', 'darthwade.loading', 'AxelSoft', 'ui.tree', 'datatables', 'datatables.buttons', 'ngDragDrop', 'angularjs-dropdown-multiselect']);
var appVersion = '20231109-68';

appModule.Root = "/admin";

appModule.run(['$rootScope', '$location', '$agentService', function ($rootScope, $location, $agentService) {
  $rootScope.safeApply = function (fn) {
    var phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof (fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

  $rootScope.$on("$routeChangeStart", function (event, next, current) {
    if (!appModule.Root) return;
    if (next.$$route.originalPath.indexOf(appModule.Root)) return;
    $location.path(appModule.Root + next.$$route.originalPath);

    // Gestionar estado de compactHeader solo para /agentposition
    // Si salimos de /agentposition forzar compactHeader = false
    if (nextPath !== '/agentposition') {
      if ($agentService.getCompactHeader()) {
        $agentService.setCompactHeader(false);
        console.log('ℹ️ compactHeader desactivado al salir de /agentposition');
      }
    } else {
      // Al entrar a /agentposition aseguramos que esté activo
      if (!$agentService.getCompactHeader() && !SETTINGS.LegacySite) {
        $agentService.setCompactHeader(true);
        console.log('ℹ️ compactHeader activado al entrar a /agentposition');
      }
    }


  });


  // Rutas públicas que no requieren autenticación
  //var publicRoutes = ['/login', '/trackierLogin'];

  // $rootScope.$on("$routeChangeStart", function (event, next, current) {
  //     if (!next || !next.$$route) return;

  //     var nextPath = next.$$route.originalPath;

  //     // Si intenta ir a login y YA está autenticado
  //     if (nextPath === '/admin/login') {
  //         if ($agentService.AgentInfo && $agentService.AgentInfo.AgentID) {
  //             event.preventDefault();
  //             console.log('⚠️ Ya está autenticado, redirigiendo a dashboard');
  //             $location.path('/dashboard');
  //             return;
  //         }
  //         // Si NO está autenticado, dejarlo ir al login real (SETTINGS.LoginSite)
  //         event.preventDefault();
  //         window.location.href = SETTINGS.LoginSite;
  //         return;
  //     }

  //     // Para cualquier otra ruta, verificar si está autenticado
  //     if (publicRoutes.indexOf(nextPath) === -1) {
  //         // Si NO está autenticado y trata de acceder ruta protegida
  //         if (!$agentService.AgentInfo || !$agentService.AgentInfo.AgentID) {
  //             event.preventDefault();
  //             console.log('⚠️ No autenticado, redirigiendo a login');
  //             window.location.href = SETTINGS.LoginSite;
  //             return;
  //         }
  //     }

  //     // Lógica original
  //     if (!appModule.Root) return;
  //     if (next.$$route.originalPath.indexOf(appModule.Root)) return;
  //     $location.path(appModule.Root + next.$$route.originalPath);
  // });



}]);


appModule.factory('$recursionHelper', ['$compile', function ($compile) {
  return {
    /**
     * Manually compiles the element, fixing the recursion loop.
     * @param element
     * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
     * @returns An object containing the linking functions.
     */
    compile: function (element, link) {
      // Normalize the link parameter
      if (angular.isFunction(link)) {
        link = { post: link };
      }

      // Break the recursion loop by removing the contents
      var contents = element.contents().remove();
      var compiledContents;
      return {
        pre: (link && link.pre) ? link.pre : null,
        /**
         * Compiles and re-adds the contents
         */
        post: function (scope, element) {
          // Compile the contents
          if (!compiledContents) {
            compiledContents = $compile(contents);
          }
          // Re-add the compiled contents to the element
          compiledContents(scope, function (clone) {
            element.append(clone);
          });

          // Call the post-linking function, if any
          if (link && link.post) {
            link.post.apply(null, arguments);
          }
        }
      };
    }
  };
}]);

appModule.config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: appModule.Root + '/app/components/dashboard/dashboardView.html?v=' + appVersion,
        controller: 'dashboardController',
        reloadOnSearch: false
      }).
      when('/dashboard', {
        templateUrl: appModule.Root + '/app/components/dashboard/dashboardView.html?v=' + appVersion,
        controller: 'dashboardController',
        reloadOnSearch: false
      }).
      when('/agentdistribution', {
        templateUrl: appModule.Root + '/app/components/agentdistribution/agentdistributionView.html?v=' + appVersion,
        controller: 'agentdistributionController',
        reloadOnSearch: false
      }).
      when('/agentposition', {
        templateUrl: appModule.Root + '/app/components/agentposition/agentpositionView.html?v=' + appVersion,
        controller: 'agentpositionController',
        reloadOnSearch: false
      }).
      when('/agentExposure', {
        templateUrl: appModule.Root + '/app/components/agentExposure/agentExposureView.html?v=' + appVersion,
        controller: 'agentExposureController',
        reloadOnSearch: false
      }).
      when('/contestPosition', {
        templateUrl: appModule.Root + '/app/components/contestposition/contestPositionView.html?v=' + appVersion,
        controller: 'contestPositionController',
        reloadOnSearch: false
      }).
      when('/summarytransations/:SummaryOnly', {
        templateUrl: appModule.Root + '/app/components/agentdistribution/agentdistributionView.html?v=' + appVersion,
        controller: 'agentdistributionController',
        reloadOnSearch: false
      }).
      when('/cashtransactions/:AgentIdArg', {
        templateUrl: appModule.Root + '/app/components/cashtransactions/cashtransactionsView.html?v=' + appVersion,
        controller: 'cashtransactionsController',
        reloadOnSearch: false
      }).
      when('/customers', {
        templateUrl: appModule.Root + '/app/components/customers/customersView.html?v=' + appVersion,
        controller: 'customersController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customers/:PostUp', {
        templateUrl: appModule.Root + '/app/components/customers/customersView.html?v=' + appVersion,
        controller: 'customersController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customertransactions/', {
        templateUrl: appModule.Root + '/app/components/customertransactions/customertransactionsView.html?v=' + appVersion,
        controller: 'customertransactionsController',
        reloadOnSearch: false
      }).
      when('/customertransactions/:CustomerIdArg/:IsAgent', {
        templateUrl: appModule.Root + '/app/components/customertransactions/customertransactionsView.html?v=' + appVersion,
        controller: 'customertransactionsController',
        reloadOnSearch: false
      }).
      when('/dailyfigures', {
        templateUrl: appModule.Root + '/app/components/dailyfigures/dailyFiguresView.html?v=' + appVersion,
        controller: 'dailyFiguresController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/dailyfiguresws/:ShowSettleFigure', {
        templateUrl: appModule.Root + '/app/components/dailyfigures/dailyFiguresView.html?v=' + appVersion,
        controller: 'dailyFiguresController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/liveticker', {
        templateUrl: appModule.Root + '/app/components/liveticker/livetickerView.html?v=' + appVersion,
        controller: 'livetickerController',
        reloadOnSearch: false
      }).
      when('/openBetsMobile', {
        templateUrl: appModule.Root + '/app/components/openBets/OpenBetsMobile.html?v=' + appVersion,
        controller: 'openbetsController',
        reloadOnSearch: true
      }).
      when('/openbets/:CustomerId?', {
        templateUrl: appModule.Root + '/app/components/openbets/openbetsView.html?v=' + appVersion,
        controller: 'openbetsController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/alltransactions', {
        templateUrl: appModule.Root + '/app/components/alltransactions/alltransactionsView.html?v=' + appVersion,
        controller: 'alltransactionsController',
        reloadOnSearch: false
      }).
      when('/performance', {
        templateUrl: appModule.Root + '/app/components/performance/performanceView.html?v=' + appVersion,
        //controller: 'performanceController',
        reloadOnSearch: false
      }).
      when('/detailedPerformance', {
        templateUrl: appModule.Root + '/app/components/detailedPerformance/detailedPerformanceView.html?v=' + appVersion,
        //controller: 'performanceController',
        reloadOnSearch: false
      }).
      when('/sportslimits', {
        templateUrl: appModule.Root + '/app/components/sportslimits/sportsLimitsView.html?v=' + appVersion,
        controller: 'sportsLimitsController',
        reloadOnSearch: false
      }).
      when('/vigLimits/:customerId', {
        templateUrl: appModule.Root + '/app/components/customer/vigLimits.aspx?v=' + appVersion,
        controller: 'sportsLimitsController',
        reloadOnSearch: false
      }).
      when('/linesmanager', {
        templateUrl: appModule.Root + '/app/components/linesManager/linesManagerView.html?v=' + appVersion,
        controller: 'linesManagerController',
        reloadOnSearch: false
      }).
      when('/integrations/:name/:arg1?/:arg2?', {
        templateUrl: function (urlattr) {
          console.log(urlattr);
          return appModule.Root + '/app/components/integrations/' + urlattr.name + '.html?v=' + appVersion;
        },
        controller: 'sysIntegrationController',
        css: '/app/components/integrations/games.css',
        reloadOnSearch: true
      }).
      when('/weeklyBilling', {
        templateUrl: appModule.Root + '/app/components/weeklyBilling/weeklyBillingView.html?v=' + appVersion,
        controller: 'weeklyBillingController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/webAccess', {
        templateUrl: appModule.Root + '/app/components/webAccess/webAccessView.html?v=' + appVersion,
        controller: 'webAccessController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/sportPerformance', {
        templateUrl: appModule.Root + '/app/components/sportPerformance/sportPerformanceView.html?v=' + appVersion,
        controller: 'sportPerformanceController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customerPerformance', {
        templateUrl: appModule.Root + '/app/components/customerPerformance/customerPerformanceView.html?v=' + appVersion,
        controller: 'customerPerformanceController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customersPerformance', {
        templateUrl: appModule.Root + '/app/components/customersPerformance/customersPerformanceView.html?v=' + appVersion,
        controller: 'customersPerformanceController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/agentAccess', {
        templateUrl: appModule.Root + '/app/components/agentAccess/agentAccessView.html?v=' + appVersion,
        controller: 'agentAccessController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/scores', {
        templateUrl: appModule.Root + '/app/components/scores/scoresView.html?v=' + appVersion,
        controller: 'scoresController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/holdPercentage', {
        templateUrl: appModule.Root + '/app/components/holdPercentage/holdPercentageView.html?v=' + appVersion,
        controller: 'holdPercentageController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/masterSheet', {
        templateUrl: appModule.Root + '/app/components/masterSheet/masterSheetView.html?v=' + appVersion,
        controller: 'masterSheetController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/insertTransactions', {
        templateUrl: appModule.Root + '/app/components/insertTransaction/insertTransactionView.html?v=' + appVersion,
        controller: 'insertTransactionController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customerCounter', {
        templateUrl: appModule.Root + '/app/components/customerCounter/customerCounterView.html?v=' + appVersion,
        controller: 'customerCounterController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customerCounterClassic', {
        templateUrl: appModule.Root + '/app/components/customerCounter/customerCounterClassicView.html?v=' + appVersion,
        controller: 'customerCounterClassicController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/deletedWagers', {
        templateUrl: appModule.Root + '/app/components/deletedWagers/deletedWagersView.html?v=' + appVersion,
        controller: 'deletedWagersController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/distribution', {
        templateUrl: appModule.Root + '/app/components/distribution/distributionView.html?v=' + appVersion,
        controller: 'distributionController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/lencashier', {
        templateUrl: appModule.Root + '/app/components/integrations/LENCashier.html?v=' + appVersion,
        controller: 'sysIntegrationController',
        reloadOnSearch: true
      }).
      when('/gradedWagers', {
        templateUrl: appModule.Root + '/app/components/gradedWagers/gradedWagersView.html?v=' + appVersion,
        controller: 'gradedWagersController',
        reloadOnSearch: true
      }).
      when('/customer', {
        templateUrl: appModule.Root + '/app/components/customer/customerView.html?v=' + appVersion,
        controller: 'customerController',
        reloadOnSearch: true
      }).
      when('/addCustomer', {
        templateUrl: appModule.Root + '/app/components/customer/batchCustomer.html?v=' + appVersion,
        controller: 'addCustomerController',
        reloadOnSearch: true
      }).
      when('/customerAnalytics', {
        templateUrl: appModule.Root + '/app/components/customers/customerAnalytics.html?v=' + appVersion,
        controller: 'customerAnalyticsController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/addAgent', {
        templateUrl: appModule.Root + '/app/components/agent/batchAgent.html?v=' + appVersion,
        controller: 'addAgentController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/agentManager', {
        templateUrl: appModule.Root + '/app/components/agent/agentView.html?v=' + appVersion,
        controller: 'agentController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customerIPGlobalCompare', {
        templateUrl: appModule.Root + '/app/components/customerIPGlobalCompare/customerIPGlobalCompareView.html?v=' + appVersion,
        controller: 'customerIPGlobalCompareController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customerMap', {
        templateUrl: appModule.Root + '/app/components/customerMap/customerMapView.html?v=' + appVersion,
        controller: 'customerMapController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/moveCustomers', {
        templateUrl: appModule.Root + '/app/components/agent/moveCustomers.html?v=' + appVersion,
        controller: 'agentController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/rules', {
        templateUrl: appModule.Root + '/app/components/cms/cmsGenericView.html?v=' + appVersion,
        controller: 'cmsController',
        controllerAs: 'vm',
        cmsPageId: 13,
        reloadOnSearch: false
      }).
      when('/ticketWriter', {
        templateUrl: appModule.Root + '/app/components/ticketWriter/ticketWriterView.html?v=' + appVersion,
        controller: 'ticketWriterController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/viewLines', {
        templateUrl: appModule.Root + '/app/components/viewLines/viewLinesView.html?v=' + appVersion,
        controller: 'viewLinesController',
        controllerAs: 'vlines',
        reloadOnSearch: false
      }).
      when('/vigLimits', {
        templateUrl: appModule.Root + '/app/components/vigLimits/vigLimitsView.html?v=' + appVersion,
        controller: 'vigLimitsController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/contestExposure', {
        templateUrl: appModule.Root + '/app/components/contestExposure/contestExposureView.html?v=' + appVersion,
        controller: 'contestExposureController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customerMessages', {
        templateUrl: appModule.Root + '/app/components/customerMessages/customerMessagesView.html?v=' + appVersion,
        controller: 'customerMessagesController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/transactionsHistory', {
        templateUrl: appModule.Root + '/app/components/transactionsHistory/transactionsHistoryView.html?v=' + appVersion,
        controller: 'transactionsHistoryController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/beatTheLine', {
        templateUrl: appModule.Root + '/app/components/beatTheLine/beatTheLineView.html?v=' + appVersion,
        controller: 'beatTheLineController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/freePlayTransactions', {
        templateUrl: appModule.Root + '/app/components/freePlayTransactions/freePlayTransactionsView.html?v=' + appVersion,
        controller: 'freePlayTransactionsController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/noActivityPlayer', {
        templateUrl: appModule.Root + '/app/components/noActivityPlayer/noActivityPlayerView.html?v=' + appVersion,
        controller: 'noActivityPlayerController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/customersTotals', {
        templateUrl: appModule.Root + '/app/components/customersTotals/customersTotalsView.html?v=' + appVersion,
        controller: 'customersTotalsController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/performanceCustomer', {
        templateUrl: appModule.Root + '/app/components/performanceCustomer/performanceCustomerView.html?v=' + appVersion,
        controller: 'performanceCustomerController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/trackierLogin/', {
        templateUrl: appModule.Root + '/app/components/integrations/trackier.html?v=' + appVersion,
        controller: 'trackierController',
        reloadOnSearch: true
      }).
      when('/campaignManager/', {
        templateUrl: appModule.Root + '/app/components/campaignManager/campaignManagerView.html?v=' + appVersion,
        controller: 'campaignManagerController',
        controllerAs: 'vm',
        reloadOnSearch: true
      }).
      when('/campaignCustomers/', {
        templateUrl: appModule.Root + '/app/components/campaignCustomers/campaignCustomersView.html?v=' + appVersion,
        controller: 'campaignCustomersController',
        controllerAs: 'vm',
        reloadOnSearch: true
      }).
      when('/mtLimitsManager', {
        templateUrl: appModule.Root + '/app/components/mtLimitsManager/mtLimitsManagerView.html?v=' + appVersion,
        controller: 'mtLimitsManagerController',
        controllerAs: 'vm',
        reloadOnSearch: false
      }).
      when('/intCashier', {
        templateUrl: appModule.Root + '/app/components/integrations/intCashier.html?v=' + appVersion,
        controller: 'sysIntegrationController',
        reloadOnSearch: true
      }).
      when('/nowpayments', {
        templateUrl: appModule.Root + '/app/components/integrations/NowPayments.html?v=' + appVersion,
        controller: 'sysIntegrationController',
        reloadOnSearch: true
      }).
      when('/possibleBots/', {
        templateUrl: appModule.Root + '/app/components/possibleBots/possibleBotsView.html?v=' + appVersion,
        controller: 'possibleBotsController',
        controllerAs: 'vm',
        reloadOnSearch: true
      }).
      otherwise({
        redirectTo: appModule.Root
      });

    String.prototype.RemoveSpecials = function () {
      return this.replace(/[^\w\s]/gi, '').split(' ').join('_');
    };
  }]);

function displayTooltips() {
  setTimeout(function () {
    jQuery('[data-toggle="tooltip"]').tooltip();
  }, 1000);
}

jQuery.noConflict();


(function ($) {
  $.fn.hasScrollBar = function () {
    return this.get(0).scrollHeight > this.get(0).clientHeight;
  };

  //prevents pinch zoom ()
  /*document.addEventListener('touchmove', function (event) {
    if (event.scale !== 1 && event.touches && event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });*/


})(jQuery);
