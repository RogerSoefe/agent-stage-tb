appModule.controller("customersTotalsController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    $scope.selection = {};
    let vm = this, groupedData= [];
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
          target: 8
        }
      })
      .withDOM('Bflrtip')
      .withOption('drawCallback', function (setting) {
        if (!groupedData) return;
        let subTable = groupedData.slice(setting._iDisplayStart, groupedData.length);
        var api = this.api();
        var rows = api.rows({ page: 'current' }).nodes();
        var last = null;
        subTable.forEach(function (group, i) {
          if (last != group.AgentID.trim()) {
            jQuery(rows).eq(i).before(
              `<tr class="bg-gray"><td colspan="8">
										<strong class="text-white">${($scope.rawAgentsList ? group.AgentID : $scope.formatCustomer(group.AgentID))}</strong></td></tr>`
            );
            last = group.AgentID.trim();
          }
        });
      })
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
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Last Wager')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Total Wagers')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Win')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Lost')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Net')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('C. Balance')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(7).withTitle($scope.Translate('Currency Code')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(8).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return full.CustomerID;
        case 1:
          return full.LastWagerString;
        case 2:
          return full.TotalWagers;
        case 3:
          return `<span class='num_pos'>${CommonFunctions.FormatNumber(full.Win, false)}</span>`;
        case 4:
          return `<span class='num_neg'>${CommonFunctions.FormatNumber(full.Lose, false)}</span>`;
        case 5:
          return `<span class='${full.Net >= 0 ? 'num_pos' : 'num_neg'}'>${CommonFunctions.FormatNumber(full.Net, false)}</span>`;
        case 6:
          return `<span class='${full.Net >= 0 ? 'num_pos' : 'num_neg'}'>${CommonFunctions.FormatNumber(full.CurrentBalance, false)}</span>`;
        case 7:
          return full.CurrencyCode;
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
        agentId: $rootScope.selectedAgent.AgentId, initialDate: $scope.Filters.startDate, finalDate: $scope.Filters.endDate
      }
      $agentService.GetPlayerTotals(params).then(function (response) {
        if (response.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        groupedData = response;
        vm.dtOptions.withOption('aaData', response);
      });
    }

    Init();
  }
]);

