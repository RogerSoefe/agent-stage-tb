appModule.controller("customerIPGlobalCompareController", [
  '$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
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
          target: 2
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
      .withOption('lengthMenu', [[100, 500, 1000, 5000], [100, 500, 1000, 5000]])
      .withOption('pageLength', 100)
      .withOption('lengthChange', true)
      .withOption('bInfo', true)
      .withOption('paging', true)

    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('IP Address')).renderWith(render).withOption('width', '10%'),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Accounts')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<span>${full.IPAddress}</span>`;
        case 1:
          return `<div style='width: 300px!important;text-overflow: ellipsis;overflow: hidden;margin:0 auto'><span>${full.Accounts.replace(/\)/g, ')<br>')}</span></div>
                  <button class="btn btn-default" ng-click="showAlert('${full.Accounts}')">${$scope.Translate('See all')}</button>`;
        default:
          return "";
      }
    }

    async function Init() {
      $scope.showLoadingGif('loadingGifCustomerIP');
      if ($rootScope.selectedAgent) {
        $scope.getData();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.selectedAgent = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
          $scope.getData();
        });
      }
    };

    $scope.showAlert = function (msg) {
      let customers = msg.split(',');
      let spans = '<div style="display: grid"';
      customers.forEach(function (c) {
        spans += `<span>${c}</span>`
      })
      Swal.fire(spans + '</div>');
    }

    $scope.getData = function () {
      let params = { agentId: $rootScope.selectedAgent ? $rootScope.selectedAgent.AgentId : $scope.AgentAsCustomerInfo.CustomerID, daysBack: 7 };
      $agentService.GetCustomerIPGlobalCompare(params).then(function (response) {
        if (response.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          $scope.hideLoadingGif('loadingGifCustomerIP');
          return;
        }
        let tableData = response;
        vm.dtOptions.withOption('aaData', tableData);
        $scope.hideLoadingGif('loadingGifCustomerIP');
      });
    }

    Init();
  }
]);

