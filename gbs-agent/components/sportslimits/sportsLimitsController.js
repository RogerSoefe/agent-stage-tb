appModule.controller("sportsLimitsController", [
  '$scope', '$agentService', '$rootScope', function ($scope, $agentService, $rootScope) {
    if ($scope.AgentInfo.EnableVigSetupFlag != 'Y' && $scope.AgentInfo.EnableEditDetailedLimitsFlag != 'Y' && $scope.AgentInfo.EnableDenySportsFlag != 'Y' && $scope.AgentInfo.EnableSetEarlyLimitsFlag != 'Y') {
      document.location.href = '#/';
      return;
    }
    let sportLimitsToUpdate = [];
    let selectedPlayersList = [];
    $scope.FlatPrices = [-105, -110];
    $scope.PackageTypes = {
      wagerLimits: false, juiceDiscount: false, denyAllow: false, flatPricing: false, detailLimits: {}, denySports: {}, vigDiscount: {}, earlyLimits: {} };
    $scope.buttonStatus = $scope.Translate("Send package");
    $scope.agentTree = [];
    $scope.Selection = {};
    $scope.SportsLimits = [];
    $scope.subWagerTypes = [$scope.Translate('Spread / Run Line Settings'), $scope.Translate('Money Line'), $scope.Translate('Total Points'), $scope.Translate('Team Total')];
    $scope.selectedWagerSubType = 0;
    $scope.settingTypes = [];
    if ($scope.AgentInfo.EnableEditDetailedLimitsFlag == 'Y') {
      $scope.settingTypes.push({ name: $scope.Translate('Detail Limits'), val: 0 });
    }
    if ($scope.AgentInfo.EnableDenySportsFlag == 'Y') {
      $scope.settingTypes.push({ name: $scope.Translate('Deny Sports'), val: 1 });
    }
    if ($scope.AgentInfo.EnableVigSetupFlag == 'Y') {
      $scope.settingTypes.push({ name: $scope.Translate('VIG Setup'), val: 2 });
    }
    if ($scope.AgentInfo.EnableSetEarlyLimitsFlag == 'Y') {
      $scope.settingTypes.push({ name: $scope.Translate('Early Limits'), val: 3 });
    }
    $scope.selectedSettingType = $scope.settingTypes[0];
    $scope.selectedCustomers = []; $scope.mddSettings = { displayProp: 'id' };
    $scope.eventsCustomersApply = { onItemSelect: function (item) { getSliceCustomerArray(); getCustomerDetailedLimits(); }, onItemDeselect: function (item) { getSliceCustomerArray(); getCustomerDetailedLimits(); } };
    $scope.custDetailLimitByPeriod = null;
    function getSliceCustomerArray() {
      $scope.selectedCustomersA = $scope.selectedCustomers.slice(0, Math.round($scope.selectedCustomers.length / 2));
      $scope.selectedCustomersB = $scope.selectedCustomers.slice(Math.round($scope.selectedCustomers.length / 2), $scope.selectedCustomers.length + 1);
    }

    async function init() {
      $scope.LoadingReportData = false;
      if (!$scope.Sports) await getSports();
      if ($scope.AgentAsCustomerInfo && $scope.AllAgentsList && $scope.AllAgentsList.length > 0) {
        $scope.getData($scope.AllAgentsList[0].AgentId);
        $scope.getAgentPlayers($scope.AllAgentsList[0].AgentId);
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.getData($scope.AllAgentsList[0].AgentId);
          $scope.getAgentPlayers($scope.AllAgentsList[0].AgentId);
        });
      }
    }

    function getCustomerDetailedLimits() {
      if (!$scope.AgentCustomers || $scope.selectedCustomers.length ==  0 || $scope.selectedCustomers.length == $scope.AgentCustomers.length) {
        $scope.custDetailLimitByPeriod = null;
        return;
      }
      let selectedPlayersListString = $scope.selectedCustomers.map(x => x.id.trim()).join(",");
      const params = { agentId: $scope.AllAgentsList[0].AgentId, sportType: $scope.SelectedSport.SportType, sportSubtype: $scope.SelectedSubsport.sportSubType, customerId: selectedPlayersListString, periodNumber: null };
      $agentService.GetCustomerDetailedLimits(params).then(function (result) {
        $scope.custDetailLimitByPeriod = CommonFunctions.groupBy(result, 'PeriodNumber');
        $rootScope.safeApply();
      })
    };
    $scope.getAgentPlayers = function (agentId) {
      $agentService.GetAgentPlayers(agentId).then(function (result) {
        let players = result.data.d.Data;
        if (players) {
          $scope.AgentCustomers = players.map(function (p) {
            return { id: p, label: p }
          });
          $scope.selectedCustomers = [...$scope.AgentCustomers];
        }
      });
    }

    async function getSports() {
      $scope.Sports = [];
      let sports = (await $agentService.GetSports());
      $scope.Sports = sports;
      $scope.SelectedSport = $scope.Sports[0];
    }

    $scope.ChangeLimit = function (sportLimit, wagerType) {
      sportLimit.Changed = true;
      $scope.PackageTypes.detailLimits.check = $scope.PackageTypes.detailLimits.check ? true : $scope.selectedSettingType.val == 0;
      $scope.PackageTypes.denySports.check = $scope.PackageTypes.denySports.check ? true : $scope.selectedSettingType.val == 1;
      $scope.PackageTypes.vigDiscount.check = $scope.PackageTypes.vigDiscount.check ? true : $scope.selectedSettingType.val == 2;
      $scope.PackageTypes.earlyLimits.check = $scope.PackageTypes.earlyLimits.check ? true : $scope.selectedSettingType.val == 3;

      if ($scope.selectedSettingType.val == 0) {
        $scope.PackageTypes.detailLimits[wagerType] = true;
      }
      if ($scope.selectedSettingType.val == 1) {
        $scope.PackageTypes.denySports[wagerType] = true;
      }
      if ($scope.selectedSettingType.val == 2) {
        $scope.PackageTypes.vigDiscount[wagerType] = true;
      }
      if ($scope.selectedSettingType.val == 3) {
        $scope.PackageTypes.earlyLimits[wagerType] = true;
      }
      
      for (let i = 0; i < sportLimitsToUpdate.length; i++) {
        let e = sportLimitsToUpdate[i];
        if (e.sportSubType == sportLimit.sportSubType && sportLimit.period.PeriodNumber == e.period.PeriodNumber && sportLimit.period.PeriodDescription == e.period.PeriodDescription) {
          e = sportLimit;
          return;
        }
      }
      sportLimitsToUpdate.push(sportLimit);
    };

    $scope.MoveToTop = function (subSport) {
      if ($rootScope.IsMobile)
        jQuery('#div_sport').animate({
          scrollTop: jQuery("#sportRow_" + subSport).offset().top
        }, 'fast');
    };

    $scope.GetSportLimits = async function (customerId) {
      $scope.showLoadingGif('loadingSportLimits');
      if (!$scope.Selection.Customer) $scope.Selection.Customer = $scope.AllAgentsList[0];
      $scope.SportsLimits = [];
      $scope.LoadingReportData = true;
      for (let i = 0; i < $scope.availablePeriods.length; i++) {
        let x = $scope.availablePeriods[i];
        x.Checkbox = x.PeriodNumber == $scope.selectedPeriod.PeriodNumber;
        let result = (await $agentService.GetDetailWagerLimits(customerId, $scope.SelectedSport.SportType, x.PeriodNumber));
        result.data.d.Data.forEach(function (s) {
          s.period = x;
          s.spreadEarlyLimitType = s.spreadELTime > 0 ? 't' : 'h';
          s.moneyLineEarlyLimitType = s.moneyELTime > 0 ? 't' : 'h';
          s.totalPointsEarlyLimitType = s.totalELTime > 0 ? 't' : 'h';
          s.teamTotalPointsEarlyLimitType = s.teamTotalELTime > 0 ? 't' : 'h';
          s.newSpreadELTime = s.spreadELTime > 0 ? integerToHour(s.spreadELTime / 100) : null;
          s.newMoneyELTime = s.moneyELTime > 0 ? integerToHour(s.moneyELTime / 100) : null;
          s.newTotalELTime = s.totalELTime > 0 ? integerToHour(s.totalELTime / 100) : null;
          s.newTeamTotalELTime = s.teamTotalELTime > 0 ? integerToHour(s.teamTotalELTime / 100) : null;

          s.newSpreadELTimeHour = s.spreadELTime <= 0 ? s.spreadELTime / 100 * -1 : null;
          s.newMoneyELTimeHour = s.moneyELTime <= 0 ? s.moneyELTime / 100 * -1 : null;
          s.newTotalELTimeHour = s.totalELTime <= 0 ? s.totalELTime / 100 * -1 : null;
          s.newTeamTotalELTimeHour = s.teamTotalELTime <= 0 ? s.teamTotalELTime / 100 * -1 : null;

          s.spreadELTime = Math.abs(s.spreadELTime) / 100;
          s.moneyELTime = Math.abs(s.moneyELTime) / 100;
          s.totalELTime = Math.abs(s.totalELTime) / 100;
          s.teamTotalELTime = Math.abs(s.teamTotalELTime) / 100;

          s.spreadOriginalFlat = ((s.spreadCentsDifference / 2) + 100) * -1;
          s.moneyLineOriginalFlat = ((s.moneyLineCentsDifference / 2) + 100) * -1;
          s.totalPointsOriginalFlat = ((s.totalPointsCentsDifference / 2) + 100) * -1;
          s.teamTotalPointsOriginalFlat = ((s.teamTotalPointsCentsDifference / 2) + 100) * -1;
          s.spreadDesiredPrice = parseInt((s.spreadIsIncrease ?
            (Math.abs(s.spreadOriginalFlat) + (s.spreadCentsDifference / 2 * (s.spreadCuVigDiscountInetPercent / 100))) * -1 :
            (Math.abs(s.spreadOriginalFlat) - (s.spreadCentsDifference / 2 * (s.spreadCuVigDiscountInetPercent / 100))) * -1)).toString();
          s.moneyLineDesiredPrice = parseInt((s.moneyIsIncrease ?
            (Math.abs(s.moneyLineOriginalFlat) + (s.moneyLineCentsDifference / 2 * (s.moneyLineCuVigDiscountInetPercent / 100))) * -1 :
            (Math.abs(s.moneyLineOriginalFlat) - (s.moneyLineCentsDifference / 2 * (s.moneyLineCuVigDiscountInetPercent / 100))) * -1)).toString();
          s.totalPointsDesiredPrice = parseInt((s.totalPointsIsIncrease ?
            (Math.abs(s.totalPointsOriginalFlat) + (s.totalPointsCentsDifference / 2 * (s.totalPointsCuVigDiscountInetPercent / 100))) * -1 :
            (Math.abs(s.totalPointsOriginalFlat) - (s.totalPointsCentsDifference / 2 * (s.totalPointsCuVigDiscountInetPercent / 100))) * -1)).toString();
          s.teamTotalPointsDesiredPrice = parseInt((s.teamTotalPointsIsIncrease ?
            (Math.abs(s.teamTotalPointsOriginalFlat) + (s.teamTotalPointsCentsDifference / 2 * (s.teamTotalPointsCuVigDiscountInetPercent / 100))) * -1 :
            (Math.abs(s.teamTotalPointsOriginalFlat) - (s.teamTotalPointsCentsDifference / 2 * (s.teamTotalPointsCuVigDiscountInetPercent / 100))) * -1)).toString();

          s.spreadCorrelatedParlayDenied = !s.spreadCorrelatedParlayDenied;
          s.moneyLineCorrelatedParlayDenied = !s.moneyLineCorrelatedParlayDenied;
          s.totalPointsCorrelatedParlayDenied = !s.totalPointsCorrelatedParlayDenied;
        });
        $scope.SportsLimits = [...$scope.SportsLimits, ...result.data.d.Data];
      }
      $scope.subSports = getUniqueSubSports($scope.SportsLimits);
      $scope.SelectedSubsport = $scope.subSports[0];
      /*$scope.SelectedSubsport = $scope.SelectedSubsport && currentSportType.sportSubType == $scope.SelectedSubsport.sportSubType ?
      $scope.SportsLimits.find(x => x.sportSubType == $scope.SelectedSubsport.sportSubType) : $scope.SportsLimits[0];*/
      $scope.LoadingReportData = false;
      currentSportType = { ...$scope.SelectedSubsport };
      getCustomerDetailedLimits();
      setTimeout(function () {
        if (!$rootScope.IsMobile)
          jQuery('table.tablesaw').fixedHeader({
            topOffset: 65
          });
        jQuery('input[name="expDate"]').daterangepicker({
          locale: {
            firstDay: 1
          },
          singleDatePicker: true,
          showDropdowns: true,
          opens: 'left'
        });
        jQuery('.clockpicker').clockpicker({
          donetext: 'Done'
        });
        $scope.hideLoadingGif('loadingSportLimits');
      }, 1000);
    };

    function integerToHour(num) {
      num = num.toString();
      num = num.length < 4 ? '0' + num : num;
      let hourPart = num.substring(0, 2);
      let minutePart = num.substring(2, 4);
      return `${hourPart}:${minutePart}`

    }

    function getUniqueSubSports(array) {

      let uniqueArray = [...new Map(array.map(item =>
        [item['sportSubType'], item])).values()];
      let first = 'All';
      return uniqueArray.sort(function (x, y) { return x.sportSubType.trim() == first ? -1 : y.sportSubType.trim() == first ? 1 : 0; });
    }

    $scope.subSportChanged = function () {
      currentSportType = { ...$scope.SelectedSubsport };
      getCustomerDetailedLimits();
      setTimeout(function () {
        jQuery('.clockpicker').clockpicker({
          donetext: 'Done'
        });
      }, 200);
    }

    $scope.getData = function (customerId) {
      $agentService.GetAvailablePeriodsBySport({ sportType: $scope.SelectedSport.SportType, sportSubType: "" }).then(function (result) {
        $scope.availablePeriods = result.data.d.Data;
        $scope.selectedPeriod = $scope.availablePeriods[0];
        $scope.GetSportLimits(customerId);
      });
    }

    $scope.selectCustomer = function (c) {
      if (c.CustomerID != $scope.Translate('All')) {
        $scope.AgentCustomers[0].Checkbox = false;
      } else {
        if ($scope.AgentCustomers[0].Checkbox == true) {
          $scope.AgentCustomers.forEach((x, i) => { if (i > 0) x.Checkbox = false });
        }
      }
    }


    function sendPackage(period) {
        $agentService.SendWagerLimitsPackage({
        agentId: $scope.Selection.Customer.AgentId,
        wagerLimits: true,
        juiceDiscount: true,
        denyAllow: true,
        flatPricing: true,
        hideLine: true,
        maxMoneyLine: true,
        maxParlayBet: true,
        denyParlay: true,
        parlayInCorrelated: true,
        sendEarlyLimit: true,
        periodNumber: period.PeriodNumber,
        sportType: $scope.SelectedSport.SportType.trim(),
        sportSubType: $scope.SelectedSubsport.sportSubType.trim()
      }).then(() => getCustomerDetailedLimits());
    };

    $scope.saveSportLimits = async function () {
      let selectedPeriods = $scope.availablePeriods.filter(x => x.Checkbox == true);
      if (selectedPeriods.length == 0) {
        $scope.fireSwal($scope.Translate('Attention'), $scope.Translate('Select at least one period to apply'), 'warning')
        return;
      }
      if ($scope.selectedCustomers.length == 0) {
        $scope.fireSwal($scope.Translate('Attention'), $scope.Translate('Select at least one customer to apply'), 'warning')
        return;
      }
      if ($scope.selectedCustomers.length < $scope.AgentCustomers.length) {
        for (let i = 0; i < $scope.selectedCustomers.length; i++) {
          let customer = $scope.selectedCustomers[i];
          await ($scope.UpdateCustomerSportLimits(true, customer.id, sendPackage));
        }
        /*$scope.selectedCustomers.forEach(function (customer) {
          selectedPeriods.forEach(async function () {
            await ($scope.UpdateCustomerSportLimits(true, customer.id, sendPackage));
          });
        })*/
      } else {
        await ($scope.UpdateCustomerSportLimits(true, $scope.Selection.Customer.AgentId, sendPackage));
        /*selectedPeriods.forEach(async function () {
          await ($scope.UpdateCustomerSportLimits(true, $scope.Selection.Customer.AgentId, sendPackage));
        });*/
      }
      sportLimitsToUpdate = [];
      $scope.fireSwal($scope.Translate('Success'), $scope.Translate('Sport limit had been updated'), 'success', function () { jQuery('#confirmationModal').modal('hide'); });
      $scope.PackageTypes = {
        wagerLimits: false, juiceDiscount: false, denyAllow: false, flatPricing: false, detailLimits: {}, denySports: {}, vigDiscount: {}, earlyLimits: {}
      };
    }

    $scope.showModal = function (modalId) {
      jQuery('#confirmationModal').modal('show');
    }

    $scope.UpdateCustomerSportLimits = async function (showMessage = true, customerId, callback) {
      if (!$scope.Selection.Customer) return;
      for (let i = 0; i < sportLimitsToUpdate.length; i++) {
        let e = sportLimitsToUpdate[i];
        let period = e.period;
        //if (e.Changed == false) return;
        //e.Changed = false;
        await $agentService.UpdateCustomerSportsLimits(
          e.newCuSpreadLimit != null ? (!e.newCuSpreadLimit || e.newCuSpreadLimit == 0) ? 0 : e.newCuSpreadLimit * 100 : e.cuSpreadLimit,
          e.newInetSpreadLimit != null ? (!e.newInetSpreadLimit || e.newInetSpreadLimit == 0) ? 0 : e.newInetSpreadLimit * 100 : e.inetSpreadLimit,
          e.newCuMoneyLineLimit != null ? (!e.newCuMoneyLineLimit || e.newCuMoneyLineLimit == 0) ? 0 : e.newCuMoneyLineLimit * 100 : e.cuMoneyLineLimit,
          e.newInetMoneyLineLimit != null ? (!e.newInetMoneyLineLimit || e.newInetMoneyLineLimit == 0) ? 0 : e.newInetMoneyLineLimit * 100 : e.inetMoneyLineLimit,
          e.newCuTotalPointsLimit != null ? (!e.newCuTotalPointsLimit || e.newCuTotalPointsLimit == 0) ? 0 : e.newCuTotalPointsLimit * 100 : e.cuTotalPointsLimit,
          e.newInetTotalPointsLimit != null ? (!e.newInetTotalPointsLimit || e.newInetTotalPointsLimit == 0) ? 0 : e.newInetTotalPointsLimit * 100 : e.inetTotalPointsLimit,
          e.newCuTeamTotalPointsLimit != null ? (!e.newCuTeamTotalPointsLimit || e.newCuTeamTotalPointsLimit == 0) ? 0 : e.newCuTeamTotalPointsLimit * 100 : e.cuTeamTotalPointsLimit,
          e.newInetTeamTotalPointsLimit != null ? (!e.newInetTeamTotalPointsLimit || e.newInetTeamTotalPointsLimit == 0) ? 0 : e.newInetTeamTotalPointsLimit * 100 : e.inetTeamTotalPointsLimit,

          e.newSpreadEL != null ? e.newSpreadEL == 0 ? 0 : e.newSpreadEL * 100 : e.spreadEL,
          e.newMoneyEL != null ? e.newMoneyEL == 0 ? 0 : e.newMoneyEL * 100 : e.moneyEl,
          e.newTotalEL != null ? e.newTotalEL == 0 ? 0 : e.newTotalEL * 100 : e.totalEL,
          e.newTeamTotalEL != null ? e.newTeamTotalEL == 0 ? 0 : e.newTeamTotalEL * 100 : e.teamTotalEL,

          e.spreadEarlyLimitType == 't' && e.newSpreadELTime ? e.newSpreadELTime.replace(':', '') + '00' : e.spreadEarlyLimitType == 'h' && e.newSpreadELTimeHour ? e.newSpreadELTimeHour * -100 : e.spreadELTime * -100,
          e.moneyLineEarlyLimitType == 't' && e.newMoneyELTime ? e.newMoneyELTime.replace(':', '') + '00' : e.moneyLineEarlyLimitType == 'h' && e.newMoneyELTimeHour ? e.newMoneyELTimeHour * -100 : e.moneyELTime * -100,
          e.totalPointsEarlyLimitType == 't' && e.newTotalELTime ? e.newTotalELTime.replace(':', '') + '00' : e.totalPointsEarlyLimitType == 'h' && e.newTotalELTimeHour ? e.newTotalELTimeHour * -100 : e.totalELTime * -100,
          e.teamTotalPointsEarlyLimitType == 't' && e.newTeamTotalELTime ? e.newTeamTotalELTime.replace(':', '') + '00' : e.teamTotalPointsEarlyLimitType == 'h' && e.newTeamTotalELTimeHour ? e.newTeamTotalELTimeHour * -100 : e.teamTotalELTime * -100,

          e.newSpreadHideLimitTime != null ? (!e.newSpreadHideLimitTime || e.newSpreadHideLimitTime == 0) ? 0 : e.newSpreadHideLimitTime * 100 : e.spreadHideLimitTime,
          e.newMoneyLineHideLimitTime != null ? (!e.newMoneyLineHideLimitTime || e.newMoneyLineHideLimitTime == 0) ? 0 : e.newMoneyLineHideLimitTime * 100 : e.moneyLineHideLimitTime,
          e.newTotalPointsHideLimitTime != null ? (!e.newTotalPointsHideLimitTime || e.newTotalPointsHideLimitTime == 0) ? 0 : e.newTotalPointsHideLimitTime * 100 : e.totalPointsHideLimitTime,
          e.newTeamTotalPointsHideLimitTime != null ? (!e.newTeamTotalPointsHideLimitTime || e.newTeamTotalPointsHideLimitTime == 0) ? 0 : e.newTeamTotalPointsHideLimitTime * 100 : e.teamTotalPointsHideLimitTime,


          e.newSpreadMaxMoneyLine != null ? (!e.newSpreadMaxMoneyLine || e.newSpreadMaxMoneyLine == 0) ? 0 : e.newSpreadMaxMoneyLine * 100 : e.spreadMaxMoneyLine,
          e.newMoneyLineMaxMoneyLine != null ? (!e.newMoneyLineMaxMoneyLine || e.newMoneyLineMaxMoneyLine == 0) ? 0 : e.newMoneyLineMaxMoneyLine * 100 : e.moneyLineMaxMoneyLine,
          e.newTotalPointsMaxMoneyLine != null ? (!e.newTotalPointsMaxMoneyLine || e.newTotalPointsMaxMoneyLine == 0) ? 0 : e.newTotalPointsMaxMoneyLine * 100 : e.totalPointsMaxMoneyLine,
          e.newTeamTotalPointsMaxMoneyLine != null ? (!e.newTeamTotalPointsMaxMoneyLine || e.newTeamTotalPointsMaxMoneyLine == 0) ? 0 : e.newTeamTotalPointsMaxMoneyLine * 100 : e.teamTotalPointsMaxMoneyLine,

          e.newSpreadMaxParlayBet != null ? (!e.newSpreadMaxParlayBet || e.newSpreadMaxParlayBet == 0) ? 0 : e.newSpreadMaxParlayBet * 100 : e.spreadMaxParlayBet,
          e.newMoneyLineMaxParlayBet != null ? (!e.newMoneyLineMaxParlayBet || e.newMoneyLineMaxParlayBet == 0) ? 0 : e.newMoneyLineMaxParlayBet * 100 : e.moneyLineMaxParlayBet,
          e.newTotalPointsMaxParlayBet != null ? (!e.newTotalPointsMaxParlayBet || e.newTotalPointsMaxParlayBet == 0) ? 0 : e.newTotalPointsMaxParlayBet * 100 : e.totalPointsMaxParlayBet,


          e.spreadParlayDenied,
          e.moneyLineParlayDenied,
          e.totalPointsParlayDenied,


          !e.spreadCorrelatedParlayDenied,
          !e.moneyLineCorrelatedParlayDenied,
          !e.totalPointsCorrelatedParlayDenied,


          e.newSpreadCuVigDicountPercent != null ? !e.newSpreadCuVigDicountPercent || e.newSpreadCuVigDicountPercent == 0 ? 0 : e.newSpreadCuVigDicountPercent : e.spreadCuVigDicountPercent,
          e.SpreadCuVigDiscountInetExpDateString,
          parseInt(Math.abs((parseInt(e.spreadDesiredPrice) - e.spreadOriginalFlat) / parseInt(e.spreadOriginalFlat.toString().substring(e.spreadOriginalFlat.toString().length - 2))) * 100),
          //e.newSpreadCuVigDiscountInetPercent ? !e.newSpreadCuVigDiscountInetPercent || e.newSpreadCuVigDiscountInetPercent == 0 ? 0 : e.newSpreadCuVigDiscountInetPercent : e.spreadCuVigDiscountInetPercent,
          e.SpreadCuVigDiscountExpDateString,

          e.newMoneyLineCuVigDicountPercent != null ? !e.newMoneyLineCuVigDicountPercent || e.newMoneyLineCuVigDicountPercent == 0 ? 0 : e.newMoneyLineCuVigDicountPercent : e.moneyLineCuVigDicountPercent,
          e.MoneyLineCuVigDiscountInetExpDateString,
          parseInt(Math.abs((parseInt(e.moneyLineDesiredPrice) - e.moneyLineOriginalFlat) / parseInt(e.moneyLineOriginalFlat.toString().substring(e.moneyLineOriginalFlat.toString().length - 2))) * 100),
          //e.newMoneyLineCuVigDiscountInetPercent ? !e.newMoneyLineCuVigDiscountInetPercent || e.newMoneyLineCuVigDiscountInetPercent == 0 ? 0 : e.newMoneyLineCuVigDiscountInetPercent : e.moneyLineCuVigDiscountInetPercent,
          e.MoneyLineCuVigDiscountExpDateString,


          e.newTotalPointsCuVigDicountPercent != null ? !e.newTotalPointsCuVigDicountPercent || e.newTotalPointsCuVigDicountPercent == 0 ? 0 : e.newTotalPointsCuVigDicountPercent : e.totalPointsCuVigDicountPercent,
          e.TotalPointsCuVigDiscountInetExpDateString,
          parseInt(Math.abs((parseInt(e.totalPointsDesiredPrice) - e.totalPointsOriginalFlat) / parseInt(e.totalPointsOriginalFlat.toString().substring(e.totalPointsOriginalFlat.toString().length - 2))) * 100),
          //e.newTotalPointsCuVigDiscountInetPercent ? !e.newTotalPointsCuVigDiscountInetPercent || e.newTotalPointsCuVigDiscountInetPercent == 0 ? 0 : e.newTotalPointsCuVigDiscountInetPercent : e.totalPointsCuVigDiscountInetPercent,
          e.TotalPointsCuVigDiscountExpDateString,


          e.newTeamTotalPointsCuVigDicountPercent != null ? !e.newTeamTotalPointsCuVigDicountPercent || e.newTeamTotalPointsCuVigDicountPercent == 0 ? 0 : e.newTeamTotalPointsCuVigDicountPercent : e.teamTotalPointsCuVigDicountPercent,
          e.TeamTotalPointsCuVigDiscountInetExpDateString,
          parseInt(Math.abs((parseInt(e.teamTotalPointsDesiredPrice) - e.teamTotalPointsOriginalFlat) / parseInt(e.teamTotalPointsOriginalFlat.toString().substring(e.teamTotalPointsOriginalFlat.toString().length - 2))) * 100),
          //e.newTeamTotalPointsCuVigDiscountInetPercent ? !e.newTeamTotalPointsCuVigDiscountInetPercent || e.newTeamTotalPointsCuVigDiscountInetPercent == 0 ? 0 : e.newTeamTotalPointsCuVigDiscountInetPercent : e.teamTotalPointsCuVigDiscountInetPercent,
          e.TeamTotalPointsCuVigDiscountExpDateString,


          period.PeriodNumber, $scope.SelectedSport.SportType, e.sportSubType, customerId,
          e.spreadFlatPrice || null,
          e.totalPointsFlatPrice || null,
          e.teamTotalPointsFlatPrice || null,
          e.spreadDenied,
          e.moneyLineDenied,
          e.totalPointsDenied,
          e.teamTotalPointsDenied,

          Math.abs(e.spreadOriginalFlat) < Math.abs(e.spreadDesiredPrice) ? true : false,
          Math.abs(e.moneyLineOriginalFlat) < Math.abs(e.moneyLineDesiredPrice) ? true : false,
          Math.abs(e.totalPointsOriginalFlat) < Math.abs(e.totalPointsDesiredPrice) ? true : false,
          Math.abs(e.teamTotalPointsOriginalFlat) < Math.abs(e.teamTotalPointsDesiredPrice) ? true : false
        ).then(result => {
          if ($scope.selectedCustomers.length == $scope.AgentCustomers.length)
            callback(period);
          else getCustomerDetailedLimits();
        });
      };
    };

    $scope.Readkey = function (e) {
      if (event.keyCode == 13 || event.which == 13) {
        $scope.UpdateCustomerSportLimits();
      }
    };

    $scope.ShowSendPackageModal = function () {
      (function ($) {
        $('#ModalSportSettingsSendPackage').modal({
          backdrop: 'static',
          keyboard: false
        }).removeData("modal").modal({ backdrop: 'static', keyboard: false });
      })(jQuery.noConflict());
    }


    $scope.SendPackage = async function () {
      if ($scope.PackageTypes.wagerLimits && !sportLimitsToUpdate.length) {
        UI.Alert("No limit changes are pending to propagate");
        return;
      }

      if (!selectedPlayersList.length) {
        UI.Alert("Please select at least one player!");
        return;
      }
      if (!someOptionChecked()) {
        UI.Alert("Please select at least one option to propagate!");
        return;
      }
      const selectedPlayersListString = selectedPlayersList.join(",");
      if (selectedPlayersListString == "" || !someOptionChecked() || sportLimitsToUpdate.length == 0) return;
      $scope.buttonStatus = $scope.Translate("Sending...");
      const altSportLimitsToUpdate = { ...sportLimitsToUpdate };
      await $scope.UpdateCustomerSportLimits(false);
      Object.values(altSportLimitsToUpdate).forEach(function (e) {
          $agentService.SendWagerLimitsPackage({
          players: selectedPlayersListString,
          wagerLimits: $scope.PackageTypes.wagerLimits,
          juiceDiscount: $scope.PackageTypes.juiceDiscount,
          denyAllow: $scope.PackageTypes.denyAllow,
          flatPricing: $scope.PackageTypes.flatPricing,
          periodNumber: $scope.selectedPeriod.PeriodNumber,
          sportType: $scope.SelectedSport.SportType.trim(),
          sportSubType: e.sportSubType
        }).then(function (response) {
          //jQuery(".treeCheckbox").prop('checked', false);
          UnselectAllPlayers();
          $scope.PackageTypes = { wagerLimits: false, juiceDiscount: false, denyAllow: false, flatPricing: false };
          $scope.buttonStatus = $scope.Translate("Package Sent");
        });
      });
    }

    $scope.AddCustomerToSendList = function (player) {
      let idx = selectedPlayersList.findIndex(x => x == player.CustomerID.trim());
      if (player.Checkbok == true) {
        selectedPlayersList.push(player.CustomerID.trim())
      }
      else selectedPlayersList.splice(idx, 1);

    }

    $scope.SelectAll = function (players) {
      if (!players) return;
      players.forEach(function (player) {
        if (typeof player.Checkbok === "undefined") player.Checkbok = false;
        if (player.Checkbok == false) {
          player.Checkbok = true;
          $scope.AddCustomerToSendList(player);
        }
      });
    }

    $scope.UnselectAll = function (players) {
      if (!players) return;
      players.forEach(function (player) {
        if (typeof player.Checkbok === "undefined") player.Checkbok = false;
        if (player.Checkbok == true) {
          player.Checkbok = false;
          $scope.AddCustomerToSendList(player);
        }
      });
    }

    function UnselectAllPlayers() {
      $scope.agentTree.forEach(function (node) {
        if (node.players) $scope.UnselectAll(node.players);
      });
    }

    $scope.visible = function (item) {
      return !($scope.query && $scope.query.length > 0
        && item.AgentId.trim().toUpperCase().indexOf($scope.query.toString().trim().toUpperCase()) == -1);

    };

    $scope.leagueFilter = function (e) {
      return e.sportSubType == $scope.SelectedSubsport.sportSubType
    }

    $scope.findNodes = function () {

    };

    function someOptionChecked() {
      return $scope.PackageTypes.wagerLimits || $scope.PackageTypes.juiceDiscount || $scope.PackageTypes.denyAllow || $scope.PackageTypes.flatPricing;
    }

    $rootScope.$on('AgentAsCutomerInfoLoaded', function () {
      $scope.AgentAsCustomerInfo = $agentService.AgentAsCustomerInfo;
      init();
    });

    init();
  }
]);