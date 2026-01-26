appModule.controller("agentAccessController", [
  '$scope', '$agentService', '$rootScope', function ($scope, $agentService, $rootScope) {

    
    $scope.Init = function () {
      if ($rootScope.selectedAgent) {
        $scope.GetAgentInfo();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.GetAgentInfo();
        });
      }
    };

    $scope.GetAgentInfo = function (search = null) {
      if (!$scope.AllAgentsList) return;
      let filteredAgents = $scope.AllAgentsList;
      $scope.agentList = [];
      const idMapping = filteredAgents.reduce((acc, el, i) => {
        acc[el.AgentId] = i;
        return acc;
      }, {});
      filteredAgents.forEach(el => {
        el.children = null;
        // Use our mapping to locate the parent element in our data array
        const parentEl = filteredAgents[idMapping[el.MasterAgentId]];
        // Handle the root element
        if (el.MasterAgentId === "" || !parentEl) {
          $scope.agentList.push(el);
          return;
        }
        // Add our current el to its parent's `children` array
        parentEl.children = [...(parentEl.children || []), el];
      });

      function findAgentBranch(agentList, targetId) {
        for (let agent of agentList) {
          if (agent.AgentId === targetId) {
            return [agent];
          }
          if (agent.children && agent.children.length > 0) {
            const branch = findAgentBranch(agent.children, targetId);
            if (branch) {
              return [...branch];
            }
          }
        }
        return null; // No encontrado
      }
      if(search && $scope.AllAgentsList[0].AgentId != search){
        $scope.agentList = findAgentBranch($scope.agentList[0].children, search)
      }else{
        $scope.agentList = $scope.agentList[0].children;
      }

    }		

    let collapsedAllStatus = true;

    function collapseAll() {
      collapsedAllStatus = true;
      var treeScope = _getRootNodesScope('tree-root');
      if (treeScope) {
        treeScope.$broadcast('angular-ui-tree:collapse-all');
      }
    }

    $scope.toggleCollapse = function () {
      if (collapsedAllStatus)
        expandAll();
      else
        collapseAll();
    }

    function expandAll() {
      collapsedAllStatus = false;
      var treeScope = _getRootNodesScope('tree-root');
      if (treeScope) {
        treeScope.$broadcast('angular-ui-tree:expand-all');
      }
    }

    function _getRootNodesScope(myTreeId) {
      var treeElement = angular.element(document.getElementById(myTreeId));
      if (treeElement) {
        var treeScope = (typeof treeElement.scope === 'function') ?
          treeElement.scope() : undefined;
        return treeScope;
      }
      return undefined;
    };

    $scope.Init();
  }
]);

