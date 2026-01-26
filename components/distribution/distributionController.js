appModule.controller("distributionController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    let vm = this;
    let groupedData = null;
    vm.dtInstance = {};
    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('stateSave', true)
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
      .withOption('drawCallback', function (setting) {
        if (!groupedData) return;
        let subTable = groupedData.slice(setting._iDisplayStart, groupedData.length);
        var api = this.api();
        var rows = api.rows({ page: 'current' }).nodes();
        var last = null;
        subTable.forEach(function (group, i) {
          if (last != group.Hierarchy.trim()) {
            jQuery(rows).eq(i).before(
              `<tr class="bg-gray"><td colspan="10">
										<strong class="text-white">${($scope.rawAgentsList ? group.Hierarchy.substring(2) : $scope.formatCustomer(group.AgentID))}</strong></td></tr>`
            );
            last = group.Hierarchy.trim();
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

    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Agent ID')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Commission Type')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Commission %')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Prev MU')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Gross Week')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Net Amount')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('Commission')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(7).withTitle($scope.Translate('Distribution')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(8).withTitle($scope.Translate('New MU')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(9).withTitle($scope.Translate('MasterAgentID')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(10).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<a href="" class="customer-table-button" ng-click="OpenAgentManager('${full.AgentID}', 2)"> ${full.AgentID}</a>`;
        case 1:
          return `<span>${full.CommissionType == 'P' ? 'Weekly Profit' : full.CommissionType == 'S' ? 'Split' : 'Red Figure' }</span>`;
        case 2:
          return `<span>${full.CommissionPercent}</span>`;
        case 3:
          return `<span class="${full.PrevMakeup < 0 ? 'text-danger' : full.PrevMakeup > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.PrevMakeup, true)}</span>`;
        case 4:
          return `<span class="${full.GrossWeek < 0 ? 'text-danger' : full.GrossWeek > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.GrossWeek, true)}</span>`;
        case 5:
          return `<span class="${full.NetAmount < 0 ? 'text-danger' : full.NetAmount > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.NetAmount ? full.NetAmount : 0, true)}</span>`;
        case 6:
          return `<span class="${full.CommissionAmount < 0 ? 'text-danger' : full.CommissionAmount > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.CommissionAmount, true)}</span>`;
        case 7:
          return `<span class="${full.DistributionAmount < 0 ? 'text-danger' : full.DistributionAmount > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.DistributionAmount, true)}</span>`;
        case 8:
          return `<span class="${full.NewMakeup < 0 ? 'text-danger' : full.NewMakeup > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.NewMakeup, true)}</span>`;
        case 9:
          return `<span> ${full.MasterAgentID}</a>`;
        default:
          return '';
      }
    }

    $scope.Init = function () {
      if ($rootScope.selectedAgent) {
      $scope.WeeksRange = $agentService.GetWeeksRange();
      $scope.WeeksRange.shift();
      $scope.SelectedWeekNumber = $scope.WeeksRange[0];
        $scope.getData();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.WeeksRange.shift();
          $scope.SelectedWeekNumber = $scope.WeeksRange[0];
          $scope.getData();
        });
      }
    };

    jQuery('#modalDialog').on('hidden.bs.modal', function () {
      $scope.getData();
    })

    $scope.getData = function () {
      let params = { agentId: $rootScope.selectedAgent.AgentId, week: $scope.SelectedWeekNumber.Index - 1 }
      $agentService.GetAgentDistribution(params).then(function (response) {
        if (response.data.d.Data.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        groupedData = response.data.d.Data.filter(x => x.DistributionAmount != 0);
        $scope.Summary = {
          DistributionAmount: 0
        }
        if(groupedData.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        vm.dtOptions.withOption('aaData', groupedData);
        $scope.Summary.DistributionAmount = groupedData.find(x => x.AgentID.trim() == $rootScope.selectedAgent.AgentId.trim()).DistributionAmount || 0;
        

      });
    }

    $scope.Init();
  }
]);

