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


appModule
  /**
   * Generic Search Directive
   * Encapsulates all search logic and UI
   */
  .directive('genericSearchSheet', [function() {
    return {
      restrict: 'E',
      scope: true,
      templateUrl: function() {
        return appModule.Root + '/app/components/directives/generic-search-bottomsheet.html?v=' + (window.appVersion || '');
      },
      link: function(scope, element, attrs) {
        // Initialize search state (dot rule pattern)
        scope.searchState = { term: '' };
        
        // Get display text for an item
        scope.getDisplayText = function(item) {
          if (!item) return '';
          
          var config = scope.data && scope.data.searchConfig;
          if (!config) {
            console.warn('genericSearchSheet: searchConfig not found in scope.data');
            return '';
          }
          
          var displayField = config.displayField;
          if (!displayField) {
            console.warn('genericSearchSheet: displayField not configured');
            return '';
          }
          
          // If displayField is a function, call it
          if (typeof displayField === 'function') {
            return displayField(item);
          }
          
          // If displayField is a string, get that property
          var result = item[displayField];
          if (!result) {
            console.log('genericSearchSheet: item[' + displayField + '] is empty, item:', item);
          }
          return result || '';
        };
        
        // Select an item and close the sheet
        scope.selectItem = function(item) {
          scope.close(item);
        };
        
        // Clear search term
        scope.clearSearch = function() {
          scope.searchState.term = '';
        };
      }
    };
  }])

  /**
   * Generic Search Service
   * Provides a reusable search interface that can be used across different data types
   */
  .factory('genericSearchService', ['bottomSheet', '$q', function (bottomSheet, $q) {
    return {
      open: function(config) {
        if (!config || !config.items) {
          console.error('genericSearchService: items array is required');
          return $q.reject('Items array is required');
        }

        if (!config.displayField) {
          console.error('genericSearchService: displayField is required');
          return $q.reject('displayField is required');
        }

        // Pre-calculate data if provided
        if (config.preCalculate && typeof config.preCalculate === 'function') {
          config.preCalculate();
        }

        // Create parent scope if provided
        var parentScope = config.parentScope;
        
        return bottomSheet.open({
          parentScope: parentScope,
          template: '<generic-search-sheet></generic-search-sheet>',
          size: 'full',
          disableHandle: true,
          autoExpandFull: true,
          data: {
            searchConfig: config
          },
          onBeforeClose: function(sheetScope, result) {
            // Call onSelect callback if provided and result exists
            if (result && config.onSelect && typeof config.onSelect === 'function') {
              config.onSelect(result);
            }
          }
        });
      }
    };
  }])

  .factory('bottomSheet', ['$rootScope', '$compile', '$timeout', '$q', '$http', '$templateCache', function ($rootScope, $compile, $timeout, $q, $http, $templateCache) {
    var current = null;

    return {
      open: function (config) {
        var deferred = $q.defer();
        if (current) current.remove();

        // Permitir heredar scope si se pasa parentScope (acceso a funciones/controladores existentes)
        var scope = config && config.parentScope ? config.parentScope.$new() : $rootScope.$new(true);
        // Direct assignment instead of copy to support functions and complex objects
        scope.data = config.data || {};

        // Carga templateUrl o usa inline
        var templatePromise = config.templateUrl ? $http.get(config.templateUrl, { cache: $templateCache }) : $q.when({ data: config.template || '' });

        templatePromise.then(function (resp) {
          var templateHtml = resp.data;
          var content = $compile(templateHtml)(scope);

          var overlay = jQuery(
            '<div class="bottom-sheet-overlay">' +
            '<div class="bottom-sheet normal">' +
            (config && config.disableHandle ? '' : '<div class="sheet-handle" aria-label="Drag to expand"><span class="expand-icon"><i class="fas fa-chevron-up"></i></span></div>') +
            '<div class="sheet-body"></div>' +
            (config.actions ? '<div class="sheet-actions"></div>' : '') +
            '</div>' +
            '</div>'
          );

          overlay.find('.sheet-body').append(content);

          var sheet = overlay.find('.bottom-sheet');

          // Resolve initial height (config.initialHeight or config.size mapping)
          var resolvedHeight = '40vh'; // default fallback
          if (config) {
            if (config.initialHeight) {
              resolvedHeight = config.initialHeight;
            } else if (config.size) {
              switch (config.size) {
                case 'compact': resolvedHeight = '20vh'; break; // reduced per UX feedback
                case 'medium': resolvedHeight = '55vh'; break;
                case 'large': resolvedHeight = '80vh'; break;
                case 'full': resolvedHeight = '100vh'; break;
              }
            }
          }
          sheet.css('--bs-initial-height', resolvedHeight);

          // Override header offset variable per open if provided (dynamic gap at top)
          if (config && config.headerOffset) {
            document.documentElement.style.setProperty('--bs-header-offset', config.headerOffset);
          }

          // Define closeSheet inside this closure so scope.close can access sheet/current
          function closeSheet(result) {
            // Broadcast collapse to show chat again
            try { $rootScope.$broadcast('fab:collapsed'); } catch (e) { }
            // Custom bottom sheet closed event
            try { $rootScope.$broadcast('bottomSheet:closed', { result: result }); } catch (e2) { }
            sheet.css('transform', 'translateY(100%)');
            $timeout(function () { if (current) current.remove(); deferred.resolve(result); }, 400);
          }
          // Listen for programmatic expand requests (e.g., search focus) and apply native expansion
          var expandOff = $rootScope.$on('bottomSheet:expandRequested', function () {
            // If already expanded do nothing
            if (sheet.hasClass('full-height')) return;
            // Clear any inline height so class rule takes effect
            sheet[0].style.removeProperty('height');
            sheet.addClass('full-height');
          });
          // Listen for programmatic collapse requests (e.g., clear search) and revert to initial height
          var collapseOff = $rootScope.$on('bottomSheet:collapseRequested', function () {
            if (!sheet.hasClass('full-height')) return; // Not expanded
            sheet.removeClass('full-height');
            sheet[0].style.removeProperty('height');
            try { $rootScope.$broadcast('bottomSheet:collapsed'); } catch (e) { }
          });
          // Expose close on scope after closeSheet defined
          scope.close = function (result) {
            if (config && config.onBeforeClose) { config.onBeforeClose(scope, result); }
            closeSheet(result);
          };

          if (config.actions) {
            config.actions.forEach(function (a) {
              var clase = a.primary ? 'filled' : 'text';
              var btn = jQuery('<button class="action-btn ' + clase + '">' + a.label + '</button>');
              btn.on('click', function () { scope.$apply(function () { scope.close(a.value); }); });
              overlay.find('.sheet-actions').append(btn);
            });
          }
          jQuery('body').append(overlay).addClass('bottom-sheet-open');
          // Broadcast expand to hide chat (reuse existing listener)
          try { $rootScope.$broadcast('fab:expanded'); } catch (e) { }
          // Custom bottom sheet opened event
          try { $rootScope.$broadcast('bottomSheet:opened', { config: config }); } catch (e2) { }
          $timeout(function () { sheet.css('transform', 'translateY(0)'); }, 50);

          // Auto expand to full-height if requested and not already full
          if (config && config.autoExpandFull) {
            $timeout(function () {
              if (!sheet.hasClass('full-height')) {
                sheet[0].style.removeProperty('height');
                sheet.addClass('full-height');
              }
            }, 120);
          }

          // Drag simplificado: sólo dos estados (compacto y expandido)
          var startY = 0, dragging = false, totalDelta = 0;
          var headerOffset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bs-header-offset')) || 60;
          var compactTarget = parseFloat(resolvedHeight); // normalmente 20
          var expandHeight = 'full-height';
          var thresholdExpand = 40; // px hacia arriba para expandir
          var thresholdCollapse = -40; // px hacia abajo para colapsar desde expandido
          var thresholdClose = -60; // px hacia abajo para cerrar si ya está compacto
          overlay.find('.sheet-handle')
            .on('mousedown touchstart', function (e) {
              dragging = true;
              startY = e.pageY || e.originalEvent.touches[0].pageY;
              sheet.addClass('dragging');
              e.preventDefault();
            });

          jQuery(document)
            .on('mousemove.bottomsheet touchmove.bottomsheet', function (e) {
              if (!dragging) return;
              var pageY = e.pageY || e.originalEvent.touches[0].pageY;
              var delta = startY - pageY; // positivo: arrastre hacia arriba, negativo: hacia abajo
              totalDelta = delta;
              // No cambiamos la altura en movimiento para evitar estados intermedios
            })
            .on('mouseup.bottomsheet touchend.bottomsheet', function () {
              if (!dragging) return;
              dragging = false;
              sheet.removeClass('dragging');
              var expanded = sheet.hasClass('full-height');
              // Si está expandido y se arrastra hacia abajo lo suficiente -> colapsar
              if (expanded && totalDelta < thresholdCollapse) {
                sheet.removeClass('full-height');
                // Remove any inline height so the original CSS var (--bs-initial-height) applies uniformly
                sheet[0].style.removeProperty('height');
                sheet.css('border-radius', 'var(--md-sys-shape-corner-extra-large,28px) var(--md-sys-shape-corner-extra-large,28px) 0 0');
                return;
              }
              // Si está compacto y se arrastra hacia arriba lo suficiente -> expandir
              if (!expanded && totalDelta > thresholdExpand) {
                // Expand: rely on full-height class; clear inline height in case estaba seteada
                sheet[0].style.removeProperty('height');
                sheet.addClass('full-height');
                return;
              }
              // Si está compacto y se arrastra hacia abajo fuerte -> cerrar
              if (!expanded && totalDelta < thresholdClose) {
                scope.$apply(function () { scope.close('drag-close'); });
                return;
              }
              // Sin cambio si no supera umbrales
            });

          overlay.on('click', function (e) { if (e.target === overlay[0]) scope.close('backdrop'); });

          // Escape key para cerrar
          jQuery(document).on('keyup.bottomsheet', function (e) { if (e.key === 'Escape') { scope.$apply(function () { scope.close('escape'); }); } });

          // Enfoque inicial si existe input
          $timeout(function () {
            var firstInput = overlay.find('input, select, textarea').first();
            if (firstInput && firstInput.length) { firstInput.focus(); }
          }, 150);

          current = {
            remove: function () {
              jQuery('body').removeClass('bottom-sheet-open');
              overlay.remove();
              scope.$destroy();
              jQuery(document).off('.bottomsheet');
              try { expandOff && expandOff(); } catch (e) { }
              try { collapseOff && collapseOff(); } catch (e) { }
              current = null;
            }
          };
        });

        return deferred.promise;
      }
    };
  }]);

angular.module('myApp', ['cr.bottomSheet'])
  .controller('DemoCtrl', ['$scope', 'bottomSheet', function ($scope, bottomSheet) {
    $scope.abrirEditar = function () {
      bottomSheet.open({
        templateUrl: 'templates/editarCliente.html',   // ← Aquí carga el archivo externo
        data: { cliente: { nombre: 'Roger Rojas', telefono: '87307957', email: 'rogerrojasramirez@gmail.com' } },
        actions: [
          { label: 'Cancelar', value: 'cancel' },
          { label: 'Guardar', value: 'save', primary: true }
        ]
      }).then(res => console.log('Resultado:', res));
    };

    $scope.abrirConfirm = () => bottomSheet.open({ templateUrl: 'templates/confirm-delete.html', actions: [{ label: 'No' }, { label: 'Sí, eliminar', primary: true, value: 'ok' }] });
    $scope.abrirLista = () => bottomSheet.open({ templateUrl: 'templates/lista-productos.html' });
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
