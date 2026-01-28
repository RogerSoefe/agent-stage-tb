appModule.controller('historyController', ['$scope', '$rootScope', '$compile', '$agentService', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $rootScope, $compile, $agentService, DTOptionsBuilder, DTColumnDefBuilder) {
  $scope.LoadingReportData = false;

  $scope.AgentID = null;
  $scope.AgentFilter = null;

  $scope.ReportFilters = {
    PeriodRange: 'W',
    WagerType: ''
  };

  async function Init() {

    $scope.WeeksRange = $agentService.GetWeeksRange();
    $scope.SelectedWeekNumber = $scope.WeeksRange[0];
    $scope.ReportFilters.Agent = $scope.allAgentsList ? $scope.allAgentsList[0] : null;
    await getSports();
    $scope.getData();
  };

  $rootScope.$on('AgentAsCutomerInfoLoaded', function () {
    $scope.AgentAsCustomerInfo = $agentService.AgentAsCustomerInfo;
  });

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
        target: 6
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
    DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Volume')).renderWith(render),
    DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Wagers Count')).renderWith(render),
    DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Averege Bet')).renderWith(render),
    DTColumnDefBuilder.newColumnDef(6).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
  ];

  function render(data, type, full, meta) {
    switch (meta.col) {
      case 0:
        return full.Period;
      case 1:
        return CommonFunctions.FormatNumber(full.Won, false);
      case 2:
        return CommonFunctions.FormatNumber(full.Lost, false);
      case 3:
        return CommonFunctions.FormatNumber(full.Volume, false);
      case 4:
        return full.WagersCount;
      case 5:
        return CommonFunctions.FormatNumber(full.Average, false);
      default:
        return '';
    }
  }

  $scope.getData = function () {
    let params = { customerId: $scope.LookupCustomer.CustomerId, period: $scope.ReportFilters.PeriodRange, sport: $scope.SelectedSport.SportType, subSport: $scope.selectedSubSport.SportType }
    $agentService.GetCustomerPerformanceBySportAndPeriod(params).then(function (response) {
      if (response.data.d.Data.length == 0) {
        $scope.dtOptions.withOption('aaData', {});
        return;
      }
      $scope.dtOptions.withOption('aaData', response.data.d.Data);
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

}]);