appModule.controller("cashtransactionsController", [
    '$scope', '$agentService', '$routeParams', function ($scope, $agentService, $routeParams) {

        $scope.ReportFilters = {
            WeekNumber: {}
        };

        $scope.Init = function () {
            $scope.WeeksRange = $agentService.GetWeeksRange();
            $scope.ReportFilters.WeekNumber = $scope.WeeksRange[0];
            $scope.AgentId = null;
            if ($routeParams.AgentIdArg != null) {
                $scope.AgentId = $routeParams.AgentIdArg;
            }
            $scope.GetAgentCustomersCashTransactions();
        };

        $scope.GetAgentCustomersCashTransactions = function () {
            $agentService.GetAgentCustomersCashTransactions($scope.ReportFilters.WeekNumber.Index, $scope.AgentId).then(function (result) {
                $scope.AgentCustomersTransactions = result.data.d.Data;
            });
        };

        $scope.CalculateTotalForCashTransactions = function (factor) {
            if (!$scope.AgentCustomersTransactions)
                return 0;
            var total = 0.0;

            for (var i = 0; i < $scope.AgentCustomersTransactions.length; i++) {
                if ($scope.AgentCustomersTransactions[i].TranCode == "C")
                    total -= $scope.AgentCustomersTransactions[i].Amount;
                else
                    total += $scope.AgentCustomersTransactions[i].Amount;
            }
            return $scope.FormatMyNumber(factor * total, true, false);
        };

        $scope.Init();
    }
]);