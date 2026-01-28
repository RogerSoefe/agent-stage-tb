appModule.directive('performancecolumns', ['$rootScope', '$agentService', function ($rootScope, $agentService) {
  return {
    restrict: 'AEC',
    scope: {
      customerId: '=',
      version: '=',
      allAgentsList: '=', 
      mode: '=',
      IsMobile: '=isMobile',
      isCustomer: '='
    },
    controller: ['$scope', '$rootScope', '$compile', '$translatorService', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $rootScope, $compile, $translatorService, DTOptionsBuilder, DTColumnDefBuilder) {
      let firstLoad = true;
      $scope.Translate = $translatorService.Translate;
      $scope.LoadingReportData = false;

      $scope.AgentID = null;
      $scope.AgentFilter = null;

      $scope.ReportFilters = {
        PeriodRange: 'W',
        WagerType: ''
      };

      $scope.wagerTypeChanged = function () {
        switch ($scope.ReportFilters.WagerType) {
          case 'S':
          case 'P':
          case 'T':
          case 'I':
          case '':
            return $scope.GetAgentPerformance();
        }
        }

        $scope.DisplayMyNumberColumn = function (n, type) {
            return $scope.$parent['DisplayMyNumberColumn'].apply(null, [n]);
        };

      $scope.DisplayMyNumber = function (n) {
        switch ($scope.ReportFilters.WagerType) {
          case 'S':
          case 'P':
          case 'T':
          case 'I':
          case '':
            return $scope.$parent['DisplayMyNumber'].apply(null, [n.Net]);
            case 'VC':
                $scope.Total = $scope.AgentPerformance.reduce((a, b) => ({ Necasinot: a.casino + b.casino })).casino;
                return $scope.$parent['DisplayMyNumber'].apply(null, [n.casino]);
            case 'LC':
                $scope.Total = $scope.AgentPerformance.reduce((a, b) => ({ livecasino: a.livecasino + b.livecasino })).livecasino;
                return $scope.$parent['DisplayMyNumber'].apply(null, [n.livecasino]);
            case 'UL':
                $scope.Total = $scope.AgentPerformance.reduce((a, b) => ({ ultimatelive: a.ultimatelive + b.ultimatelive })).ultimatelive;
                return $scope.$parent['DisplayMyNumber'].apply(null, [n.ultimatelive]);
            case 'ML':
                $scope.Total = $scope.AgentPerformance.reduce((a, b) => ({ ezlive: a.ezlive + b.ezlive })).ezlive;
                return $scope.$parent['DisplayMyNumber'].apply(null, [n.ezlive]);
            case 'H':
                $scope.Total = $scope.AgentPerformance.reduce((a, b) => ({ horses: a.horses + b.horses })).horses;
                return $scope.$parent['DisplayMyNumber'].apply(null, [n.horses]);
            case 'H':
                $scope.Total = $scope.AgentPerformance.reduce((a, b) => ({ horses: a.horses + b.horses })).horses;
                return $scope.$parent['DisplayMyNumber'].apply(null, [n.horses]);
        }
      };

      async function Init() {
        $scope.WeeksRange = $agentService.GetWeeksRange();
        $scope.SelectedWeekNumber = $scope.WeeksRange[0];
        $scope.PeriodRange = 'W';
        $scope.ReportFilters.Agent = $scope.allAgentsList ? $scope.allAgentsList[0] : null;
        if ($scope.customerId) {
          $scope.GetAgentPerformance('W', $scope.customerId.trim());
        }
        else $scope.GetAgentPerformance(null, null);
        $scope.UserTotal = 0;
        if ($scope.mode != 'dual') return;
        await getSports();
        //if ($scope.ReportFilters.Agent)  $scope.getData();

        
      };


      $rootScope.$on('AgentAsCutomerInfoLoaded', function () {
        $scope.AgentAsCustomerInfo = $agentService.AgentAsCustomerInfo;
      });

      $scope.GetAgentPerformance = function (range, customerId) {
        if ($scope.customerId) customerId = $scope.customerId;
        if (typeof customerId === "undefined") customerId = null;
        if (range) $scope.ReportFilters.PeriodRange = range;
        $scope.LoadingReportData = true;
        //$(".tablesaw-bar").remove();
          $agentService.GetAgentPerformanceInColumns({ period: $scope.ReportFilters.PeriodRange, wagerType: null, customerId: customerId }).then(function (result) {
          $scope.AgentPerformance = result.data.d.Data;
          $scope.Total = $scope.AgentPerformance.reduce((a, b) => ({ Net: a.Net + b.Net })).Net;
          setTimeout(function () {
            $scope.LoadingReportData = false;
            if (!$rootScope.IsMobile) {
              CommonFunctions.PrepareTable('performanceTbl');
              if (!$scope.customerId)
                setTimeout(function () {
                  jQuery('table.tablesaw').fixedHeader({
                    topOffset: 65
                  });
                }, 1200);
            }

          });
        });
      };

      $scope.DisplayPeriod = function (period) {
        return $agentService.DisplayPeriod($scope.ReportFilters.PeriodRange, period);
      };

      $scope.AddToTotal = function (e, ap, winloss) {
        if (winloss == "W") ap.WonSelected = !ap.WonSelected;
        else ap.LostSelected = !ap.LostSelected;
        $scope.UserTotal = $agentService.GetPerformanceTotal($scope.AgentPerformance);
      };

     
      $scope.GetPeriod = function (period) {
        switch (period) {
          case 'D':
            return $scope.Translate('Daily');
          case 'W':
            return $scope.Translate('Weekly');
          case 'M':
            return $scope.Translate('Monthly');
          case 'Y':
            return $scope.Translate('Yearly');
        }
        return null;
      };
      if ($agentService.AgentAsCustomerInfo)
        $scope.AgentAsCustomerInfo = $agentService.AgentAsCustomerInfo;

      $scope.exportData = function () {
        const fileName = 'Performance';
        const exportType = 'xls'
        window.exportFromJSON({ data: $scope.AgentPerformance.map((x) => ({ Period: x.period, Loss: x.Lost, Won: x.Won, Net: x.Net })), fileName, exportType });
        Swal.fire(
          $scope.Translate('Data exported'),
          '',
          'success'
        );
      }


      $scope.$watch('customerId', function (customerId) {
        $scope.customerId = customerId;
        Init();
      });

      /**************/////////////



      $scope.dtInstance = {};
      $scope.dtOptions = DTOptionsBuilder.newOptions()
        //.withOption('stateSave', true)
        .withOption('aaData', {})
        .withOption('createdRow', function (row) {
          // Recompiling so we can bind Angular directive to the DT
          $compile(angular.element(row).contents())($scope);
        })
        .withOption('initComplete', function (settings) {
          // Recompiling so we can bind Angular directive to the DT
          $compile(angular.element('#' + settings.sTableId).contents())($scope);
          jQuery('.dt-buttons').find('a').tooltip();
          jQuery('#' + settings.sTableId + ' tbody').on('click', 'tr td', function (e) {
            if (jQuery(e.target).closest('span').length == 0) {
              $compile(angular.element('#' + settings.sTableId).contents())($scope);
              return;
            }
            jQuery(this).click();
          });
        })
        .withOption('responsive', {
          details: {
            type: 'column',
            target: 4
          }
        })
        .withOption('aaSorting', [])
        .withOption('lengthMenu', [[20, 35, 50, 100], [20, 35, 50, 100]])
        .withOption('pageLength', 100)
        .withOption('lengthChange', false)
        .withOption('bInfo', false)
        .withOption('paging', false)

      $scope.dtColumnDefs = [
        DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Period')).renderWith(render),
        DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Won')).renderWith(render),
        DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Lost')).renderWith(render),
          DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Net')).renderWith(render),
          DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('StraightBet')).renderWith(render),
        DTColumnDefBuilder.newColumnDef(4).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
      ];

      function render(data, type, full, meta) {
        switch (meta.col) {
          case 0:
            return full.period;
          case 1:
            return CommonFunctions.FormatNumber(full.Won, false);
          case 2:
            return CommonFunctions.FormatNumber(full.Lost, false);
          case 3:
                return CommonFunctions.FormatNumber(full.Net, false);
            case 9:
                return CommonFunctions.FormatNumber(full.StraightBet, false);   
          default:
            return '';
        }
      }

      $scope.getData = function (dateRanges = {}) {
        let params = { period: $scope.PeriodRange, sport: $scope.SelectedSport.SportType, subSport: $scope.selectedSubSport.SportSubType, agentId: $scope.customerId, isAgent: false }
        if ($scope.performance_type == 'all') {
          params = { customerId: $scope.customerId, period: dateRanges.startDate ? 'C' : $scope.PeriodRange, customRangeStartingDate: dateRanges.startDate || null, customRangeEndingDate: dateRanges.endDate || null }
            debugger;
            $agentService.GetAgentPerformanceInColumns(params).then(function (response) {
            if (response.length == 0) {
              $scope.dtOptions.withOption('aaData', {});
              return;
            }
            $scope.dtOptions.withOption('aaData', response);
          });
        } else {
          $agentService.GetPerformanceBySport(params).then(function (response) {
            if (response.data.d.Data.length == 0) {
              $scope.dtOptions.withOption('aaData', {});
              return;
            }
            $scope.dtOptions.withOption('aaData', response.data.d.Data);
          });
        }
      }

      function cb(start, end) {
        currentPage = 0;
        $scope.PeriodRange = null;
        globalStart = start.format('MM/DD/YYYY'); globalEnd = end.format('MM/DD/YYYY');
        const dateRanges = { startDate: start.format('MM/DD/YYYY'), endDate: end.format('MM/DD/YYYY')};
        if (firstLoad == false) $scope.getData(dateRanges);
        firstLoad = false;
        jQuery('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        start.format('MMMM D, YYYY');
      }

      cb(moment().subtract(90, 'days'), moment());
      jQuery('#reportrange').daterangepicker({
        locale: {
          firstDay: 1
        },
        startDate: moment().subtract(720, 'days'),
        ranges: {
          'Today': [moment(), moment()],
          'Yesterday': [moment().subtract(1, 'days'), moment()],
          'Last 7 Days': [moment().subtract(6, 'days'), moment()],
          'Last 30 Days': [moment().subtract(29, 'days'), moment()],
          'Last 90 Days': [moment().subtract(89, 'days'), moment()],
        }
      }, cb);

      async function getSports() {
        $scope.Sports = [];
        let sports = (await $agentService.GetSports());
        $scope.Sports = sports;
        $scope.SelectedSport = $scope.Sports[0];
        await getSubSports();

      }

      const getSubSports = async function () {
        $scope.subSports = (await $agentService.GetSubSportTypesBySportType($scope.SelectedSport.SportType)).data.d.Data;
        $scope.selectedSubSport = $scope.subSports[$scope.subSports.findIndex(x => x.SportSubType == 'All')];
      }

      const sportChanged = async function () {
        await getSubSports();
        $scope.getData();
      }

      $scope.getSubSports = getSubSports;
      $scope.sportChanged = sportChanged;


    }],
      templateUrl: appModule.Root + '/app/directives/performance/performancecolumns.html?v=2'
  };


}]);