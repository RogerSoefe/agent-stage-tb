appModule.controller("addCustomerController", [
  '$rootScope', '$scope', '$agentService', '$compile', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, DTOptionsBuilder, DTColumnDefBuilder) {



    let customerAdded = false;
    let lastSavedCustomerId = null;
    let numPart = null;    
    $scope.NewCustomer = {};
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
          target: 6
        }
      })
      .withOption('aaSorting', [])
      .withOption('lengthMenu', [[100, 500, 1000, 5000], [100, 500, 1000, 5000]])
      .withOption('pageLength', 100)

    $scope.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Customer ID')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Password')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('First Name')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Last Name')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Max Wager')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Credit Limit')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(6).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<input id="${meta.row}_CustomerId" type="text" ng-model="cloneTable[${meta.row}].CustomerId">`;
        case 1:
          return `<input id="${meta.row}_password" type="text" ng-model="cloneTable[${meta.row}].password">`;
        case 2:
          return `<input id="${meta.row}_NameFirst" type="text" ng-model="cloneTable[${meta.row}].NameFirst">`;
        case 3:
          return `<input id="${meta.row}_NameLast" type="text" ng-model="cloneTable[${meta.row}].NameLast">`;
        case 4:
          return `<input id="${meta.row}_wagerLimit" type="text" ng-model="cloneTable[${meta.row}].wagerLimit" digits-only>`;
        case 5:
          return `<input id="${meta.row}_creditLimit" type="text" ng-model="cloneTable[${meta.row}].creditLimit" digits-only>`;
        default:
          return "";
      }
    }

    $scope.getFocus = function (e) {
      inputFocus = e.currentTarget.id;
    }

    $scope.SetCustomersBatch = function () {
      if (!$scope.NewCustomer.password || $scope.NewCustomer.password.toString().trim() == "") {
        $scope.fireSwal($scope.Translate('Warning'), $scope.Translate('Please set a valid password'), 'warning');
        return;
      }
      $scope.tableData = [];
      numPart = $scope.selectedAgent.LastCustomerID.replace(/[^\d.]/g, '');
      numPart = (numPart && numPart != '' ? parseInt(numPart) + 1 : 1)
      for (let i = 0; i < $scope.NewCustomer.batch; i++) {
        $scope.tableData.push({ ...$scope.NewCustomer, CustomerId: ($scope.NewCustomer.Prefix + (numPart++)) });
      }
      $scope.dtOptions.withOption('aaData', $scope.tableData);
      $scope.cloneTable = JSON.parse(JSON.stringify($scope.tableData));
    }

    $scope.IsDisabled = function () {
      return (typeof $scope.NewCustomer.Prefix === "undefined") || $scope.NewCustomer.Prefix.trim() == '';
    }

    $scope.updateFields = function () {
      $scope.tableData = [];
      $scope.NewCustomer.Prefix = ($scope.selectedAgent.CustomerIDPrefix ? $scope.selectedAgent.CustomerIDPrefix : '').trim();
      numPart = $scope.selectedAgent.LastCustomerID.replace(/[^\d.]/g, '');
      $scope.NewCustomer.CustomerId = (($scope.selectedAgent.CustomerIDPrefix ? $scope.selectedAgent.CustomerIDPrefix : '') + (numPart && numPart != '' ? parseInt(numPart) + 1 : numPart)).trim();
      $scope.NewCustomer.TimeZone = $scope.TimeZoneList.find(x => $scope.selectedAgent.TimeZone == x.TzCode).TzCode;
    }

    $scope.saveBatch = saveBatch;

    async function saveBatch() {
      if ($scope.cloneTable.length == 0) {
        $scope.fireSwal($scope.Translate('Set at least one customer'), '', 'warning');
        return;
      }
      let failedCustomers = [];
      for (let i = 0; i < $scope.cloneTable.length; i++) {
        let customer = $scope.cloneTable[i];
        let result = (await insertNewCustomer(customer));
        if (result && result.data.d.Code == 0) {
          customerAdded = true;
          _updateCustomer(customer);
        } else {
          failedCustomers.push(customer);
        }
      }
      --numPart;
      $scope.selectedAgent.LastCustomerID = numPart.toString();
      if (failedCustomers.length > 0) {
        let failedString = '';
        failedCustomers.forEach(function (f, index) { failedString = failedString + f.CustomerId + ((index + 1) < failedCustomers.length ? ', ' : '') })
        $scope.fireSwal($scope.Translate('Completed with issues'), failedString + ' ' + $scope.Translate('already exists'), 'warning');
        $scope.tableData = failedCustomers;
        $scope.dtOptions.withOption('aaData', $scope.tableData);
      } else {
        $scope.fireSwal('Batch saved!');
        $scope.tableData = [];
        $scope.dtOptions.withOption('aaData', $scope.tableData);
      }
      $scope.cloneTable = JSON.parse(JSON.stringify($scope.tableData));
    }

    async function insertNewCustomer(customer) {
      if ($scope.AgentInfo.AddNewAccountFlag != 'Y') return;
      customerAdded = false;
      if (lastSavedCustomerId == customer.CustomerId) {
        $scope.confirmationMsg = $scope.Translate("Error. User already exists");
      } else {
        lastSavedCustomerId = customer.CustomerId;
        return $agentService.InsertNewCustomer({
          customerId: customer.CustomerId,
          agentId: $scope.AgentAsCustomerInfo.AgentType == 'M' ? $scope.selectedAgent.AgentId.trim() : $scope.AgentInfo.AgentID.trim(),
          wagerLimit: customer.wagerLimit ? customer.wagerLimit * 100 : 0,
          creditLimit: customer.creditLimit ? customer.creditLimit * 100 : 0
        });
      }
    }

    function _init() {
      if ($scope.AllAgentsList.length > 0) {
        $scope.noMasterList = $scope.AgentAsCustomerInfo.AgentType == 'M' ? $scope.AllAgentsList.filter(x => x.AgentType == 'A') : $scope.AllAgentsList;
        _getTimeZones();
        _getPriceTypes();
        $scope.states = CommonFunctions.GetStates();
        setCustomerProps();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.noMasterList = $scope.AllAgentsList.filter(x => x.AgentType == 'A');
          _getTimeZones();
          _getPriceTypes();
          $scope.states = CommonFunctions.GetStates();
          setCustomerProps();
        });

      }
    }

    function setCustomerProps() {
      $scope.selectedAgent = $scope.noMasterList[0];
      numPart = $scope.noMasterList[0].LastCustomerID.replace(/[^\d.]/g, '');
      $scope.NewCustomer = {
        Prefix: ($scope.selectedAgent.CustomerIDPrefix ? $scope.selectedAgent.CustomerIDPrefix : '').trim(),
        CustomerId: (($scope.selectedAgent.CustomerIDPrefix ? $scope.selectedAgent.CustomerIDPrefix : '') + (numPart && numPart != '' ? parseInt(numPart) + 1 : numPart)).trim(),
        NameFirst: '', NameMI: '', NameLast: '',
        Address: '', State: '', City: '',
        Zip: '', Comments: '', Birthday: '',
        Currency: ($scope.Currencies.find(x => x.CurrencyCode == 'USD')).CurrencyName, TimeZone: ($scope.TimeZoneList.find(x => x.TzCode == $scope.selectedAgent.TimeZone)).TzCode, PriceType: 'A', HomePhone: '',
        BusinessPhone: '', Fax: '', PayoutPassword: '', wagerLimit: 0, creditLimit: 0,
        Percentbook: 100, SettleFigure: 0, ConfirmationDelay: 0,
        ZeroBalanceFlagBoolean: $scope.AgentAsCustomerInfo.ZeroBalanceFlag == 'Y' ? true : false,
        InstantActionFlagBoolean: $scope.AgentAsCustomerInfo.InstantActionFlag == 'Y' ? true : false,
        ZeroBalPositiveOnlyFlagBoolean: $scope.AgentAsCustomerInfo.ZeroBalPositiveOnlyFlag == 'Y' ? true : false,
        batch: 1
      };
    }

    function _updateCustomer(customer) {
      $agentService.UpdateCustomer(customer.CustomerId, customer.password,
        customer.NameFirst, customer.NameMI, customer.NameLast,
        customer.Address, customer.State, customer.City,
        customer.Zip, customer.Comments, customer.Birthday,
        customer.Currency, customer.TimeZone, customer.PriceType, customer.HomePhone,
        customer.BusinessPhone, customer.Fax, customer.PayoutPassword,
        customer.Percentbook, customer.SettleFigure,
        customer.CasinoActiveBoolean ? 'Y' : 'N',
        customer.ZeroBalanceFlagBoolean ? 'Y' : 'N',
        customer.ZeroBalPositiveOnlyFlagBoolean ? 'Y' : 'N',
        customer.WeeklyLimitFlagBoolean ? 'Y' : 'N',
        customer.WiseActionFlagBoolean ? 'Y' : 'N',
        customer.CustomerIsABotBoolean ? 1 : 0,
        customer.InstantActionFlagBoolean ? 'Y' : 'N',
        customer.ConfirmationDelay, null, null, false, customer.Email
      ).then(function (result) {
        if (result.data.d.Code != 0) {
          $scope.confirmationMsg = $scope.Translate("Error updating customer");
        } else {
          $scope.confirmationMsg = $scope.Translate(!customerAdded ? "Customer updated" : "Customer Added");

        }
      });
    }


    function _getTimeZones() {
      $scope.TimeZoneList = [
        { TzAbbreviation: "PST", TzName: "Pacific", TzCode: 3 },
        { TzAbbreviation: "CST", TzName: "Central", TzCode: 1 },
        { TzAbbreviation: "EST", TzName: "Eastern", TzCode: 0 },
        { TzAbbreviation: "MST", TzName: "Mountain", TzCode: 2 }]
      $scope.NewCustomer.TimeZone = $scope.TimeZoneList.find(x => $scope.noMasterList[0].TimeZone == x.TzCode).TzCode;
    }

    function _getPriceTypes() {

      $scope.PriceTypesList = [
        { PtAbbreviation: "A", PtName: "American" },
        { PtAbbreviation: "F", PtName: "Decimal" },
        { PtAbbreviation: "D", PtName: "Fractional" }];

      $scope.NewCustomer.PriceType = $scope.PriceTypesList[0].PtAbbreviation;
    }

    _init();

  }]);