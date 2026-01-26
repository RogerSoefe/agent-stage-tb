appModule.controller("customersPerformanceController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    $scope.selection = {};
    let vm = this;
    vm.dtInstance = {};
    vm.dtOptions = DTOptionsBuilder.newOptions()
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
          target: 7
        }
      })
      .withDOM('Bflrtip')
      .withOption('buttons', [
        { extend: 'copy', text: 'Copy' },
        { extend: 'excel', text: 'XLS' },
        { extend: 'pdf', text: 'PDF' },
        { extend: 'print', text: 'Print' }
      ])
      .withOption('aaSorting', [])
      .withOption('lengthMenu', [[20, 35, 50, 100], [20, 35, 50, 100]])
      .withOption('pageLength', 100)
      .withOption('lengthChange', false)
      .withOption('bInfo', false)
      .withOption('paging', false)

    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('CustomerId')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Won')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Lost')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Net')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Volume')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Wager Count')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('Average Bet')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(7).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return full.CustomerID;
        case 1:
          return CommonFunctions.FormatNumber(full.Won, false);
        case 2:
          return CommonFunctions.FormatNumber(full.Lost, false);
        case 3:
          return CommonFunctions.FormatNumber(full.Net, false);
        case 4:
          return CommonFunctions.FormatNumber(full.Volume, false);
        case 5:
          return full.WagerCount;
        case 6:
          return CommonFunctions.FormatNumber(full.AverageBet, false);
        default:
          return '';
      }
    }

    let startDate = new Date();
    let endDate = new Date();

    startDate.setDate(startDate.getDate() - 7);
    $scope.Filters = {
      startDate: startDate.toLocaleDateString('en-US'),
      endDate: endDate.toLocaleDateString('en-US'),
    };

    $scope.performance_type = 'agent';

    async function Init() {
      $scope.PeriodRange = 'W';
      jQuery("#startDateInput").daterangepicker({
        locale: {
          firstDay: 1
        },
        singleDatePicker: true,
        showDropdowns: true,
        opens: 'left',
        dateFormat: 'mm/dd/yyyy',
        startDate: moment().subtract(90, 'day'),
      }).on('apply.daterangepicker', function () {
        $scope.getData();
      });
      jQuery("#endDateInput").daterangepicker({
        locale: {
          firstDay: 1
        },
        singleDatePicker: true,
        showDropdowns: true,
        opens: 'left',
        dateFormat: 'mm/dd/yyyy'
      }).on('apply.daterangepicker', function () {
        $scope.getData();
      });
      await getSports();
      if ($rootScope.selectedAgent) {
        $scope.WeeksRange = $agentService.GetWeeksRange();
        $scope.SelectedWeekNumber = $scope.WeeksRange[0];
        $scope.getData();
        getAgentPlayers($rootScope.selectedAgent.AgentId);
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.SelectedWeekNumber = $scope.WeeksRange[0];
          $scope.getData();
          getAgentPlayers($rootScope.selectedAgent.AgentId);
        });
      }
    };
    async function agentChanged() {
      await getAgentPlayers(agentId);
      $scope.getData();
    }
    $scope.agentChanged = agentChanged;

    async function getAgentPlayers(agentId) {
      const result = await ($agentService.GetAgentPlayers(agentId));
      let players = result.data.d.Data;
      if (players) {
        $scope.AgentCustomers = players.map(function (p) {
          return { CustomerId: p, label: p }
        });
        $scope.selectedCustomers = [...$scope.AgentCustomers];
        $scope.selection.customer = $scope.selectedCustomers[0];
      }
    }

    $scope.getData = function () {
      let params = {
        sport: $scope.SelectedSport.SportType, subSport: $scope.selectedSubSport.SportSubType,
        agentId: $rootScope.selectedAgent.AgentId, startDate: $scope.Filters.startDate, endDate: $scope.Filters.endDate
      }
      $agentService.GetCustomersPerformanceByDateRangeAndSport(params).then(function (response) {
        if (response.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        vm.dtOptions.withOption('aaData', response);
      });
    }

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


    Init();
  }
]);

