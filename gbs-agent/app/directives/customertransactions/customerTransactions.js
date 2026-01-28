appModule.directive('customerTransactions', ['$agentService', function ($agentService) {
  return {
    restrict: 'AEC',
    scope: {
      date: '=',
      currentCustomerId: '='
    },
    controller: ['$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
      $scope.Translate = $scope.$parent.Translate;
      function Init() {
        $scope.$parent.showLoadingGif('loadingAllTransactions');

        if ($rootScope.selectedAgent) {
          $scope.GetAgentCustomerTransactions();
        }
        else {
          $rootScope.$on('AgentAsCustomerInfoReady', function () {
            if ($rootScope.selectedAgent) {
              $scope.GetAgentCustomerTransactions();
            }
          });
        }
      }

      $scope.GetAgentCustomerTransactions = function () {
        $scope.$parent.showLoadingGif('loadingAllTransactions');
        const params = { customerId: $scope.currentCustomerId, endDate: $scope.date, listoOrBalance: 0, daysBack: 6 }
        $agentService.GetCustomerTransactionsWithBalance(params).then(function (result) {
          $scope.AgentsTrans = GroupTransactions([result.filter(x => x.TranType == 'E' || x.TranType == 'I')]);
          $scope.$parent.hideLoadingGif('loadingAllTransactions');
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
    }],
    templateUrl: appModule.Root + '/app/directives/customerTransactions/customerTransactionsView.html'
  };
}]);