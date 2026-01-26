appModule.controller("customerAnalyticsController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    let vm = this;
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
          target: 9
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
      .withOption('pageLength', 1000)

    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Customer ID')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Update Date')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Wager Count')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Ranking')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Won Bets')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Lost Bets')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('Accuracy')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(7).withTitle($scope.Translate('Acum AIFigure')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(8).withTitle($scope.Translate('Percent Impact')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(9).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<span> ${full.CustomerID}</span>`;
        case 1:
          return `<span>${CommonFunctions.FormatDateTime(full.LastUpdateDateString, 4)}</span>`;
        case 2:
          return `<span>${full.WagerCount}</span>`;
        case 3:
          return `<span>${full.Ranking}</span>`;
        case 4:
          return `<span>${full.WonBets}</span>`;
        case 5:
          return `<span>${full.LostBets}</span>`;
        case 6:
          return `<b class="${full.Accuracy >= 0 && full.Accuracy < 31 ? 'text-success' : full.Accuracy > 30 && full.Accuracy < 61 ? 'text-warning' : 'text-danger'}">${CommonFunctions.FormatNumber(full.Accuracy, false)}</b>`;
        case 7:
          return `<span>$${CommonFunctions.FormatNumber(full.AcumAIFigure, false)}</span>`;
        case 8:
          return `<span>${full.PercentImpact}</span>`;
        default:
          return '';
      }
    }
	
	        $scope.Filter = {
            startDate: $agentService.GetServerDateTime().toLocaleDateString('en-US'),
            endDate: $agentService.GetServerDateTime().toLocaleDateString('en-US')
        }

    $scope.Init = function () {
      $scope.WeeksRange = $agentService.GetWeeksRange();
      $scope.WeeksRange.shift();
      $scope.SelectedWeekNumber = $scope.WeeksRange[0];
      if ($rootScope.selectedAgent) {
        $scope.getData();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.getData();
        });
      }
	  jQuery("#startDateInput").daterangepicker({
            locale: {
                firstDay: 1
            },
            singleDatePicker: true,
            showDropdowns: true,
            opens: 'left',
            dateFormat: 'mm/dd/yyyy',
            startDate: moment(),
        }).on('apply.daterangepicker', function () {
            //$scope.getData();
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
            //$scope.getData();
        });
    };

    jQuery('#modalDialog').on('hidden.bs.modal', function () {
      $scope.getData();
    })

    $scope.getData = function () {
      let params = { stardDate: $scope.Filter.startDate, endDate: $scope.Filter.endDate, agentId: $rootScope.selectedAgent.AgentId}
      $agentService.GetCustomerAnalytics(params).then(function (response) {
        if (response == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        vm.dtOptions.withOption('aaData', response);

      });
    }

    $scope.Init();
  }
]);

