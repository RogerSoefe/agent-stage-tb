appModule.controller("transactionsHistoryController", ['$scope', '$rootScope', '$agentService', function ($scope, $rootScope, $agentService) {

  function Init() {
    $scope.showLoadingGif('loadingAllTransactions');

    if ($rootScope.selectedAgent) {
      loadFilters();
      $scope.GetAgentCustomerTransactions();
    }
    else {
      $rootScope.$on('AgentAsCustomerInfoReady', function () {
        if ($rootScope.selectedAgent) {
          loadFilters();
          $scope.GetAgentCustomerTransactions();
        }
      });
    }
  }

  function loadFilters() {
    $scope.WeeksRange = $agentService.GetWeeksRange();
    let endDate = new Date();
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);
    $scope.DaysBack = [{
      label: `7 ${$scope.Translate('Days')}`,
      val: 7
    }, {
        label: `15 ${$scope.Translate('Days')}`,
        val: 15
      }, {
        label: `30 ${$scope.Translate('Days')}`,
        val: 30
      }, {
        label: `90 ${$scope.Translate('Days')}`,
        val: 90
      }, {
        label: `180 ${$scope.Translate('Days')}`,
        val: 180
      }]
    $scope.Filters = {
      Week: $scope.WeeksRange[0],
      SelectedAgent: null,
      startDate: (startDate.getMonth() + 1) + "/" + startDate.getDate() + "/" + startDate.getFullYear(),
      endDate: (endDate.getMonth() + 1) + "/" + endDate.getDate() + "/" + endDate.getFullYear(),
      DaysBack: $scope.DaysBack[0]
    };
  }

  jQuery("#endDateInput").datepicker({
    defaultDate: new Date()
  });

  jQuery("#startDateInput").datepicker({
    defaultDate: -7
  });

  $scope.AgentWithTransactions = function (ag) {
    return ag.AgentId == $scope.Agents[0].AgentId || (ag.Transactions && ag.Transactions.length > 0);
  };

  $scope.GetAgentCustomerTransactions = function () {
    $scope.showLoadingGif('loadingAllTransactions');
    const params = { customerId: $rootScope.selectedAgent.AgentId, endDate: null, listoOrBalance: 0, daysBack: $scope.Filters.DaysBack.val }
    $agentService.GetCustomerTransactionsWithBalance(params).then(function (result) {
      $scope.AgentsTrans = GroupTransactions([result]);
      $scope.hideLoadingGif('loadingAllTransactions');
    });
  };

  function GroupTransactions(trans) {
    if (!trans || trans.length <= 0) return;
    for (var i = 0; i < trans.length; i++) {
      let ag = trans[i];
      ag.Transactions = 0;
      ag.Total = 0;
      ag.TotalD = 0;
      ag.TotalC = 0;
      ag.forEach(function (t) {
        ag.Total += t.TranCode == 'D' ? t.Amount * -1 : t.Amount;
        ag.TotalD += t.TranCode == 'D' ? t.Amount : 0;
        ag.TotalC += t.TranCode == 'C' ? t.Amount : 0;
			})
		}
    return trans;
  }

  Init();

}]);