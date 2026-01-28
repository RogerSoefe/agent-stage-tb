appModule.controller("gradedWagersController", [
  '$scope', '$agentService', '$rootScope', function ($scope, $agentService, $rootScope) {
    $scope.dataSource = [];
    $scope.showDateFilter = true;
    $scope.showData = false;

    async function init() {
      let endDate = new Date();
      let startDate = new Date();
      startDate.setDate(startDate.getDate() - 720);
      let params = {
        customerId: "All",
        endDate,
        mode: 2,
        pageCount: 1000,
        start: 0,
        startDate
      }
      $scope.dataSource = (await $agentService.GetGradedBetsByCustomerId(params));
      $scope.showData = true;
      $scope.pageCountParam = 1000;
      $rootScope.safeApply();
    }

    $scope.sourceCaller = function (params) {
      return $agentService.GetGradedBetsByCustomerId(params);
    }

    init();

  }]);
