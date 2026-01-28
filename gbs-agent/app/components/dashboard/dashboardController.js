appModule.controller("dashboardController", [
  '$rootScope', '$scope', '$agentService', function ($rootScope, $scope, $agentService) {
    window.morrisObj = null;
    var amountWagered = 0;
    var WagerType = '';
    $scope.CurrentBalance = 0;
    $scope.ReportFilters = {};
    $scope.Init = function () {
      document.getElementById("body_bg").classList.add('dashboard');
      document.getElementById("containerFluid").classList.remove('container-fluid', 'xyz');
      if (!$scope.gridMode.isGrid) {

        if ($scope.AgentAsCustomerInfo) {
          loadFilter();
          $scope.UpdateChart($scope.currentAgentDashboard.AgentInfo);
        }
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          loadFilter();
          $scope.UpdateChart($scope.currentAgentDashboard.AgentInfo);
        })
      }
    };

    function loadFilter() {
      $scope.currentAgentDashboard.AgentAsCustomerInfo = $scope.AgentAsCustomerInfo;
      $scope.currentAgentDashboard.AgentInfo = $scope.AgentInfo;
      $scope.ReportFilters.AgentToShow = $scope.AllAgentsList && $scope.AllAgentsList.length > 0 ? $scope.AllAgentsList[0] : null;
      $scope.ReportFilters.AgentToShow.label = 'Overall';
    }

    $scope.updateDashboardAgent = function () {
      $agentService.GetSpecificAgentAsCustomerInfo({ agentId: $scope.ReportFilters.AgentToShow.AgentId }).then(function (result) {
        $scope.currentAgentDashboard.AgentAsCustomerInfo = result.data.d.Data;
        $agentService.GetAgentInfo($scope.ReportFilters.AgentToShow.AgentId).then(function (result) {
          $scope.currentAgentDashboard.AgentInfo = result.data.d.Data;
          $scope.UpdateChart($scope.currentAgentDashboard.AgentInfo);
        })
      })
    }

    $scope.Filters = $scope.Filters || {};

    $scope.Filters.BetLog = function (LiveTickerInfo) {
      return function (lT) {
        if (lT.AmountWagered > amountWagered && (WagerType === 'All' || $scope.GetWagerType(lT).indexOf(WagerType) >= 0)) return true;
        else return false;
      };
    };

    $scope.DisplayPeriod = function (period) {
      return $agentService.DisplayPeriod('D', period);
    };


    $scope.UpdateChart = function () {
      $scope.getHeaderInfo($scope.Week.val);
      $scope.getAgentWinLossByWeek($scope.Week.val);
    };

    $scope.Init();

    $scope.$on('$destroy', function () {
      document.getElementById("body_bg").classList.remove('dashboard');
      document.getElementById("containerFluid").classList.add('container-fluid', 'xyz');

    });
  }
]);