appModule.controller("agentdistributionController", [
    '$rootScope', '$scope', '$agentService', '$routeParams', function ($rootScope, $scope, $agentService, $routeParams) {

      $scope.Init = function () {
        $scope.SummaryOnly = false;
        if ($routeParams.SummaryOnly != null) {
          $scope.SummaryOnly = $routeParams.SummaryOnly;
        }
        if ($scope.SummaryOnly) {
          $scope.GetAgentSummary();
          $scope.Period = { val: null };
          $scope.UserTotal = 0;

        } else {
          $scope.GetAgentDistribution();
          $scope.GetAgentSummary();
          $scope.UserTotal = 0;
          $scope.Period = { val: null };
        }
        if (!$rootScope.IsMobile)
          setTimeout(function () {
            jQuery('table.tablesaw').fixedHeader({
              topOffset: 65
            });
          }, 1200);
      };

      $scope.DDBox = {
        TranType: 'ALL'
      };

      $scope.Filters = $scope.Filters || {};

      $scope.Filters.TranType = function () {
        return function (ts) {
          if ($scope.DDBox.TranType === 'ALL') return true;
          return $scope.DDBox.TranType.toString().indexOf(ts.TranType) >= 0;
        };
      };

      $scope.GetAgentDistribution = function () {
        $agentService.GetAgentDistribution().then(function (result) {
          var agents = result.data.d.Data;
          var groupedAgents = new Array();

          if (agents && agents.length > 0) {

            var groupedItems = new Array();
            var holdAgentId = agents[0].AgentID;

            for (var i = 0; i < agents.length; i++) {
              if (holdAgentId !== agents[i].AgentID) {
                groupedAgents.push(agents[i - 1]);
                if (groupedAgents.length > 0 && groupedItems.length > 0)
                  groupedAgents[groupedAgents.length - 1].Items = groupedItems;
                groupedItems = new Array();
                groupedItems.push(agents[i]);
              } else {
                groupedItems.push(agents[i]);
              }
              holdAgentId = agents[i].AgentID;

              if (i === agents.length - 1) {
                groupedAgents.push(agents[i]);
                groupedAgents[groupedAgents.length - 1].Items = groupedItems;
              }
            }
          }
          $scope.AgentDistribution = groupedAgents;
        });
      };

      $scope.GetAgentSummary = function () {
        $agentService.GetAgentTransactionListByDays(7);
      };

      $scope.$on('transactiontListSummaryLoaded', function () {
        $scope.TransactionSumamry = $agentService.TransactionListSummary;
        CommonFunctions.PrepareTable('agentSummaryTbl');
      });

      $scope.AddToTotal = function (e, tS, winloss) {
        if (winloss === "W") tS.WonSelected = !tS.WonSelected;
        else tS.LostSelected = !tS.LostSelected;
        $scope.UserTotal = $agentService.GetPerformanceTotal($scope.TransactionSumamry) / 100;
      };

      $scope.UpdateSummary = function () {
        $agentService.GetAgentTransactionListByDays($scope.Period.val);
      };

      $scope.ShortDescription = function (sdescription) {
        if (sdescription.indexOf('Agent Distribution Debit') >= 0 || sdescription.indexOf('Agent Distribution Credit') >= 0)
          return sdescription.trim().replace(/(\r\n\t|\n|\r\t)/gm, '').replace('Agent Distribution Debit', '').replace('Agent Distribution Credit', '').replace('from', '');
        return sdescription;
      };

      $scope.Init();
    }
]);
