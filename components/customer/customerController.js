appModule.controller("customerController", ['$scope', '$agentService', '$rootScope', '$integrationService', '$sce', function ($scope, $agentService, $rootScope, $integrationService, $sce) {

  let actionList = [], diff = 90;

  $scope.ReportFilters = {
    PeriodRange: 'D',
    WagerType: '',
    WeekNumber: {},
    BreakoutSportsAndCasinos: false,
    ShowCashTrans: false
  };

  $scope.Report = {
    CasinoTransactions: [],
    CashTransactions: [],
    DailyFigures: null,
    OpenBets: null,
    AllTransactions: null,
    TransactionsByDate: null
  };

  $scope.isXTransaction = false;
  $scope.offering = {};


  $scope.quickActionsTemplate = appModule.Root + "/app/components/customer/quickActions.html";
  $scope.personalInfoTemplate = appModule.Root + "/app/components/customer/personalInfo.html";
  $scope.dailyFigureTemplate = appModule.Root + "/app/components/customer/dailyFigures.html";
  $scope.openBetsTemplate = appModule.Root + "/app/components/customer/openBets.html";
  $scope.performanceTemplate = appModule.Root + "/app/components/customer/performance.html";
  $scope.allTransactionsTemplate = appModule.Root + "/app/components/customer/allTransactions.html";
  $scope.freePlayTransactionsTemplate = appModule.Root + "/app/components/customer/freePlayTransactions.html";
  $scope.offeringsTemplate = appModule.Root + "/app/components/customer/offerings.html";
  $scope.communicationTemplate = appModule.Root + "/app/components/customer/communication.html";
  $scope.featuresTemplate = appModule.Root + "/app/components/customer/features.html";
  $scope.historyTemplate = appModule.Root + "/app/components/customer/history.html";

  $scope.Init = function () {
    if (!$scope.CustomerOption) {
      document.location.href = "#/customers";
      return;
    }
    _getTimeZones();
    _getPriceTypes();
    //_getCountries();
    _getWeekDays();
    _getParlaySpecs();
    $scope.custCurrencyCode = 'USD.';
    $scope.SelectedTab = $scope.CustomerOption == 0 ? $agentService.AgentInfo.AddNewAccountFlag == 'Y' ? '0' : '1' : $scope.CustomerOption.toString();
    $scope.CustomerDailyFiguresAry = new Array();
        $scope.showNonPosted = $scope.$parent.showNonPosted;
    $scope.WeeksRange = $agentService.GetWeeksRange();
    $scope.ReportFilters.WeekNumber = $scope.WeeksRange[0];
    $scope.AgentInfo = $agentService.AgentInfo;
    $scope.SelectedCustomer = $scope.LookupCustomer;
    _getActions();
    getAllLimits();
    $scope.SetCustomerOption($scope.SelectedTab);
    getCustomerBalance($scope.SelectedCustomer.CustomerId);
    $scope.states = CommonFunctions.GetStates();
    _getTeaserSpecs($scope.SelectedCustomer.CustomerId);
    _getCostToSellPointsByCustomer($scope.SelectedCustomer.CustomerId);
    _getCostToBuyPointsByCustomer($scope.SelectedCustomer.CustomerId);
    _fillSelectedCustomerBooleanValues();
    $scope.SelectedCustomer.currentAgent = $scope.AllAgentsList ? $scope.AllAgentsList.find(x => x.AgentId.toUpperCase().trim() == $scope.SelectedCustomer.AgentId.toUpperCase().trim()) : { AgentId: $rootScope.selectedAgent.AgentId };
    let yearTempCredit = $scope.SelectedCustomer.TempCreditAdjExpDateString.split('/')[2];
    let yearComment = $scope.SelectedCustomer.CommentsForCstExpDateString.split('/')[2];
    $scope.offering.TempCreditAdjExpDateString = yearTempCredit.indexOf('1900') >= 0 ? $agentService.GetServerDateTime().toLocaleDateString('en-US') : $scope.SelectedCustomer.TempCreditAdjExpDateString;
    $scope.SelectedCustomer.CommentsForCstExpDateString = yearComment == '1900' ? $agentService.GetServerDateTime().toLocaleDateString('en-US') : $scope.SelectedCustomer.CommentsForCstExpDateString;
    $scope.SelectedCustomer.EnforcedWagerLimit = $scope.SelectedCustomer.EnforceAccumWagerLimitsFlag == 'Y' && $scope.SelectedCustomer.EnforceAccumWagerLimitsByLineFlag == 'Y' ? 'duplicated' :
      $scope.SelectedCustomer.EnforceAccumWagerLimitsFlag == 'Y' ? 'byGame' : $scope.SelectedCustomer.EnforceAccumWagerLimitsByLineFlag == 'Y' ? 'byLine' : null
    loadCommunication();
    setTimeout(function () {
      if (!$scope.SelectedCustomer.Birthday) {
        jQuery('input[name="tempCredit"]').daterangepicker({
          singleDatePicker: true,
          showDropdowns: true,
          opens: 'left',
          autoUpdateInput: false
        }, function (chosen_date) {
          jQuery(this.element[0]).val(chosen_date.format('MM/DD/YYYY'));
        });
      }
      jQuery('input[name="tempCredit"]').daterangepicker({
        singleDatePicker: true,
        showDropdowns: true,
        opens: 'left'
      });

    }, 1000);

  };

  $scope.commObj = {}

  function loadCommunication() {
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

  function _getCustomerParlayLimits(customerId) {
    $agentService.GetCustomerParlayLimits({ customerId: customerId }).then(function (result) {
      $scope.tableData = result;
    })
  }

  $scope.openParlayTeamConfig = function () {
    jQuery('#parlayTCModal').modal('show');
    setTimeout(function () {
      syncscroll.reset();
    }, 200);
  }

  $scope.Report = {
    CasinoTransactions: [],
    CashTransactions: [],
    DailyFigures: null,
    OpenBets: null,
    AllTransactions: null,
    TransactionsByDate: null
  };

  function _getCustomerParlayLimits(customerId) {
    $agentService.GetCustomerParlayLimits({ customerId: customerId }).then(function (result) {
      $scope.tableData = result;
    })
  }

  $scope.saveParlayTeamConfig = function () {
    $scope.tableData.forEach(function (data) {
      if (data.EditedCULimitValue || data.EditedInetLimitValue || data.EditedCULimitValue
        || data.EditedOpenSpotsValue || data.EditedTotalsLimitValue || data.EditedMaxDogsValue || data.EditedMoneylinesLimitValue) {
        $agentService.SaveCustomerParlayLimits($scope.SelectedCustomer.CustomerId, data);
      }
    });
    setTimeout(function () {
      $scope.fireSwal($scope.Translate('Success'));
    }, 200);
  }

  async function _getActions() {
    let params = { customerId: $scope.SelectedCustomer.CustomerId };
    let res = (await $agentService.GetActions(params));
    const rawData = res.data.d.Data;
    actionList = rawData.filter(x => x.HasParameters === false).map(function (x) { return { ...x, checked: x.CustomerId != null } });
    $scope.specAction = {
      accStatus: { ...actionList.find(x => x.Name == 'Suspend Account') },
      readOnly: !$scope.SelectedCustomer.NoWagering,
      sportbook: actionList.find(x => x.Name == 'Suspend Wagering') ? actionList.find(x => x.Name.trim() == 'Suspend Wagering') : actionList.find(x => x.Name.trim() == 'Read only account'),
      casino: actionList.find(x => x.Name == 'Disable All Casino'),
      horses: actionList.find(x => x.Name == 'Suspend Horses'),
      keyRule: actionList.find(x => x.Name == 'Parlay and Teaser Key Rule')
    };
    $scope.specAction.accStatus.checked = !$scope.specAction.accStatus.checked;
    actionList = actionList.filter(x =>
      x.Name.trim() != 'Suspend BlackJack Widget' &&
      x.Name.trim() != 'Suspend Dragon Casino' &&
      x.Name.trim() != 'Mover' &&
      x.Name.trim() != 'Change Line In Customer Favor' &&
      x.Name.trim() != 'Deny Credit');
    $scope.actionListA = actionList.slice(0, Math.round(actionList.length / 2));
    $scope.actionListB = actionList.slice(Math.round(actionList.length / 2), actionList.length + 1);
    $rootScope.safeApply();
  }


  $scope.ChangeCustomerAgent = function (customerId) {
    Swal.fire({
      title: "Change agent to customer?",
      type: "warning",
      showDenyButton: true,
      showCancelButton: true,
      confirmButtonText: $scope.Translate(`Change agent`),
      denyButtonText: $scope.Translate(`Change agent and Inherit`),
    }).then((result) => {
      if (result.isConfirmed) {
        $agentService.ChangeAgentToCustomer({ customerId: $scope.SelectedCustomer.CustomerId, newAgentId: $scope.SelectedCustomer.currentAgent.AgentId, inherit: false }).then(function () {
          $scope.LookupCustomer.AgentId = $scope.SelectedCustomer.currentAgent.AgentId;
          $scope.fireSwal($scope.Translate('Agent Changed'));
        })
      } else if (result.isDenied) {
        $agentService.ChangeAgentToCustomer({ customerId: $scope.SelectedCustomer.CustomerId, newAgentId: $scope.SelectedCustomer.currentAgent.AgentId, inherit: true }).then(function () {
          $scope.LookupCustomer.AgentId = $scope.SelectedCustomer.currentAgent.AgentId;
          $scope.fireSwal($scope.Translate('Agent Changed'));
        })
      };
    })
  }
  $scope.hideAction = function (name) {
		switch (name) {
			case "Customer Super WISE":
      case "Customer Ultra SHARP + WISE A":
      case "Customer Ultra SHARP + WISE B":
      case "Customer Ultra SHARP + WISE C":
      case "Customer Ultra SHARP + WISE D":
				return false; 
            default: return true;
		}
	}
  $scope.allowedAction = function (name) {
    switch (name) {
      case "Allow Free Plays On Parlays":
      case "Allow Free Plays On Reverses":
      case "Allow Free Plays On Straights":
      case "Allow Free Plays On Teasers":
      case "Allow Open Parlays":
      case "Allow Open Teasers":
      case "Change Line In Customer Favor":
      case "Deny Buying Points In Parlays":
      case "Deny Credit":
      case "Mover":
      case "No Circle Limit":
      case "No Store Limit":
      case "Vig Discount for All Wager Types":
      case "Suspend Props":
      case "Suspend VIP Live Casino":
      case "Suspend WM Casino":
      case "Suspend Live dealer vig":
      case "Suspend D-Live":
      case "Suspend Ultimate Live":
      case "Suspend EuroPrime":
      case "Read Only EuroPrime":
      case "Suspend Cockfights":
      case "Suspend Dragon Casino":
      case "Suspend BTCASINO":
      case "Suspend Cashier":
      case "Suspend Live dealer  wm":
      case "Suspend InterPay Cashier":
      case "Suspend Platinum Casino":
      case "Suspend EvoCasino":
      case "Suspend EzLive":
      case "Suspend Poker":        
      case "Suspend CPG":
      case "Suspend Crypto Cashier":
      case "Suspend Fun Life Casino":
      case "Suspend Golden Gaming":
      case "Suspend Lottery":
    return $scope.GetAgentRestriction('CSTSETTING');
      default: return true;
    }
  }

  async function toggleAction(action, isQuick = false) {
    let params = { customerId: $scope.SelectedCustomer.CustomerId, actionId: action.ActionId };
    if (isQuick && action.Name == 'Suspend Account') {
      if (action.checked) {
        $agentService.AllowAction(params).then(x => _getActions());
      } else {
        $agentService.RestrictAction(params).then(x => _getActions());
      }
      return;
    }
    if (action.checked) {
      $agentService.RestrictAction(params).then(x => _getActions());      
    } else {
      $agentService.AllowAction(params).then(x => _getActions());    
    }

  }

  $scope.toggleAction = toggleAction;


  showPendingBets = async function () {
    $scope.openBetsSource = [];
    jQuery('#opebBetsModal').modal('show');
    let endDate = new Date();
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
    let params = { customerId: $scope.SelectedCustomer.CustomerId, mode: 2, startDate: startDate, endDate: endDate };
    $scope.openBetsSource = (await $agentService.GetOpenBetsByCustomerId(params));
  }

  $scope.GetCoreDataUrl = function (customerId) {

    $scope.CoreDataUrl = '/coreDataLimits?customerId=' + customerId;

  }

  $scope.limits = {
    creditLimitAmt: null,
    tmpCreditLimitAmt: null,
    quickLimitAmt: null,
    tmpQuickLimitAmt: null,
    tmpCreditAdjDateThru: null,
    tmpQuickAdjDateThru: null
  };

  $scope.customerPlaceholder = function (property) {
    if (property.indexOf('Date') >= 0) {
      return CommonFunctions.FormatDateTime($scope.SelectedCustomer[property], 4);
    } else {
      return CommonFunctions.FormatNumber($scope.SelectedCustomer[property], property == 'SettleFigure' ? false : true)
    }
  }

  $scope.DDBox = {
    TranType: 'ALL'
  };

  $scope.Filters = $scope.Filters || {};

  $scope.Filters.TranType = function () {
    return function (ts) {
      if ($scope.DDBox.TranType == 'ALL') return true;
      return $scope.DDBox.TranType.toString().indexOf(ts.TranType) >= 0;
    };
  };

  $scope.ActionsVisible = function () {
    return $scope.AgentInfo.EnterTransactionFlag == 'Y' || $scope.AgentInfo.ChangeCreditLimitFlag == 'Y'
      || $scope.AgentInfo.ChangeTempCreditFlag == 'Y' || $scope.AgentInfo.SuspendWageringFlag == 'Y'
      || $scope.AgentInfo.UpdateCommentsFlag == 'Y' || $scope.AgentInfo.AddNewAccountFlag == 'Y';
  };

  $scope.UpdateCustomerBalance = function (customerId, currentBalance) {
    $scope.SelectedCustomer.CurrentBalance = currentBalance;
    getCustomerBalance($scope.SelectedCustomer.CustomerId);
    return;
  };

  $scope.UpdateCustomer = function (customer) {
    $scope.SelectedCustomer = customer;
    return;
  };

  $scope.UpdateCustomerInfo = function () {
    if (!$scope.SelectedCustomer.password || $scope.SelectedCustomer.password.toString().trim() == "") {
      alert($scope.Translate('Please set a valid password'));
      return;
    }

    $scope.SelectedCustomer.Birthday = jQuery('input[name="birthday"]').val();

    $scope.confirmationMsg = "";
    $agentService.UpdateCustomer($scope.SelectedCustomer.CustomerId, $scope.SelectedCustomer.password,
      $scope.SelectedCustomer.NameFirst, $scope.SelectedCustomer.NameMI, $scope.SelectedCustomer.NameLast,
      $scope.SelectedCustomer.Address, $scope.SelectedCustomer.State, $scope.SelectedCustomer.City,
      $scope.SelectedCustomer.Zip, $scope.SelectedCustomer.Comments, $scope.SelectedCustomer.Birthday,
      $scope.SelectedCustomer.Currency, $scope.SelectedCustomer.TimeZone, $scope.SelectedCustomer.PriceType, $scope.SelectedCustomer.HomePhone,
      $scope.SelectedCustomer.BusinessPhone, $scope.SelectedCustomer.Fax, $scope.SelectedCustomer.PayoutPassword,
      $scope.SelectedCustomer.Percentbook, $scope.limits.settleLimitAmt == null ? $scope.SelectedCustomer.SettleFigure : $scope.limits.settleLimitAmt,
      $scope.SelectedCustomer.CasinoActiveBoolean ? 'Y' : 'N',
      $scope.SelectedCustomer.ZeroBalanceFlagBoolean ? 'Y' : 'N',
      $scope.SelectedCustomer.ZeroBalPositiveOnlyFlagBoolean ? 'Y' : 'N',
      $scope.SelectedCustomer.WeeklyLimitFlagBoolean ? 'Y' : 'N',
      $scope.SelectedCustomer.WiseActionFlagBoolean ? 'Y' : 'N',
      $scope.SelectedCustomer.CustomerIsABotBoolean ? 1 : 0,
      $scope.SelectedCustomer.InstantActionFlagBoolean ? 'Y' : 'N',
      $scope.SelectedCustomer.ConfirmationDelay ? Math.abs($scope.SelectedCustomer.ConfirmationDelay) : 0,
      $scope.SelectedCustomer.CommentsForCustomer,
      $scope.SelectedCustomer.CommentsForCstExpDateString,
      $scope.SelectedCustomer.NotifyBetsToAgent ? $scope.SelectedCustomer.NotifyBetsToAgent : false,
      $scope.SelectedCustomer.EMail, $scope.SelectedCustomer.Country
    ).then(function (result) {
      if (result.data.d.Code != 0) {
        $scope.fireSwal('Error', $scope.Translate("Error updating customer"), 'error');
      } else {
        $scope.fireSwal('Success', $scope.Translate("Customer updated"));
      }
    });
  };

  $scope.UpdateCustomerOffering = function (showFire = true) {
    $scope.confirmationMsg = "";
    $agentService.UpdateCustomerOffering({
      customerId: $scope.SelectedCustomer.CustomerId,
      creditLimit: $scope.offering.CreditLimit != null ? $scope.offering.CreditLimit * 100 : $scope.SelectedCustomer.CreditLimit,
      tempCreditAdj: $scope.offering.TempCreditAdj != null ? $scope.offering.TempCreditAdj * 100 : $scope.SelectedCustomer.TempCreditAdj,
      tempCreditAdjExpDate: $scope.offering.TempCreditAdjExpDateString,
      wagerLimit: $scope.offering.WagerLimit != null ? $scope.offering.WagerLimit * 100 : $scope.SelectedCustomer.WagerLimit,
      lossCap: $scope.offering.LossCap != null ? $scope.offering.LossCap * 100 : $scope.SelectedCustomer.LossCap,
      cUMinimumWager: $scope.offering.CUMinimumWager != null ? $scope.offering.CUMinimumWager * 100 : $scope.SelectedCustomer.CUMinimumWager,
      inetMinimumWager: $scope.offering.InetMinimumWager != null ? $scope.offering.InetMinimumWager * 100 : $scope.SelectedCustomer.InetMinimumWager,


      baseballAction: $scope.SelectedCustomer.BaseballAction,
      easternLineFlag: $scope.SelectedCustomer.EasternLineFlagBoolean ? 'Y' : 'N',
      halfPointCuBasketballFlag: $scope.SelectedCustomer.HalfPointCuBasketballFlagBoolean ? 'Y' : 'N',
      halfPointInetBasketballFlag: $scope.SelectedCustomer.HalfPointInetBasketballFlagBoolean ? 'Y' : 'N',
      halfPointCuFootballFlag: $scope.SelectedCustomer.HalfPointCuFootballFlagBoolean ? 'Y' : 'N',
      halfPointInetFootballFlag: $scope.SelectedCustomer.HalfPointInetFootballFlagBoolean ? 'Y' : 'N',
      halfPointDenyTotalsFlag: $scope.SelectedCustomer.HalfPointDenyTotalsFlagBoolean ? 'Y' : 'N',
      halfPointCuBasketballDow: $scope.SelectedCustomer.halfPointCuBasketballDow != null ? $scope.SelectedCustomer.halfPointCuBasketballDow : 0,
      halfPointInetBasketballDow: $scope.SelectedCustomer.halfPointInetBasketballDow != null ? $scope.SelectedCustomer.halfPointInetBasketballDow : 0,
      halfPointCuFootballDow: $scope.SelectedCustomer.halfPointCuFootballDow != null ? $scope.SelectedCustomer.halfPointCuFootballDow : 0,
      halfPointInetFootballDow: $scope.SelectedCustomer.halfPointInetFootballDow != null ? $scope.SelectedCustomer.halfPointInetFootballDow : 0,
      halfPointWagerLimitFlag: $scope.SelectedCustomer.HalfPointWagerLimitFlagBoolean != null ? 'Y' : 'N',
      halfPointMaxBet: $scope.SelectedCustomer.HalfPointMaxBet,

      staticLinesFlag: $scope.SelectedCustomer.StaticLinesFlagBoolean ? 'Y' : 'N',
      enableRifFlag: $scope.SelectedCustomer.EnableRifFlagBoolean ? 'Y' : 'N',
      usePuckLineFlag: $scope.SelectedCustomer.UsePuckLineFlagBoolean ? 'Y' : 'N',
      creditAcctFlag: $scope.SelectedCustomer.CreditAcctFlagBoolean ? 'Y' : 'N',
      limitRifToRiskFlag: $scope.SelectedCustomer.LimitRifToRiskFlagBoolean ? 'Y' : 'N',

      parlayMaxBet: $scope.limits.ParlayMaxBet != null ? $scope.limits.ParlayMaxBet * 100 : $scope.SelectedCustomer.ParlayMaxBet,
      parlayMaxPayout: $scope.limits.ParlayMaxPayout != null ? $scope.limits.ParlayMaxPayout * 100 : $scope.SelectedCustomer.ParlayMaxPayout,
      teaserMaxBet: $scope.limits.TeaserMaxBet != null ? $scope.limits.TeaserMaxBet * 100 : $scope.SelectedCustomer.TeaserMaxBet,
      actionReverseMaxBet: $scope.limits.ActionReverseMaxBet != null ? $scope.limits.ActionReverseMaxBet * 100 : $scope.SelectedCustomer.ActionReverseMaxBet,
      teaserMaxBet: $scope.limits.TeaserMaxBet != null ? $scope.limits.TeaserMaxBet * 100 : $scope.SelectedCustomer.TeaserMaxBet,
      contestMaxBet: $scope.limits.ContestMaxBet != null ? $scope.limits.ContestMaxBet * 100 : $scope.SelectedCustomer.ContestMaxBet,
      contestMaxPayout: $scope.limits.ContestMaxPayout != null ? $scope.limits.ContestMaxPayout * 100 : $scope.SelectedCustomer.ContestMaxPayout,
      maxMoneyLinePrice: $scope.limits.MaxMoneyLinePrice != null ? $scope.limits.MaxMoneyLinePrice : $scope.SelectedCustomer.MaxMoneyLinePrice,
      maxContestPrice: $scope.limits.MaxContestPrice != null ? $scope.limits.MaxContestPrice : $scope.SelectedCustomer.MaxContestPrice,
      enforceAccumWagerLimitsFlag: $scope.SelectedCustomer.EnforcedWagerLimit == 'duplicated' || $scope.SelectedCustomer.EnforcedWagerLimit == 'byGame' ? 'Y' : $scope.SelectedCustomer.EnforcedWagerLimit == 'byLine' ? 'N' : null,
      enforceAccumWagerLimitsByLineFlag: $scope.SelectedCustomer.EnforcedWagerLimit == 'duplicated' || $scope.SelectedCustomer.EnforcedWagerLimit == 'byLine' ? 'Y' : $scope.SelectedCustomer.EnforcedWagerLimit == 'byGame' ? 'N' : null,
      ifBetMaxBet: $scope.limits.IfBetMaxBet != null ? $scope.limits.IfBetMaxBet * 100 : $scope.SelectedCustomer.IfBetMaxBet,
      roundRobinMaxBet: $scope.limits.RoundRobinMaxBet != null ? $scope.limits.RoundRobinMaxBet * 100 : $scope.SelectedCustomer.RoundRobinMaxBet,


    }).then(function (result) {
      if (result.data.d.Code != 0) {
        $scope.fireSwal($scope.Translate("Error updating customer"), '', 'error');
        return;

      } else if (showFire) {
        $scope.fireSwal($scope.Translate("Customer updated"));

      }

    });
  };
  function getAllLimits() {
    $agentService.GetDetailWagerLimits($scope.SelectedCustomer.CustomerId, 'All', 0).then(function (result) {
      $scope.sportLimits = result.data.d.Data[0];
    });
  }


  var getCustomerBalance = function (customerId) {
    $agentService.GetCustomerBalance(customerId).then(function (result) {
      $scope.CustomerBalance = result.data.d.Data;
      $scope.SelectedCustomer.CurrentBalance = $scope.CustomerBalance.CurrentBalance;
      $scope.SelectedCustomer.FreePlayBalance = $scope.CustomerBalance.FreePlayBalance;
      $rootScope.safeApply();
    });
  };

  $scope.SetSelectedCustomer = function (customer) {
    $scope.SelectedCustomer = customer;
    $scope.SetCustomerOption($scope.SelectedTab);
    _fillSelectedCustomerBooleanValues();
    $scope.confirmationMsg = '';
  };

  $scope.SetCustomerOption = function (option) {
    $scope.confirmationMsg = '';
    if (option == null) option = 0;
    $scope.SelectedTab = option;
    switch (option.toString()) {
      case '0':
        $scope.ShowPersonalInfo();
        break;
      case '1':
        $scope.GetCustomerPerformance();
        break;
      case '2':
        break;
      case '3':
        $scope.ShowDailyFigures(0);
        break;
      case '4':
        showPendingBets();
        break;
      case '5':
        $scope.ShowAllTransactions();
        break;
      case '6':
        _getCustomerParlayLimits($scope.SelectedCustomer.CustomerId);
      case '7':
        $scope.ShowFreeplayTransactions();
        break;
      case '12':
        document.location.href = '#/sportslimits';
        break;
      case '13':
        LoadVigLimits();
        break;

    };
  };

  async function LoadVigLimits() {
    var resp = (await $integrationService.GetVigLimits($scope.SelectedCustomer.CustomerId));
    console.log(resp);
    if (resp.Code != 0)
      alert(resp.Message);
    console.log(resp.Data);
    $scope.VigLimitsCust = resp.Data;
    $scope.vigLimitsTemplate = appModule.Root + "/app/components/customer/vigLimits.html";
  }

  $scope.SetVigLimits = async function () {
    var resp = (await $integrationService.SetVigLimits($scope.VigLimitsCust));
    if (resp.Code != 0)
      Swal.fire(
        'SUCCESS',
        '',
        'error'
      );
    Swal.fire(
      'SUCCESS',
      '',
      'info'
    );
  }

  //Performance Section Begin

  $scope.GetCustomerPerformance = function (range, customerId) {
    if (range) $scope.ReportFilters.PeriodRange = range;
    if (customerId) {
      $scope.Customer = {
        Info: { CustomerID: customerId }
      };
    }
  };

  $scope.DisplayPeriod = function (period) {
    return $agentService.DisplayPeriod($scope.ReportFilters.PeriodRange, period);
  };

  $scope.AddToTotal = function (e, ap, winloss) {
    if (winloss == "W") ap.WonSelected = !ap.WonSelected;
    else ap.LostSelected = !ap.LostSelected;
    $scope.UserTotal = $agentService.GetPerformanceTotal($scope.Report.CustomerPerformance);
  };

  $scope.TitleCustomer = function () {
    if (!$scope.SelectedCustomer) return;
    return $scope.Translate("Customer") + ': ' + $scope.SelectedCustomer.CustomerId;
  };

  //Performance Section End

  //Daily Figures Section Begin

  var isCalendarPick = false;
  var endDate = "";
  $scope.DailyWinLossList = [];
  $scope.DailyCasinoWinLossList = [];
  $scope.DailyCashInOutList = [];
  var DailyWinLoss = function (hasValue, value) {
    return {
      hasValue: hasValue,
      value: hasValue ? value : 0
    };
  };
  var CasinoWinLoss = function (hasValue, value) {
    return {
      hasValue: hasValue,
      value: hasValue ? value : 0
    };
  };
  var CashInOut = function (hasValue, value) {
    return {
      hasValue: hasValue,
      value: hasValue ? value : 0
    };
  };
  var Balance = function (hasValue, value) {
    return {
      hasValue: hasValue,
      value: hasValue ? value : 0
    };
  };

  function eventFire(el, etype) {
    if (el.fireEvent) {
      el.fireEvent('on' + etype);
    } else {
      var evObj = document.createEvent('Events');
      evObj.initEvent(etype, true, false);
      el.dispatchEvent(evObj);
    }
  }

  $scope.currentDate = $agentService.GetServerDateTime();
  $scope.Arrow = -1;
  $scope.EndingBalance = 0;
  $scope.DailyFiguresDate = CommonFunctions.FormatDateTime($agentService.GetServerDateTime(), 4);

  function getWeekList() {
    let currentDate = moment().format('M/D');
    let weekData = { weekList: [], currentDay: null, currentDayIndex: 0 }
    for (let i = 0; i < 7; i++) {
      let dateArray = $scope.Report.DailyFigures.ValuesPerDay[i].ThisDate.split('/');
      let date = `${dateArray[0]}/${dateArray[1]}`;
            if (date == currentDate) {
                if ($scope.SelectedCustomer)
                    $scope.Report.DailyFigures.ValuesPerDay[i].CasinoWinLoss = $scope.SelectedCustomer.CasinoBalance;
                weekData.currentDayIndex = i;
            }
      weekData.weekList.push($sce.trustAsHtml(`<span>${$scope.GetWeekDayName(i)}</span><br /><span>${date}</span>`));
    }
    weekData.currentDay = weekData.weekList[weekData.currentDayIndex];
    return weekData;
  }

  $rootScope.$on('dailyFiguresLoaded', function () {
    $scope.DailyWinLossList = [];
    $scope.DailyCasinoWinLossList = [];
    $scope.DailyCashInOutList = [];
    $scope.DailyBalanceList = [];
    $scope.Report.DailyFigures = $agentService.DailyFigures;
    $scope.WeekData = getWeekList();
    $scope.DailyFiguresDate = (isCalendarPick ? endDate :
      ($agentService.GetServerDateTime() != $scope.Report.DailyFigures.ValuesPerDay[0].ThisDate ? CommonFunctions.FormatDateTime($scope.Report.DailyFigures.ValuesPerDay[0].ThisDate, 4) : CommonFunctions.FormatDateTime($agentService.GetServerDateTime(), 4)));
    showDailyWinLoss();
    showDailyCashInOut();
    showDailyCasinoWinLoss();
    showDailyBalance();
        npTotal();
  });

    function npTotal() {
        if (!$scope.Report.DailyFigures)
            return;
        let total = 0;
        $scope.Report.DailyFigures.ValuesPerDay.forEach((x) => {
            total += x.CasinoWinLoss === null ? 0 : x.CasinoWinLoss;
        });
        $scope.Report.DailyFigures.CasinoWinLossTotal = total;
    }

  $rootScope.$on('transactionListByDateLoaded', function () {
    $scope.Report.TransactionsByDate = $agentService.TransactionList;
    if ($scope.setCategory == 'bal' && $scope.Report.TransactionsByDate) {
      showCasinoTransactions($scope.Arrow);
    }
    $rootScope.safeApply();
    return true;
  });

  $rootScope.$on('cashTransactionsLoaded', function () {
    $scope.Report.CashTransactions = $agentService.CashTransactionList;
    if ($scope.setCategory == 'cash' && $scope.Report.CashTransactions) {
      for (var i = 0; i < $scope.Report.CashTransactions.length; i++) {
        var inserted = false;
        for (var j = 0; j < $scope.Report.TransactionsByDate.length; j++) {
          if (CommonFunctions.FormatDateTime($scope.Report.TransactionsByDate[j].TranDateTimeString, 10) <
            CommonFunctions.FormatDateTime($scope.Report.CashTransactions[i].TranDateTimeString, 10)) {
            $scope.Report.TransactionsByDate.splice(j, 0, $scope.Report.CashTransactions[i]);
            inserted = true;
            break;
          }
        }
        if (!inserted) {
          $scope.Report.TransactionsByDate.push($scope.Report.CashTransactions[i]);
        }
      }
    }
    $rootScope.safeApply();

    return true;
  });

  $rootScope.$on('casinoTransactionsLoaded', function () {
    $scope.Report.CasinoTransactions = $agentService.CasinoTransactionList;
    if ($scope.setCategory == 'casino' && $scope.Report.CasinoTransactions) {
      var inserted = false;
      for (var i = 0; i < $scope.Report.CasinoTransactions.length; i++) {
        for (var j = 0; j < $scope.Report.TransactionsByDate.length; j++) {
          if (CommonFunctions.FormatDateTime($scope.Report.TransactionsByDate[j].TranDateTimeString, 1) <
            CommonFunctions.FormatDateTime($scope.Report.CasinoTransactions[i], 1)) {
            $scope.Report.TransactionsByDate.splice(j, 0, $scope.Report.CasinoTransactions[i]);
            inserted = true;
            break;
          }

        }
        if (!inserted) {
          $scope.Report.TransactionsByDate.push($scope.Report.CasinoTransactions[i]);
        }
      }
      showCashTransactions($scope.Arrow);
    }
    else if ($scope.setCategory == 'bal') showCashTransactions($scope.Arrow);
    $rootScope.safeApply();

        if ($scope.SelectedCustomer && $scope.SelectedCustomer.CasinoBalance != 0)
            $scope.showNonPosted($scope.Report.CasinoTransactions, $scope.SelectedCustomer);

    return true;
  });

  $scope.ShowCasinoLine = function () {
    for (var i = 0; $scope.DailyCasinoWinLossList.length > i; i++)
      if ($scope.DailyCasinoWinLossList[i].hasValue) return true;
    return false;
  };

  function showCasinoTransactions(index) {
    if ($scope.SelectedCustomer.CustomerId)
      $agentService.GetCasinoTransactionsByDate($scope.SelectedCustomer.CustomerId, $scope.Report.DailyFigures.ValuesPerDay[index].ThisDate);
  };

  function showDailyWinLoss() {
    if ($scope.Report.DailyFigures == null) return;
    for (var i = 0; i < 7; i++) {
      $scope.DailyWinLossList.push($scope.Report.DailyFigures.ValuesPerDay[i].WinLoss != null ? DailyWinLoss(true, $scope.Report.DailyFigures.ValuesPerDay[i].WinLoss) : DailyWinLoss(false, null));
    }
  };

  function showDailyCashInOut() {
    if ($scope.Report.DailyFigures == null) return;
    for (var i = 0; i < 7; i++) {
      $scope.DailyCashInOutList.push($scope.Report.DailyFigures.ValuesPerDay[i].CashInOut != null ? CashInOut(true, $scope.Report.DailyFigures.ValuesPerDay[i].CashInOut) : CashInOut(false, null));
    }
  };

  function showDailyCasinoWinLoss() {
    if ($scope.Report.DailyFigures == null) return;
    for (var i = 0; i < 7; i++) {
      $scope.DailyCasinoWinLossList.push($scope.Report.DailyFigures.ValuesPerDay[i].CasinoWinLoss != null ? CasinoWinLoss(true, $scope.Report.DailyFigures.ValuesPerDay[i].CasinoWinLoss) : CasinoWinLoss(false, null));
    }
  };

  function showDailyBalance() {
    if ($scope.Report.DailyFigures == null) return;
    var balance = $scope.Report.DailyFigures.StartingBalance != null ? $scope.Report.DailyFigures.StartingBalance : 0;
    for (var i = 0; i < 7; i++) {
      balance += ($scope.Report.DailyFigures.ValuesPerDay[i].WinLoss != null ? $scope.Report.DailyFigures.ValuesPerDay[i].WinLoss : 0)
        + ($scope.Report.DailyFigures.ValuesPerDay[i].CashInOut != null ? $scope.Report.DailyFigures.ValuesPerDay[i].CashInOut : 0)
        + ($scope.Report.DailyFigures.ValuesPerDay[i].CasinoWinLoss != null ? $scope.Report.DailyFigures.ValuesPerDay[i].CasinoWinLoss : 0);
      if ($scope.Report.DailyFigures.ValuesPerDay[i].WinLoss == null && $scope.Report.DailyFigures.ValuesPerDay[i].CashInOut == null && $scope.Report.DailyFigures.ValuesPerDay[i].CasinoWinLoss == null)
        $scope.DailyBalanceList.push(Balance(false, balance));
      else
        $scope.DailyBalanceList.push(Balance(true, balance));
    }
  };

  $scope.ShowNextWeek = function () {
    $scope.CloseDailyFiguresDetails();
    if ($scope.Report.DailyFigures == null || $scope.Report.DailyFigures.WeekOffset == 0)
      return false;
    isCalendarPick = false;
    $scope.ShowDailyFigures($scope.Report.DailyFigures.WeekOffset - 1);
    return true;
  };

  $scope.ShowPreviousWeek = function () {
    $scope.CloseDailyFiguresDetails();
    if ($scope.Report.DailyFigures == null)
      return false;
    isCalendarPick = false;
    $scope.ShowDailyFigures($scope.Report.DailyFigures.WeekOffset + 1);
    return true;
  };

  $scope.CloseDailyFiguresDetails = function () {
    document.getElementById('monday').className = ('collapse');
    $scope.Arrow = -1;
  };

  $scope.ShowCurrentMonths = function () {
    if ($scope.Report.DailyFigures == null)
      return "";
    var months = ["JAN", "FEB ", "MAR", "APR", "MAY ", "JUNE", "JULY", "AUG", "SEPT", "OCT ", "NOV", "DEC"];
    var output = [];

    for (var i = 0; i < $scope.Report.DailyFigures.ValuesPerDay.length; i++) {
      var monthNum = $scope.Report.DailyFigures.ValuesPerDay[i].ThisDate.substring(0, $scope.Report.DailyFigures.ValuesPerDay[i].ThisDate.indexOf("/")) - 1;

      if (output.indexOf(months[monthNum]) < 0)
        output.push(months[monthNum]);
    }
    return output.join(" / ");
  };

  $scope.ShowPersonalInfo = function () {

  };

  $scope.ShowDailyFigures = function (weekOffset) {
    $scope.custCurrencyCode = GetCustomerCurrencyCode($scope.SelectedCustomer.CustomerId);
    $agentService.GetCustomerDailyFigures($scope.SelectedCustomer.CustomerId, weekOffset, $scope.custCurrencyCode);
    setTimeout(function () {

      jQuery('input[name="ReportDate"]').daterangepicker({
        locale: {
          firstDay: 1
        },
        singleDatePicker: true,
        showDropdowns: true,
        opens: 'left'
      },
        function (start, end, label) {
          isCalendarPick = true;
          $scope.ShowDailyFigures(moment().isoWeekday(1).week() - start.isoWeekday(1).week());
          $scope.currentDate = end.toDate();
          endDate = CommonFunctions.FormatDateTime(end.toDate(), 4);
          $rootScope.safeApply();
        });

    }, 1000); //end of date stuff
  };

  function GetCustomerCurrencyCode(customerId) {
    /*var retCurrencyCode = 'USD.';
    if ($rootScope.AgentsList[0] != null) {
     for (var i = 0; i < $rootScope.AgentsList[0].CustomersList.length; i++) {
      if ($rootScope.AgentsList[0].CustomersList[i].CustomerId == customerId) {
       retCurrencyCode = $rootScope.AgentsList[0].CustomersList[i].Currency.substring(0, 3);
       break;
      }
     }
    }
    return retCurrencyCode;
    */
    return $scope.SelectedCustomer.Currency.substring(0, 3);
  };

  $scope.ShowDateNumber = function (index) {
    if ($scope.Report.DailyFigures == null)
      return "";
  console.warn('$scope.Report.DailyFigures', $scope.Report.DailyFigures)
    var date = $scope.Report.DailyFigures.ValuesPerDay[index].ThisDate.substring($scope.Report.DailyFigures.ValuesPerDay[index].ThisDate.indexOf("/") + 1);
    return date.substring(0, date.indexOf("/"));
  };

  $scope.HighlightedClass = function (day) {

    if ($scope.Report.DailyFigures)
      return ($scope.FormatDateTime($scope.currentDate, 1) == $scope.FormatDateTime($scope.Report.DailyFigures.ValuesPerDay[day].ThisDate, 1) ? 'day_selected' : 'day_unselected');
    return null;
  };

  $scope.FormatDateTime = function (acceptedDateTime, formatCode) {
    return CommonFunctions.FormatDateTime(acceptedDateTime, formatCode);
  };

  $scope.ShowMoreDetails = function (index, category) {
    if ($scope.Report.DailyFigures == null)
      return false;
    if ($scope.Arrow != index || category != $scope.setCategory) {
      $scope.Report.CasinoTransactions = [];
      $scope.Report.CashTransactions = [];
      $scope.Report.TransactionsByDate = null;

      openDailyFiguresDetails();
      $scope.Arrow = index;
      $scope.TransactionDate = $scope.Report.DailyFigures.ValuesPerDay[index].ThisDate;
      switch (category) {
        case "cashintout":
          $scope.setCategory = "cash";
          showCashTransactions(index);
          break;
        case "winloss":
          $scope.setCategory = "winloss";
          showTransactionsbyDate($scope.Report.DailyFigures.ValuesPerDay[index].ThisDate, false);
          break;
        case "casino":
          $scope.setCategory = "casino";
          showCasinoTransactions(index);
          break;
        case "bal":
          $scope.setCategory = "bal";
          showTransactionsbyDate($scope.Report.DailyFigures.ValuesPerDay[index].ThisDate, false);
          break;
      }
    }
    return false;
  };

  function showTransactionsbyDate(date, includeCasino) {
    if ($scope.SelectedCustomer.CustomerId)
      $agentService.GetCustomerTransactionListByDate($scope.SelectedCustomer.CustomerId, date, includeCasino);
  };

  function showCashTransactions(index) {
    if ($scope.SelectedCustomer.CustomerId)
      $agentService.GetCashTransactionsByDate($scope.SelectedCustomer.CustomerId, $scope.Report.DailyFigures.ValuesPerDay[index].ThisDate);
  };

  function openDailyFiguresDetails() {
    var l = document.getElementById('monday');
    l.className = ('collapse in');
  };

  $scope.ShowEndingBalance = function () {
    if ($scope.Report.DailyFigures == null)
      return null;
    var endingBalance = $scope.Report.DailyFigures.StartingBalance + $scope.Report.DailyFigures.WinLossTotal + $scope.Report.DailyFigures.CashInOutTotal + $scope.Report.DailyFigures.CasinoWinLossTotal;
    if ($scope.Report.DailyFigures.ZeroBalance != null)
      endingBalance += $scope.Report.DailyFigures.ZeroBalance;
    return endingBalance;

  };

  $scope.ShowStartingBalance = function () {
    if (!$scope.Report.DailyFigures || $scope.Report.DailyFigures.StartingBalance == null)
      return "";
    return $scope.Report.DailyFigures.StartingBalance != null ? $scope.Report.DailyFigures.StartingBalance : 0;
  };

  $scope.ShowWinLossTotal = function () {
    if ($scope.Report.DailyFigures == null)
      return "";
    return $scope.Report.DailyFigures.WinLossTotal != null ? $scope.Report.DailyFigures.WinLossTotal : 0;
  };

  $scope.ShowCashInOutTotal = function () {
    if ($scope.Report.DailyFigures == null)
      return "";
    return $scope.Report.DailyFigures.CashInOutTotal != null ? $scope.Report.DailyFigures.CashInOutTotal : 0;
  };

  $scope.ShowCasinoWinLossTotal = function () {
    if ($scope.Report.DailyFigures == null)
      return "";
    return $scope.Report.DailyFigures.CasinoWinLossTotal != null ? $scope.Report.DailyFigures.CasinoWinLossTotal : 0;
  };

  $scope.ShowZeroBalance = function () {
    if ($scope.Report.DailyFigures == null)
      return "";
    return $scope.Report.DailyFigures.ZeroBalance != null ? $scope.Report.DailyFigures.ZeroBalance : 0;
  };

  //Daily Figures Section End

  //Open Bets Section Begin
  $scope.GetWagerStatus = function (openBet) {
    var wagerStatus = "";

    if (openBet.WagerStatus === "O") {
      wagerStatus = " (" + $scope.Translate("OPEN_BET_LABEL") + ")";
    }
    return wagerStatus;
  };

  $scope.PointsBought = function (wi) {
    var pointsbought = 0;
    var lineStr = "";
    switch (wi.ItemWagerType) {
      case "S":
        var origSpread = wi.OrigSpread;
        var finalSpread = wi.AdjSpread;
        if (origSpread !== finalSpread) pointsbought = (origSpread > 0 ? origSpread - finalSpread : Math.abs(finalSpread) - Math.abs(origSpread));
        pointsbought = Math.abs(pointsbought);
        if (wi.PeriodNumber === 0) lineStr += LineOffering.PointsBought(pointsbought);
        break;
      case "L":
        var origtpoints = wi.OrigTotalPoints;
        var finaltpoints = wi.AdjTotalPoints;
        if (origtpoints !== finaltpoints) pointsbought = (origtpoints > 0 ? origtpoints - finaltpoints : finaltpoints + origtpoints);
        pointsbought = Math.abs(pointsbought);
        if (wi.PeriodNumber === 0) lineStr += LineOffering.PointsBought(pointsbought);
        break;
    }
    return lineStr;
  };

  $scope.GetWagerItemDescription = function (fullWagerDescription, wagerItemIndex) {
    var descArray = fullWagerDescription.split('\r\n');
    if (descArray.length > 0 && descArray[wagerItemIndex])
      return descArray[wagerItemIndex].replace("Credit Adjustment", '').replace("Debit Adjustment", '');
    else return fullWagerDescription.replace("Credit Adjustment", '').replace("Debit Adjustment", '');
  };

  //All Transactions Section Begin

  $rootScope.$on('transactionListLoaded', function () {
    $scope.Report.AllTransactions = $agentService.TransactionList;
    $rootScope.safeApply();
    return true;
  });

  $scope.ShowAllTransactions = function () {
    setTimeout(function () {
      function cb(start, end) {
        var diff = end.diff(start, 'days');
        jQuery('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        if ($scope.SelectedCustomer.CustomerId)
          $agentService.GetCustomerTransactionListByDays($scope.SelectedCustomer.CustomerId, diff + 1);
        if (!$rootScope.isMobile)
          CommonFunctions.PrepareTable('performanceTbl');
      }

      cb(moment().subtract(89, 'days'), moment());
      jQuery('#reportrange').daterangepicker({
        locale: {
          firstDay: 1
        },
        startDate: moment().subtract(89, 'days'),
        ranges: {
          'Today': [moment(), moment()],
          'Yesterday': [moment().subtract(1, 'days'), moment()],
          'Last 7 Days': [moment().subtract(6, 'days'), moment()],
          'Last 30 Days': [moment().subtract(29, 'days'), moment()],
          'Last 60 Days': [moment().subtract(59, 'days'), moment()],
          'Last 90 Days': [moment().subtract(89, 'days'), moment()]
        }
      }, cb);
    }, 300); //end of date stuff
  };

  $scope.ScoredPtsHeader = function (openBetItem) {
    var resultsTitle = "";
    if (!openBetItem) return "";

    if (openBetItem.SportType != null && openBetItem.SportType == "Soccer") {
      resultsTitle += $scope.Translate("GOALS") + " "; //"Goals ";
    } else {
      resultsTitle += $scope.Translate("POINTS") + " "; //"Points ";
    }

    var periodDescripion = "";
    if (openBetItem.PeriodDescription != null)
      periodDescripion = openBetItem.PeriodDescription;

    if (openBetItem.PeriodDescription != null) {
      resultsTitle += $scope.Translate("SCORED_IN") + " " + $scope.Translate(periodDescripion); //" period:";
    }

    return resultsTitle;
  };

  $scope.WriteTeamsScores = function (openBetItem) {

    if (isNaN(openBetItem.Team1Score) || isNaN(openBetItem.Team2Score)) return $scope.Translate("Pending");

    var teamsResults = "";
    var team1Id = "";
    var team2Id = "";
    var team1Score = "";
    var team2Score = "";
    if (!openBetItem) return "";
    if (openBetItem.Team1ID != null)
      team1Id = openBetItem.Team1ID;
    if (openBetItem.Team2ID != null)
      team2Id = openBetItem.Team2ID;
    if (openBetItem.Team1Score != null)
      team1Score = openBetItem.Team1Score;
    if (openBetItem.Team2Score != null)
      team2Score = openBetItem.Team2Score;
    teamsResults += team1Id + " - " + team1Score + " / " + team2Id + " - " + team2Score;
    if (openBetItem.WagerType == "E" || openBetItem.WagerType == "L" || openBetItem.WagerType == "T") {
      teamsResults += " " + $scope.Translate("TOTAL_POINTS") + ": " + (team1Score + team2Score);
    }
    return teamsResults;
  };

  $scope.WriteWinner = function (openBetItem) {


    var team1Score = "";
    var team2Score = "";
    var winner = "";
    if (openBetItem.Team1Score != null)
      team1Score = openBetItem.Team1Score;
    if (openBetItem.Team2Score != null)
      team2Score = openBetItem.Team2Score;
    if (team1Score != team2Score) {
      var winnerId = "";
      if (openBetItem.WinnerID != null)
        winnerId = openBetItem.WinnerID;
      winner += winnerId + " " + $scope.Translate("WON PERIOD BY") + " " + Math.abs(team1Score - team2Score);
    }

    return winner;
  };

  $scope.UpdateCustomerTeaserInfo = function (teaserName, checked) {
    $scope.confirmationMsg = "";
    if (checked) {
      $agentService.AddCustomerTeaserInfo($scope.SelectedCustomer.CustomerId, teaserName).then(function (result) {
        if (result.data.d.Code != 0) {
          $scope.confirmationMsg = $scope.Translate("Error updating customer");

        } else {
          $scope.confirmationMsg = $scope.Translate("Customer updated");
        }

      });
    } else {
      $agentService.DeleteCustomerTeaserInfo($scope.SelectedCustomer.CustomerId, teaserName).then(function (result) {
        if (result.data.d.Code != 0) {
          $scope.confirmationMsg = $scope.Translate("Error updating customer");

        } else {
          $scope.confirmationMsg = $scope.Translate("Customer updated");
        }

      });
    }
  }

  $scope.UpdateCustomerParlay = function () {
    $scope.confirmationMsg = "";
    $agentService.UpdateCustomerParlayName($scope.SelectedCustomer.CustomerId, $scope.SelectedCustomer.ParlayName);
  }

  $scope.UpdateCustomerBuyPoints = function () {
    $scope.confirmationMsg = "";
    $scope.SelectedCustomer.BuyPoinstsInfo.ProgressivePointBuyingFlag = $scope.SelectedCustomer.BuyPoinstsInfo.ProgressivePointBuyingFlagBoolean ? 'Y' : 'N';
    $agentService.AddCostToBuyPointsByCustomer($scope.SelectedCustomer.BuyPoinstsInfo).then(function (result) {
      if (result.data.d.Code != 0) {
        $scope.confirmationMsg = $scope.Translate("Error updating customer");
      } else {
        if ($scope.SelectedCustomer.SellPoinstsInfo.CustomerID) _getCostToBuyPointsByCustomer($scope.SelectedCustomer.SellPoinstsInfo.CustomerID);
        $scope.confirmationMsg = $scope.Translate("Customer updated");
      }

    });
  }

  $scope.UpdateCustomerSellPoints = function () {
    $scope.confirmationMsg = "";
    $agentService.AddCostToSellPointsByCustomer($scope.SelectedCustomer.SellPoinstsInfo).then(function (result) {
      if (result.data.d.Code != 0) {
        $scope.confirmationMsg = $scope.Translate("Error updating customer");

      } else {
        _getCostToSellPointsByCustomer($scope.SelectedCustomer.SellPoinstsInfo.CustomerID);
        $scope.confirmationMsg = $scope.Translate("Customer updated");
      }

    });
  }

  //All Transactions Section End

  //All Freeplay Section Begin

  $scope.loadFreePlayData = function () {
    $agentService.GetFreePlayListByDays($scope.SelectedCustomer.CustomerId, diff + 1).then(function (result) {
      if (!result) return;
      $scope.FreePlayTransactions = result.data.d.Data;
      $scope.SelectedCustomer.FreePlayTotal = 0;
      $scope.FreePlayTransactions.forEach(function (fp) {
        $scope.SelectedCustomer.FreePlayTotal += fp.TranCode == 'C' ? fp.Amount : fp.Amount * -1;
      })
    });
  }

  $scope.ShowFreeplayTransactions = function () {
    setTimeout(function () {
      function cb(start, end) {
        diff = end.diff(start, 'days');
        jQuery('#reportrange1 span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        if ($scope.SelectedCustomer.CustomerId)
          $scope.loadFreePlayData(diff);
        if (!$rootScope.isMobile)
          CommonFunctions.PrepareTable('performanceTbl');
      }

      cb(moment().subtract(89, 'days'), moment());
      jQuery('#reportrange1').daterangepicker({
        locale: {
          firstDay: 1
        },
        startDate: moment().subtract(89, 'days'),
        ranges: {
          'Today': [moment(), moment()],
          'Yesterday': [moment().subtract(1, 'days'), moment()],
          'Last 7 Days': [moment().subtract(6, 'days'), moment()],
          'Last 30 Days': [moment().subtract(29, 'days'), moment()],
          'Last 60 Days': [moment().subtract(59, 'days'), moment()],
          'Last 90 Days': [moment().subtract(89, 'days'), moment()]
        }
      }, cb);
    }, 1000); //end of date stuff
  };

  $scope.limits = {
    creditLimitAmt: null,
    tmpCreditLimitAmt: null,
    quickLimitAmt: null,
    tmpQuickLimitAmt: null,
    tmpCreditAdjDateThru: null,
    tmpQuickAdjDateThru: null,
    settleLimitAmt: null
  };


  $scope.PostQuickLimitsTransaction = function () {
    $scope.ErrorMessage = '';
    if ($scope.limits.tmpCreditLimitAmt != null && $scope.limits.tmpCreditLimitAmt != "") {
      var date;
      try {
        date = new Date($scope.limits.tmpCreditAdjDateThru);
      } catch (err) { }

      if (typeof date.getMonth !== 'function') {
        alert($scope.Translate('Select a Valid Date.'));
        return;
      }
      var d1 = $agentService.GetServerDateTime();
      if (date < d1) {
        alert($scope.Translate('Select a Valid Date.'));
        return;
      }
    }

    if ($scope.limits.tmpCreditLimitAmt != null && $scope.limits.tmpCreditLimitAmt != "" && ($scope.limits.tmpCreditAdjDateThru == null || $scope.limits.tmpCreditAdjDateThru == "")
      && Number(($scope.limits.tmpCreditLimitAmt + "").replace(',', '')) > 0) {
      alert($scope.Translate('Select an Ending Date.'));
      return;
    }

    if ($scope.limits.tmpQuickLimitAmt != null && $scope.limits.tmpQuickLimitAmt != "" && ($scope.tmpQuickAdjDateThru == null || $scope.tmpQuickAdjDateThru == "")
      && Number(($scope.limits.tmpQuickLimitAmt + "").replace(',', '')) > 0) {
      alert($scope.Translate('Select an Ending Date.'));
      return;
    }
    var customerId = $scope.SelectedCustomer.CustomerId;
    var creditLimitAmt = null;
    try {
      creditLimitAmt = Math.round(parseFloat($scope.limits.creditLimitAmt != null ? $scope.limits.creditLimitAmt : $scope.SelectedCustomer.CreditLimit / 100));
    }
    catch (err) {
    }
    $scope.detailLimitCreditLimitPostedMsg = "";
    if (creditLimitAmt != null && creditLimitAmt != ($scope.SelectedCustomer.CreditLimit / 100)) {
      $agentService.ChangeCustomerCreditLimit(customerId, (creditLimitAmt * 100), null).then(function (result) {
        if (result.data.d.Code == 1) {
          alert($scope.Translate('Error posting the transaction.'));
        }
        $scope.SelectedCustomer.CreditLimit = creditLimitAmt * 100;
        $scope.UpdateCustomerBalance($scope.SelectedCustomer.CustomerId, $scope.SelectedCustomer.CurrentBalance);
        $scope.detailLimitCreditLimitPostedMsg = $scope.Translate('Credit Limit Adjustment for ') + CommonFunctions.FormatNumber(creditLimitAmt, false, false) + $scope.Translate(' Posted correctly.');
      });
    };

    var tmpCreditLimitAmt = null;
    try {
      tmpCreditLimitAmt = Math.round(parseFloat($scope.limits.tmpCreditLimitAmt ? $scope.limits.tmpCreditLimitAmt : $scope.SelectedCustomer.TempCreditAdj / 100));
    }
    catch (err) {
    }
    $scope.detailLimitTempPostedMsg = "";
    if (tmpCreditLimitAmt != null && tmpCreditLimitAmt != ($scope.SelectedCustomer.TempCreditAdj / 100)) {
      $agentService.ChangeCustomerTempCreditLimit(customerId, tmpCreditLimitAmt != null ? (tmpCreditLimitAmt * 100) : $scope.SelectedCustomer.TempCreditAdj, date).then(function (result) {
        if (result.data.d.Code == 1) {
          alert($scope.Translate('Error posting the transaction.'));
        }
        $scope.SelectedCustomer.TempCreditAdj = tmpCreditLimitAmt * 100;
        $scope.SelectedCustomer.TempCreditAdjExpDate = date;
        $scope.SelectedCustomer.TempCreditAdjExpDateString = CommonFunctions.FormatDateTime(date, 4);
        $scope.UpdateCustomerBalance($scope.SelectedCustomer.CustomerId, $scope.SelectedCustomer.CurrentBalance);
        $scope.detailLimitTempPostedMsg = $scope.Translate('Temp Credit Limit Adjustment for ') + CommonFunctions.FormatNumber(tmpCreditLimitAmt, false, false) + $scope.Translate(' Posted correctly.');
      });
    }

    //////////////////////////////

    var qDate;
    if (Number(($scope.limits.tmpQuickLimitAmt + "").replace(',', '')) > 0) {
      try {
        qDate = new Date($scope.tmpQuickAdjDateThru);
        //Allan: Until
        //qDate.setDate(qDate.getDate() + 1);
      } catch (err) {
      }

      if (typeof qDate.getMonth !== 'function') {
        alert($scope.Translate('Select a Valid Date.'));
        return;
      }
      var qd1 = $agentService.GetServerDateTime();

      if (qDate < qd1) {
        alert($scope.Translate('Select a Valid Date.'));
        return;
      }
    } else qDate = null;

    var qtranAmount = null;
    try {
      qtranAmount = Math.round(parseFloat($scope.limits.quickLimitAmt != null ? $scope.limits.quickLimitAmt : $scope.SelectedCustomer.WagerLimit / 100));
    }
    catch (err) {
    }

    $scope.quickLimitTranPostedMsg = "";
    if (qtranAmount != null && qtranAmount != ($scope.SelectedCustomer.WagerLimit / 100)) {
      $agentService.ChangeCustomerQuickLimit(customerId, (qtranAmount * 100), null).then(function (result) {
        if (result.data.d.Code == 1) {
          alert($scope.Translate('Error posting the transaction.'));
        }
        $scope.SelectedCustomer.WagerLimit = qtranAmount * 100;
        $scope.UpdateCustomerBalance($scope.SelectedCustomer.CustomerId, $scope.SelectedCustomer.CurrentBalance);
        $scope.quickLimitTranPostedMsg = $scope.Translate('Quick Limit Adjustment for ') + CommonFunctions.FormatNumber(qtranAmount, false, false) + $scope.Translate(' Posted correctly.');
      });
    };

    var tmpQuickLimitAmt = null;
    try {
      tmpQuickLimitAmt = Math.round(parseFloat($scope.limits.tmpQuickLimitAmt ? $scope.limits.tmpQuickLimitAmt : $scope.SelectedCustomer.TempWagerLimit / 100));
    }
    catch (err) {
    }

    $scope.quickLimitTempPostedMsg = "";
    if ($scope.limits.tmpQuickLimitAmt != null) {
      $agentService.ChangeCustomerTempQuickLimit(customerId, (tmpQuickLimitAmt * 100), qDate).then(function (result) {
        if (result.data.d.Code == 1) {
          alert($scope.Translate('Error posting the transaction.'));
        }
        $scope.SelectedCustomer.TempWagerLimit = tmpQuickLimitAmt * 100;
        $scope.SelectedCustomer.TempWagerLimitExpiration = qDate;
        $scope.UpdateCustomerBalance($scope.SelectedCustomer.CustomerId, $scope.SelectedCustomer.CurrentBalance);
        $scope.quickLimitTempPostedMsg = $scope.Translate('Temp Quick Limit Adjustment for ') + CommonFunctions.FormatNumber(tmpQuickLimitAmt, false, false) + $scope.Translate(' Posted correctly.');
      });
    };
    $scope.UpdateCustomerInfo();
    $scope.ErrorMessage = $scope.Translate('Updated Correctly');
  };

  $scope.UpdateCustomerAccess = function (customerId, object, e) {
    if ($scope.SuspendWagering == false) {
      return;
    }
    $scope.SelectedCustomer[object] = !$scope.SelectedCustomer[object];
    var accessValue = $scope.SelectedCustomer[object] ? "Y" : "N";
    $agentService.UpdateCustomerAccess($scope.SelectedCustomer.CustomerId, e.target.id, accessValue);
  };

  $scope.GetWeekDayName = function (idx) {
    return $agentService.GetWeekDayName(idx);
  };

  $scope.updateCustomerAccess = function (value, code) {
    let accessValue = value ? 'Y' : 'N';
    $agentService.UpdateCustomerAccess($scope.SelectedCustomer.CustomerId, code, accessValue).then(function () {
    });
  }

  //All FreePlay Section End


  function _getCountries() {
    jQuery.getJSON("/data/countries/countries.json", function (data) {
      $scope.CountryList = data.Countries;
    }).fail(function () {
      console.log("An error has occurred.");
    });
  }

  function _getTimeZones() {
    $scope.TimeZoneList = [
      { TzAbbreviation: "PST", TzName: $scope.Translate("Pacific"), TzCode: 3 },
      { TzAbbreviation: "CST", TzName: $scope.Translate("Central"), TzCode: 1 },
      { TzAbbreviation: "EST", TzName: $scope.Translate("Eastern"), TzCode: 0 },
      { TzAbbreviation: "MST", TzName: $scope.Translate("Mountain"), TzCode: 2 }]
  }

  function _getPriceTypes() {

    $scope.PriceTypesList = [
      { PtAbbreviation: "A", PtName: $scope.Translate("American") },
      { PtAbbreviation: "F", PtName: $scope.Translate("Decimal") },
      { PtAbbreviation: "D", PtName: $scope.Translate("Fractional") }];
  }

  function _getWeekDays() {

    $scope.WeekDayList = [
      { name: $scope.Translate('Monday'), value: 1 },
      { name: $scope.Translate('Tuesday'), value: 2 },
      { name: $scope.Translate('Wednesday'), value: 3 },
      { name: $scope.Translate('Thursday'), value: 4 },
      { name: $scope.Translate('Friday'), value: 5 },
      { name: $scope.Translate('Saturday'), value: 6 },
      { name: $scope.Translate('Sunday'), value: 7 },
      { name: $scope.Translate('All week'), value: 0 }
    ]
  }

  function _getParlaySpecs() {
    $scope.confirmationMsg = "";
    $agentService.GetParlaysSpecs().then(function (result) {
      $scope.ParlaySpecsList = result.data.d.Data;
    })
  }

  function _getTeaserSpecs(customerId) {
    $scope.confirmationMsg = "";
    $agentService.GetTeaserSpecs().then(function (result) {
      $scope.TeaserSpecsList = result.data.d.Data;
      _getCustomerTeaserSpecs(customerId)
    })
  }

  function _getCustomerTeaserSpecs(customerId) {
    $scope.confirmationMsg = "";
    $agentService.GetCustomerTeaserSpecs(customerId).then(function (result) {
      let customerTeaserSpecsList = result.data.d.Data;
      $scope.TeaserSpecsList.forEach(function (e) {
        e.checked = customerTeaserSpecsList.some(x => x.TeaserName == e.TeaserName)
      });
      $scope.safeApply();
    })
  }

  function _getCostToSellPointsByCustomer(customerId) {
    $scope.confirmationMsg = "";
    $agentService.GetCostToSellPointsByCustomer(customerId).then(function (result) {
      $scope.SelectedCustomer.SellPoinstsInfo = result.data.d.Data ? result.data.d.Data : {};
    })
  }

  function _getCostToBuyPointsByCustomer(customerId) {
    $scope.confirmationMsg = "";
    $agentService.GetCostToBuyPointsByCustomer(customerId).then(function (result) {
      $scope.SelectedCustomer.BuyPoinstsInfo = result.data.d.Data ? result.data.d.Data : {};
      $scope.SelectedCustomer.BuyPoinstsInfo.ProgressivePointBuyingFlagBoolean = $scope.SelectedCustomer.BuyPoinstsInfo != null ? $scope.SelectedCustomer.BuyPoinstsInfo.ProgressivePointBuyingFlag == 'Y' : false;
    })
  }

  function _fillSelectedCustomerBooleanValues() {
    $scope.SelectedCustomer.CasinoActiveBoolean = $scope.SelectedCustomer.CasinoActive == 'Y';
    $scope.SelectedCustomer.ZeroBalanceFlagBoolean = $scope.SelectedCustomer.ZeroBalanceFlag == 'Y';
    $scope.SelectedCustomer.ZeroBalPositiveOnlyFlagBoolean = $scope.SelectedCustomer.ZeroBalPositiveOnlyFlag == 'Y';
    $scope.SelectedCustomer.WeeklyLimitFlagBoolean = $scope.SelectedCustomer.WeeklyLimitFlag == 'Y';
    $scope.SelectedCustomer.WiseActionFlagBoolean = $scope.SelectedCustomer.WiseActionFlag == 'Y';
    $scope.SelectedCustomer.CustomerIsABotBoolean = $scope.SelectedCustomer.CustomerIsABot == 1;
    $scope.SelectedCustomer.InstantActionFlagBoolean = $scope.SelectedCustomer.InstantActionFlag == 'Y';


    $scope.SelectedCustomer.StaticLinesFlagBoolean = $scope.SelectedCustomer.StaticLinesFlag == 'Y';
    $scope.SelectedCustomer.EnableRifFlagBoolean = $scope.SelectedCustomer.EnableRifFlag == 'Y';
    $scope.SelectedCustomer.UsePuckLineFlagBoolean = $scope.SelectedCustomer.UsePuckLineFlag == 'Y';
    $scope.SelectedCustomer.CreditAcctFlagBoolean = $scope.SelectedCustomer.CreditAcctFlag == 'Y';
    $scope.SelectedCustomer.LimitRifToRiskFlagBoolean = $scope.SelectedCustomer.LimitRifToRiskFlag == 'Y';
    $scope.SelectedCustomer.EasternLineFlagBoolean = $scope.SelectedCustomer.EasternLineFlag == 'Y';

    $scope.SelectedCustomer.HalfPointCuBasketballFlagBoolean = $scope.SelectedCustomer.HalfPointCuBasketballFlag == 'Y';
    $scope.SelectedCustomer.HalfPointInetBasketballFlagBoolean = $scope.SelectedCustomer.HalfPointInetBasketballFlag == 'Y';
    $scope.SelectedCustomer.HalfPointCuFootballFlagBoolean = $scope.SelectedCustomer.HalfPointCuFootballFlag == 'Y';
    $scope.SelectedCustomer.HalfPointInetFootballFlagBoolean = $scope.SelectedCustomer.HalfPointInetFootballFlag == 'Y';
    $scope.SelectedCustomer.HalfPointDenyTotalsFlagBoolean = $scope.SelectedCustomer.HalfPointDenyTotalsFlag == 'Y';
    $scope.SelectedCustomer.HalfPointWagerLimitFlagBoolean = $scope.SelectedCustomer.HalfPointWagerLimitFlag == 'Y';
  }

  $scope.DeleteTransaction = function (documentNumber) {
    if ($scope.AgentInfo.EnterTransactionFlag != 'Y') { alert('You are not allowed'); return; };
    Swal.fire({
      title: $scope.Translate('Are you sure?'),
      text: $scope.Translate("You won't be able to revert this!"),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: $scope.Translate('Yes, delete it!')
    }).then((result) => {
      if (result.isConfirmed) {
        $agentService.DeleteTransaction({ documentNumber: documentNumber }).then(function (response) {
          if (response.data.d.Code == 0) {
            Swal.fire(
              $scope.Translate('Deleted!'),
              $scope.Translate('The transaction has been deleted.'),
              'success'
            );
            $scope.ShowAllTransactions();
            $scope.UpdateCustomerBalance($scope.SelectedCustomer.CustomerId);
          } else {
            Swal.fire(
              $scope.Translate('Error!'),
              '',
              'error'
            )
          }
        })
      }
    })
  }

  $scope.Init();

}]);