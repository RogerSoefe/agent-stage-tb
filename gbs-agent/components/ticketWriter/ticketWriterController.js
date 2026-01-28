appModule.controller("ticketWriterController", ['$scope', '$agentService', '$rootScope', function ($scope, $agentService, $rootScope) {

  $scope.showSite = false;
  $scope.Selection = {};
  $scope.eventsCustomersApply = { onItemSelect: function (item) { }, onItemDeselect: function (item) { } };

  const init = function () {
    if ($scope.AgentAsCustomerInfo) {
      if ($scope.AgentAsCustomerInfo.AgentType == 'M') {
        if ($scope.AllAgentsList) {
          $scope.normalAgentsList = $scope.AllAgentsList.filter(x => x.AgentType == 'A');
          $scope.Selection.Agent = $scope.normalAgentsList[0];
          $scope.updateAgentPlayers($scope.Selection.Agent.AgentId);
        }
      } else {
        $scope.updateAgentPlayers($scope.AgentAsCustomerInfo.CustomerID);
      }
    } else {
      $rootScope.$on('AgentAsCustomerInfoReady', function () {
        if ($scope.AgentAsCustomerInfo.AgentType == 'M') {
          $scope.normalAgentsList = $scope.AllAgentsList.filter(x => x.AgentType == 'A');
          $scope.Selection.Agent = $scope.normalAgentsList[0];
          $scope.updateAgentPlayers($scope.Selection.Agent.AgentId);
        } else {
          $scope.updateAgentPlayers($scope.AgentAsCustomerInfo.CustomerID);
        }
      });
    }
  };

  $scope.updateAgentPlayers = function (agentId) {
    $scope.getAgentPlayers(agentId).then(() => $scope.Selection.Customer = $scope.agentPlayers[0]);
  };


  $scope.openPlayerSite = function () {
    if (!$scope.Selection || !document.location.host) return;
    $agentService.GetTicketWriterUrl({ customerId: $scope.Selection.Customer.id, password: $scope.Selection.Customer.password }).then(function (result) {
	  if (!result || result.length == 0 || result.indexOf("autologin") < 0) return;
      $scope.showSite = true;
      var ps = !SETTINGS.PlayersSubDomain || SETTINGS.PlayersSubDomain == '' ? '' : SETTINGS.PlayersSubDomain + '.';
      var tkUrl = "https://" + document.location.host.replace("agent.", ps) + "/sports/" + result.substring(result.indexOf("autologin"));
      document.getElementById('twFrame').src = tkUrl;
    });
  };
  init();

}]);