appModule.controller("posibleBotsController", [
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
          target: 2
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
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Customer ID')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Hits')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<span> ${full.CustomerID}</span>`;
        case 1:
          return `<span>${full.Hits}</span>`;
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
      let params = { agentId: $rootScope.selectedAgent.AgentId, count: 1000 }
      $agentService.PosibleBots(params).then(function (response) {
        if (response.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        vm.dtOptions.withOption('aaData', response);       
      });
    }

    $scope.Init();
  }
]);

