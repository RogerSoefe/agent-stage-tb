var isMouseDown = false, isHighlighted = false, totalSelected = 0;

appModule.controller("performanceController", ['$rootScope', '$scope', '$agentService', function ($rootScope, $scope, $agentService) {

  if($scope.GetAgentRestriction('AMDGP')) {
    document.location.href = '#/dashboard';
    return;
  }

  $scope.ReportFilters = {
    PeriodRange: 'D',
    WagerType: ''
  };

  $scope.Init = function () {
    $scope.GetAgentPerformance();
    $scope.GetAgentsList();
    $scope.UserTotal = 0;
  };

  $scope.GetAgentPerformance = function (range, agentId) {
    if (typeof agentId === "undefined") agentId = null;
    if (range) $scope.ReportFilters.PeriodRange = range;
    $agentService.GetAgentPerformance($scope.ReportFilters.PeriodRange, $scope.ReportFilters.WagerType, agentId).then(function (result) {
      $scope.AgentPerformance = result.data.d.Data;
      if (!$rootScope.IsMobile)
        CommonFunctions.PrepareTable('performanceTbl');
    });
  };

  $scope.DisplayPeriod = function (period) {
    return $agentService.DisplayPeriod($scope.ReportFilters.PeriodRange, period);
  };

  $scope.AddToTotal = function (e, ap, winloss) {
    if (winloss == "W") ap.WonSelected = !ap.WonSelected;
    else ap.LostSelected = !ap.LostSelected;
    $scope.UserTotal = $agentService.GetPerformanceTotal($scope.AgentPerformance);
  };

  $scope.GetAgentsList = function () {
    $agentService.GetAgentsList().then(function (result) {
      $scope.AgentsList = result.data.d.Data;
    });
  };

  $scope.Init();
}
]);


