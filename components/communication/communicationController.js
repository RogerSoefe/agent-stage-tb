appModule.controller("communicationController", [
  '$scope', '$agentService', '$rootScope', function ($scope, $agentService, $rootScope) {

    $scope.commObj = {}

    function init() {
      $agentService.GetCommunicationTypes().then(function (res) {
        $scope.availableCommunication = res;
        $scope.commObj.selected = res[0];
        $agentService.GetAgentCommunicationTypes({ agentId: $scope.LookupCustomer.AgentId }).then(function (res) {
          $scope.commList = res;
        })
      })
    }

    $scope.addToGrid = function () {
      let params = { agentID: $scope.LookupCustomer.AgentId, communicationTypeId: $scope.commObj.selected.TypeId, communicationTypeValue: $scope.commObj.value };
      $agentService.AddAgentCommunicationTypes(params).then(function (res) {
        $agentService.GetAgentCommunicationTypes({ agentId: $scope.LookupCustomer.AgentId }).then(function (res) {
          $scope.commList = res;
        })
      });
    }

    $scope.deleteAgentCommunicationTypes = function (typeId) {
      let params = { communicationTypeIds: typeId };
      $agentService.DeleteAgentCommunicationTypes(params).then(function (res) {
        $agentService.GetAgentCommunicationTypes({ agentId: $scope.LookupCustomer.AgentId }).then(function (res) {
          $scope.commList = res;
        })
      });
    }

    init();

  }]);
