appModule.controller("addAgentController", [
  '$rootScope', '$scope', '$agentService', '$compile', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, DTOptionsBuilder, DTColumnDefBuilder) {
    
    let lastSavedAgentId = null;
    let numPart = null;
    $scope.NewAgent = {};
    $scope.tableData = [];
    $scope.cloneTable = [];
    $scope.dtInstance = {};
    $scope.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('stateSave', true)
      .withOption('aaData', {})
      .withOption('createdRow', function (row) {
        // Recompiling so we can bind Angular directive to the DT
        //if ($scope.tableData.length == 0 || createRowCompleted == true) return;
        //$compile(angular.element(row).contents())($scope);
      })
      .withOption('initComplete', function (settings) {
        // Recompiling so we can bind Angular directive to the DT
        $compile(angular.element('#' + settings.sTableId).contents())($scope);
        jQuery('.dt-buttons').find('a').tooltip();
        jQuery('#' + settings.sTableId + ' tbody').on('click', 'tr td', function (e) {
          if (jQuery(e.target).closest('span').length == 0) {
            $compile(angular.element('#' + settings.sTableId).contents())($scope);
            return;
          }
          jQuery(this).click();
        });
      })
      .withOption('responsive', {
        details: {
          type: 'column',
          target: 4
        }
      })
      .withOption('aaSorting', [])
      .withOption('searching', false)
      .withOption('paging', false)
      .withOption('info', false)

    $scope.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Agent ID')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Password')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('First Name')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Agent Type')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<input id="${meta.row}_AgentId" type="text" ng-model="cloneTable[${meta.row}].AgentId">`;
        case 1:
          return `<input id="${meta.row}_password" type="text" ng-model="cloneTable[${meta.row}].password">`;
        case 2:
          return `<input id="${meta.row}_NameFirst" type="text" ng-model="cloneTable[${meta.row}].NameFirst">`;
        case 3:
          return `<select id="${meta.row}_agentType" type="text" ng-model="cloneTable[${meta.row}].AgentType">
          <option value="A">${$scope.Translate('Agent')}</option>
          <option value="M">${$scope.Translate('Master Agent')}</option>
          </select>`;
        default:
          return "";
      }
    }

    $scope.getFocus = function (e) {
      inputFocus = e.currentTarget.id;
    }

    $scope.SetAgentsBatch = function () {
      if (!$scope.NewAgent.password || $scope.NewAgent.password.toString().trim() == "") {
        $scope.fireSwal($scope.Translate('Warning'), $scope.Translate('Please set a valid password'), 'warning');
        return;
      }
      $scope.tableData = [];
      let numPart = 1;
      for (let i = 0; i < $scope.NewAgent.batch; i++) {
        $scope.tableData.push({ ...$scope.NewAgent, AgentId: ($scope.NewAgent.Prefix/* + (numPart++)*/)});
      }
      $scope.dtOptions.withOption('aaData', $scope.tableData);
      $scope.cloneTable = JSON.parse(JSON.stringify($scope.tableData));
    }

    $scope.IsDisabled = function () {
      return (typeof $scope.NewAgent.Prefix === "undefined") || $scope.NewAgent.Prefix.trim() == '';
    }

    $scope.updateFields = function () {
      $scope.tableData = [];
    }

    $scope.saveBatch = saveBatch;

    async function saveBatch() {
      if ($scope.cloneTable.length == 0) {
        $scope.fireSwal($scope.Translate('Set at least one agent'), '', 'warning');
        return;
      }
      let failedAgents = [];
      for (let i = 0; i < $scope.cloneTable.length; i++) {
        let agent = $scope.cloneTable[i];
        let result = (await insertNewAgent(agent));
        if (result.data.d.Code == 0 && result.data.d.Data == "") {
          agentAdded = true;
        } else {
          failedAgents.push(agent);
        }
      }
      if (failedAgents.length > 0) {
        let failedString = '';
        failedAgents.forEach(function (f, index) { failedString = failedString + f.AgentId + ((index + 1) < failedAgents.length ? ', ' : '') })
        $scope.fireSwal($scope.Translate('Warning'), failedString + ' ' + $scope.Translate('couldn\'t be saved. Make sure Agent ID doesn\'t already exist'), 'warning');
        $scope.tableData = failedAgents;
        $scope.dtOptions.withOption('aaData', $scope.tableData);
      } else {
        $scope.fireSwal('Agent saved!');
        $scope.tableData = [];
        $scope.dtOptions.withOption('aaData', $scope.tableData);
        $scope.GetAgentHierarchy();
      }
      $scope.cloneTable = JSON.parse(JSON.stringify($scope.tableData));
    }

    async function insertNewAgent(agent) {
      if ($scope.AgentInfo.AddNewAccountFlag != 'Y') return;
      agentAdded = false;
      if (lastSavedAgentId == agent.AgentId) {
        $scope.confirmationMsg = $scope.Translate("Error. Agent already exists");
      } else {
        lastSavedAgentId = agent.AgentId;
        return $agentService.InsertNewAgent({
          agentId: agent.AgentId,
          agentType: agent.AgentType,
          masterAgentId: $scope.AgentAsCustomerInfo.AgentType == 'M' ? $scope.selectedAgent.AgentId.trim() : $scope.AgentInfo.AgentID.trim(),
          inheritFromAgentID: $scope.AgentAsCustomerInfo.AgentType == 'M' ? $scope.selectedInheritAgent.AgentId.trim() : $scope.AgentInfo.AgentID.trim(),
          password: agent.password,
          firstName: agent.NameFirst
        });
      }
    }

    function _init() {
      if ($scope.AllAgentsList.length > 0) {
        setAgentProps();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          setAgentProps();
        });

      }
    }
    
    $scope.masterAgents = function () {
      return $scope.AllAgentsList.filter(x => x.AgentType == 'M');
    }

    function setAgentProps() {
      if ($scope.AgentAsCustomerInfo.AgentType != 'M') {
        document.location.href = '#/';
        return;
      }
      $scope.selectedAgent = $scope.AllAgentsList[0];
      $scope.selectedInheritAgent = $scope.AllAgentsList[0];
      numPart = 1;
      $scope.NewAgent = {
        AgentId: (($scope.selectedAgent.CustomerIDPrefix ? $scope.selectedAgent.CustomerIDPrefix : '') + (numPart && numPart != '' ? parseInt(numPart) + 1 : numPart)).trim(),
        Prefix: ($scope.selectedAgent.AgentIDPrefix ? $scope.selectedAgent.AgentIDPrefix : '').trim(),
        NameFirst: '', Password: '', batch: 1, AgentType: "A"
      };
    }


    _init();

  }]);