appModule.controller("sportPerformanceController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
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
          target: 4
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
			DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Period')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Won')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Lost')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Net')).renderWith(render),
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
        default:
          return '';
      }
    }

    async function Init() {
      $scope.WeeksRange = $agentService.GetWeeksRange();
      $scope.SelectedWeekNumber = $scope.WeeksRange[0];
      $scope.PeriodRange = 'W';
      await getSports();
      if ($rootScope.selectedAgent) {
        $scope.getData();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.getData();
        });
      }
    };

    $scope.getData = function () {
			let params = { period: $scope.PeriodRange, sport: $scope.SelectedSport.SportType, subSport: $scope.selectedSubSport.SportSubType, agentId: $rootScope.selectedAgent.AgentId, isAgent : true }
      $agentService.GetPerformanceBySport(params).then(function (response) {
        if (response.data.d.Data.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        vm.dtOptions.withOption('aaData', response.data.d.Data);
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

