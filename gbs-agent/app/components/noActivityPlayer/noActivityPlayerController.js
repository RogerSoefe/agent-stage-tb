appModule.controller("noActivityPlayerController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    let vm = this;
    let groupedData = null;
    $scope.WeeksRange = [];
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
          target: 3
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
              `<tr class="bg-gray"><td colspan="3">
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

    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Customer ID')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Last Bet')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Status')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<a href="" class="customer-table-button"> ${full.CustomerID}</a>`;
        case 1:
          return `<span>${full.LatestBetString}</span>`;
        case 2:
          return `<span>${full.Suspended == 'Y' ? 'Inactive' : 'Active'}</span>`;
        default:
          return '';
      }
    }

    $scope.Init = function () {
      for (let i = 1; i < 100; i++) {
        $scope.WeeksRange.push({ label: `${i} Days back`, Index: i-1 })
        $scope.SelectedWeekNumber = $scope.WeeksRange[31];
      }
      $scope.PlayerStatus = [{ label: 'All', status: 'All' }, { label: 'Active', status: 'Y' }, { label: 'Inactive', status: 'N' }];
      $scope.SelectedPlayersStatus = $scope.PlayerStatus[0];
      if ($rootScope.selectedAgent) {
        $scope.getData();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.getData();
        });
      }
    };

    jQuery('#modalDialog').on('hidden.bs.modal', function () {
      $scope.getData();
    })

    $scope.getData = function () {
      let params = { agentId: $rootScope.selectedAgent.AgentId, daysBack: $scope.SelectedWeekNumber.Index - 1 }
      $agentService.GetNoActivyPlayerByAgent(params).then(function (response) {
        if (response.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        groupedData = response;
        vm.dtOptions.withOption('aaData', groupedData);
      });
    }

    $scope.filterData = function () {
      vm.dtOptions.withOption('aaData', groupedData.filter(x => x.Suspended == $scope.SelectedPlayersStatus.status || $scope.SelectedPlayersStatus.Suspended == 'All'));
    }

    $scope.Init();
  }
]);

