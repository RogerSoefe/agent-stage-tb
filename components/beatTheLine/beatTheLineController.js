appModule.controller("beatTheLineController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    $scope.selection = {};
    let vm = this;
    let tableData = [];
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
          target: 10
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
      .withOption('bInfo', true)
      .withOption('paging', true)

    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('CustomerId')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Ticket')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Place Date')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Type')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Sub Sport')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Game Date')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('Description')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(7).withTitle($scope.Translate('Bet line')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(8).withTitle($scope.Translate('Close Line')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(9).withTitle($scope.Translate('Result')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(10).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return full.CustomerID;
        case 1:
          return full.TicketNumber;
        case 2:
          return full.PostedDateTimeString;
        case 3:
          return `${full.ItemWagerType == 'S' ? 'Spread' : full.ItemWagerType == 'M' ? 'Money Line' : full.ItemWagerType == 'T' ? 'Totals' : 'Team Totals'}`;
        case 4:
          return full.SportSubType
        case 5:
          return full.GameDateTimeString;
        case 6:
          return full.WagerDescription;
        case 7:
          return `${full.WagerOverUnder || ''} ${full.WagerTotalPoints || ''} ${full.WagerSpread || ''} ${full.WagerMoney}`;
        case 8:
          return `${full.WagerOverUnder || ''} ${full.Spread || ''}${full.TeamTotalPoints || ''}${full.TotalPoints || ''} ${full.SpreadAdj || ''}${full.MoneyLine || ''}${full.TeamTotalAdj || ''}${full.TtlPtsAdj || ''}`;
        case 9:
          return `${full.BetterLine == true ? 'Better than closing' : full.SameLine == true ? 'Same than closing' : 'Worst than closing'}`
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

    $scope.wagerTypes = [
      {
        name: 'All',
        code: ''
      },
      {
        name: 'Spread',
        code: 'S'
      },
      {
        name: 'Money Line',
        code: 'M'
      },
      {
        name: 'Totals',
        code: 'T'
      },
      {
        name: 'Team Totals',
        code: 'E'
      },
      {
        name: 'Parlays',
        code: 'P'
      },
    ];

    $scope.lineTypes = [
      {
        name: $scope.Translate('Better than closing line'),
        val: 0
      },
      {
        name: $scope.Translate('Same than closing line'),
        val: 1
      },
      {
        name: $scope.Translate('Worst than closing line'),
        val: 2
      },
      {
        name: $scope.Translate('Display all'),
        val: 3
      },
    ];

    $scope.selectedLineType = $scope.lineTypes[0];

    $scope.selectedWagerType = $scope.wagerTypes[0];

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
        getAgentPlayers($rootScope.selectedAgent.AgentId);
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.SelectedWeekNumber = $scope.WeeksRange[0];
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
        $scope.AgentCustomers = [{ CustomerId: null, label: 'All' }, ...$scope.AgentCustomers];
        $scope.selection.customer = $scope.AgentCustomers[1];
      }
      $scope.getData();
    }

    $scope.GetAgentPlayers = getAgentPlayers;

    $scope.changePlayer = function () {
      if ($scope.selection.customer.label != 'All' && $scope.subSports[0].SportSubType != "All") {
        $scope.subSports.unshift({ SportSubType: "All" });
      } else if ($scope.selection.customer.label == "All") {
        $scope.subSports.shift();
        $scope.subSports.unshift({ SportSubType: "SELECT SPORT" });
      }      
      if ($scope.selection.customer.label != 'All' && $scope.Sports[0].SportType != "All") {
        $scope.Sports.unshift({ SportType: "All" });
      } else if ($scope.selection.customer.label == "All") {
        $scope.Sports.shift();
        $scope.Sports.unshift({ SportType: "SELECT SPORT" });
      }
      $scope.selectedSubSport = $scope.subSports[0];
      $scope.SelectedSport = $scope.Sports[0];
      $scope.getData();
    }    

    $scope.getData = function () {
      if($scope.selectedSubSport.SportSubType == "SELECT SPORT") return;
      let params = {
        customerId: $scope.selection.customer.CustomerId || 'All', wagerType: $scope.selectedWagerType.code,
        sportType: $scope.SelectedSport.SportType, sportSubType: $scope.selectedSubSport.SportSubType,
        agentId: $rootScope.selectedAgent.AgentId, initialDate: $scope.Filters.startDate, finalDate: $scope.Filters.endDate
      }
      $agentService.BeatTheLineReport(params).then(function (response) {
        if (response.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        tableData = response;
        vm.dtOptions.withOption('aaData', tableData.filter(x => ($scope.selectedLineType.val == 3) || (x.BetterLine == true && $scope.selectedLineType.val == 0) || (x.SameLine == true && $scope.selectedLineType.val == 1) || (x.BetterLine == false && x.SameLine == false && $scope.selectedLineType.val == 2)));
      });
    }

    $scope.filterData = function () {
      vm.dtOptions.withOption('aaData', tableData.filter(x => ($scope.selectedLineType.val == 3) || (x.BetterLine == true && $scope.selectedLineType.val == 0) || (x.SameLine == true && $scope.selectedLineType.val == 1) || (x.BetterLine == false && x.SameLine == false && $scope.selectedLineType.val == 2)));
    }

    async function getSports() {
      $scope.Sports = [];
      let sports = (await $agentService.GetSports());
      sports.shift();
      sports.unshift({
        SportType: "ALl",
        TotalSubSports: 0
      })
      $scope.Sports = sports;
      $scope.SelectedSport = $scope.Sports[0];
      await getSubSports();

    }

    const getSubSports = async function () {
      $scope.subSports = (await $agentService.GetSubSportTypesBySportType($scope.SelectedSport.SportType)).data.d.Data;
      if ($scope.subSports.length == 0) {
        $scope.subSports = [{ SportSubType: 'All' }];
        $scope.selectedSubSport = $scope.subSports[0];
      }else{
        $scope.selectedSubSport = $scope.subSports[$scope.subSports.findIndex(x => x.SportSubType == 'All')];
      }
    }

    const sportChanged = async function () {
      await getSubSports();
      $scope.getData();
    }

    
    $scope.searchAsync = function(searchTerm){
      if(!$scope.AgentCustomers) return;
      if(searchTerm)
        return [$scope.AgentCustomers[0], ...$scope.AgentCustomers.filter(x => x.label.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 50)];
      else
        return $scope.AgentCustomers.slice(0, 50);
    }

    $scope.getSubSports = getSubSports;
    $scope.sportChanged = sportChanged;


    Init();
  }
]);