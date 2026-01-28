appModule.directive('custActions', ['$agentService', function ($agentService) {
  return {
    restrict: 'AEC',
    scope: {
      agentInfo: '=',
      parlaySpecsList: '=', teaserSpecsList: '=', currencies: '=', states: '=', timeZoneList: '=', weekDayList: '=', priceTypesList: '=',
      updateCustomerBalance: '&',
      updateCustomer: '&',
      updateCustomerOffering: '&',
      updateCustomerTeaser: '&',
      updateCustomerParlay: '&',
      updateCustomerBuyPoints: '&',
      updateCustomerSellPoints: '&',
      FormatDateTime: '=formatDateTime',
      transactionIsThisWeek: '=',
      freePlayMode: '=freePlayMode',
      IsMobile: '=isMobile',
      WagerType: '=wagerType',
      activityOnly: '='
    },
    controller: ['$scope', '$rootScope', '$translatorService', '$agentService', function ($scope, $rootScope, $translatorService, $agentService) {
			$scope.customer = {...$scope.$parent.SelectedCustomer};
      $scope.GetAgentRestriction = $scope.$parent.GetAgentRestriction;
      $scope.InboxVersion = $rootScope.InboxVersion;
      $scope.Report = {};
      $scope.fireSwal = $scope.$parent.fireSwal;
      $scope.showNonPosted = $scope.$parent.showNonPosted;
      $scope.Translate = function (text) {
        return $translatorService.Translate(text);
      };
      $scope.openModal = function (id) {
        jQuery(id).appendTo("body").modal('show');
      }
      $scope.closeModal = function (id) {
        const el = document.getElementById(id);
        el.classList.remove('in');
        jQuery("#" + id).removeClass("in");
        jQuery(".modal-backdrop").remove();
        jQuery('body').removeClass('modal-open');
        jQuery('body').css('padding-right', '');
      }
      $scope.SportsLimits = [];
      $scope.tranInfo = {
        paymentAmt: null,
        tranType: $scope.freePlayMode ? 'FpDeposit' : (!$scope.customer || ($scope.customer.CurrentBalance + ($scope.customer.CasinoBalance || 0)) > 0 ? 'Withdrawal' : 'Deposit'),
        paymentDescr: null
      }

      $scope.msgInfo = {
        msgPriority: 'M',
        msgSubject: null,
        msgExpirationDate: null,
        msgBody: null
      }

      $scope.limits = {
        creditLimitAmt: null,
        tmpCreditLimitAmt: null,
        quickLimitAmt: null,
        tmpQuickLimitAmt: null,
        tmpCreditAdjDateThru: null,
        tmpQuickAdjDateThru: null
      };

      $scope.result = {
        confirmationMsg: ''
      }
      $scope.dateSelection = { dailyFigure: null };

      let currentDate = new Date();
      let startDate = new Date();
      let endDate = new Date();
      startDate.setDate(startDate.getDate() - 7);

      $scope.Filters = {
        tranType: $scope.freePlayMode == true ? 'free' : ($scope.activityOnly ? 'wagers' : 'all'),
        startDate: startDate.toLocaleDateString('en-US'),
        endDate: endDate.toLocaleDateString('en-US'),
        tranDate: (currentDate.getMonth() + 1) + "/" + currentDate.getDate() + "/" + currentDate.getFullYear(),
      };

      jQuery("#tranDateInput").datepicker({
        defaultDate: currentDate
      });

      setTimeout(function () {
        jQuery('input[name="txtTempCreditAdjThru"]').daterangepicker({
          locale: {
            firstDay: 1
          },
          singleDatePicker: true,
          showDropdowns: true,
          opens: 'left'
        })
        jQuery('input[name="txtTempQuickAdjThru"]').daterangepicker({
          locale: {
            firstDay: 1
          },
          singleDatePicker: true,
          showDropdowns: true,
          opens: 'left'
        });
      }, 500);
      //end of date stuff

      $scope.$watch('$parent.SelectedCustomer', function (newVal) {
        if (!newVal) return;
        jQuery("#startDateInput").daterangepicker({
          locale: {
            firstDay: 1
          },
          singleDatePicker: true,
          showDropdowns: true,
          opens: 'left',
          //dateFormat: 'mm/dd/yyyy',
          startDate: moment().subtract(7, 'day'),
        }).on('apply.daterangepicker', function () {
          getCustomerTransaction();
        });
        jQuery("#endDateInput").daterangepicker({
          locale: {
            firstDay: 1
          },
          singleDatePicker: true,
          showDropdowns: true,
          opens: 'left',
          dateFormat: 'mm/dd/yyyy'
        }).on('apply.daterangepicker', function () {
          getCustomerTransaction();
        });
        $scope.customer = {...newVal};
        getDailyFigureDatesRange();
        $scope.result.confirmationMsg = '';
        if (!$scope.customer) return;
        $scope.customer.CurrentBalance += ($scope.customer.CasinoBalance || 0);
        $rootScope.safeApply();
        $scope.limits.creditLimitAmt = null;
        $scope.limits.tmpCreditLimitAmt = null;
        $scope.limits.tmpCreditAdjDateThru = null;
        $scope.limits.tmpQuickAdjDateThru = null;
        $scope.limits.quickLimitAmt = null;
        $scope.limits.tmpQuickLimitAmt = null;
        getCustomerTransaction();
      });

      function getCustomerTransaction() {

        $scope.Report.AllTransactions = [];
        if ($scope.Filters.tranType == 'cash' || $scope.Filters.tranType == 'wagers') {
          $agentService.GetCustomerTransactionListByDateRange($scope.customer.CustomerId, $scope.Filters.startDate, $scope.Filters.endDate).then(function (result) {
            if (result.data.d.Data.length == 0) return;
            $scope.Report.AllTransactions = $scope.Filters.tranType == 'cash' ?
              groupInfo(result, startDate).filter(x => 'TUZIERCD'.indexOf(x.TranType) >= 0) :
              groupInfo(result, startDate).filter(x => 'TUZIERCD'.indexOf(x.TranType) < 0);
          });
        }
        else if ($scope.Filters.tranType == 'free') {
          getFreeTransaction().then(function (result) {
            if (!result) return;
            $scope.Report.AllTransactions = result.data.d.Data;
          });
        } else {
          $agentService.GetCustomerTransactionListByDateRange($scope.customer.CustomerId, $scope.Filters.startDate, $scope.Filters.endDate).then(function (result) {
            $scope.Report.AllTransactions = groupInfo(result);
            getFreeTransaction().then(function (result) {
              if (!result) return;
              $scope.Report.AllTransactions = $scope.Report.AllTransactions || [];
              $scope.Report.AllTransactions = [...$scope.Report.AllTransactions, ...result.data.d.Data];
              if (($scope.customer.CasinoBalance || 0) != 0) {
                $scope.showNonPosted($scope.Report.AllTransactions, $scope.customer);
              }
            });
          });
        }
      }

      function groupInfo(result) {
        var groupedItems = null;
        var holdDocumentNumber = null;
        var holdWagerNumber = null;
        var allTransactions = result.data.d.Data;
        var groupedTransactions = new Array();
        var accumTran = 0;

        if (allTransactions != null && allTransactions.length > 0) {

          groupedTransactions = new Array();
          groupedItems = new Array();
          holdDocumentNumber = allTransactions[allTransactions.length - 1].DocumentNumber;
          holdWagerNumber = allTransactions[allTransactions.length - 1].WagerNumber;

          for (var i = allTransactions.length - 1; i >= 0; i--) {
            if (holdDocumentNumber != allTransactions[i].DocumentNumber || holdWagerNumber != allTransactions[i].WagerNumber) {
              groupedTransactions.push(allTransactions[i + 1]);
              if (groupedTransactions.length > 0 && groupedItems != null && groupedItems.length > 0)
                groupedTransactions[groupedTransactions.length - 1].Items = groupedItems;
              groupedItems = new Array();
              groupedItems.push($agentService.newWagerItem(allTransactions[i]));
              if (i < allTransactions.length - 1) groupedTransactions[groupedTransactions.length - 1].CurrentBalance = groupedTransactions[groupedTransactions.length - 1].CurrentBalance + accumTran;
              accumTran += groupedTransactions[groupedTransactions.length - 1].TranCode == "C" ? groupedTransactions[groupedTransactions.length - 1].Amount * -1 : groupedTransactions[groupedTransactions.length - 1].Amount;


            } else {
              groupedItems.push($agentService.newWagerItem(allTransactions[i]));
            }
            holdDocumentNumber = allTransactions[i].DocumentNumber;
            holdWagerNumber = allTransactions[i].WagerNumber;
            if (i == 0) {
              groupedTransactions.push(allTransactions[i]);
              groupedTransactions[groupedTransactions.length - 1].Items = groupedItems;
              groupedTransactions[groupedTransactions.length - 1].CurrentBalance = groupedTransactions[groupedTransactions.length - 1].CurrentBalance + accumTran;
            }
          }
          return groupedTransactions;
        }
      }

      function getFreeTransaction() {
        return $agentService.GetFreePlayListByDateRange($scope.customer.CustomerId, $scope.Filters.startDate, $scope.Filters.endDate)
      }

      $scope.IsMobile = $scope.$parent.IsMobile;

      $scope.getSubDescription = $scope.$parent.getSubDescription;

      $scope.getCustomerTransaction = getCustomerTransaction;

      $scope.QuickAmountPlaceholder = function () {
        if (!$scope.customer) return;
        return $scope.customer ? CommonFunctions.FormatNumber($scope.customer.WagerLimit, true) : 'amount';
      };

      $scope.CanPostFreePlay = function () {
        if (!$agentService.Restrictions) return false;
        for (var i = 0; $agentService.Restrictions.length > i; i++) {
          if ($agentService.Restrictions[i].Code === "POSTFPTRN") return false;
        }
        return true;
      };

      $scope.QuckTempPlaceholder = function () {
        if (!$scope.customer) return;
        return $scope.customer ? CommonFunctions.FormatNumber($scope.customer.TempWagerLimit, true) : 'Tmp Credit Adj';
      };

      $scope.QuickDatePlaceholder = function () {
        if (!$scope.customer) return;
        return $scope.customer ? CommonFunctions.FormatDateTime($scope.customer.TempWagerLimitExpirationString, 4) : 'Tmp Credit Adj';
      };

      $scope.SettlePlaceholder = function () {
        if (!$scope.customer) return;
        return $scope.customer ? CommonFunctions.FormatNumber($scope.customer.SettleFigure, false) : 'settle amount';
      };

      $scope.AmountPlaceholder = function () {
        if (!$scope.customer) return;
        return $scope.customer ? CommonFunctions.FormatNumber($scope.customer.CreditLimit, true) : 'amount';
      };

      $scope.TempPlaceholder = function () {
        if (!$scope.customer) return;
        return $scope.customer ? CommonFunctions.FormatNumber($scope.customer.TempCreditAdj, true) : 'Tmp Credit Adj';
      };

      $scope.DatePlaceholder = function () {
        if (!$scope.customer) return;
        return CommonFunctions.FormatDateTime($scope.customer.TempCreditAdjExpDateString, 4);
      };

      $scope.IsDisabled = function () {
        return !$scope.customer || !$scope.AgentInfo;
      };

      $scope.AddCustomerMessage = function () {
        if (!$scope.customer) {
          alert($scope.Translate('Select customer from the list.'));
          return;
        }

        if (!$scope.msgInfo.msgSubject || $scope.msgInfo.msgSubject.trim() == "") {
          alert($scope.Translate('Please enter a subject'));
          return;
        }
        if (!$scope.msgInfo.msgBody || $scope.msgInfo.msgBody.trim() == "") {
          alert($scope.Translate('Please enter a message'));
          return;
        }
        var date = null;
        try {
          date = new Date($scope.msgInfo.msgExpirationDate);
        } catch (err) {
        }

        if (typeof date.getMonth !== 'function') {
          alert($scope.Translate('Select a Valid Date.'));
          return;
        }

        $agentService.AddCustomerMessage($scope.customer.CustomerId, $scope.msgInfo.msgExpirationDate, $scope.msgInfo.msgPriority, $scope.msgInfo.msgSubject, $scope.msgInfo.msgBody).then(function (result) {
          if (result.Code == 1) {
            alert($scope.Translate('Error adding comment'));
          } else {
            $scope.msgInfo.msgSubject = null;
            $scope.msgInfo.msgBody = null;
            $scope.result.confirmationMsg = $scope.Translate("Message will expire (stop displaying) at 12:00:01 A.M on ") + CommonFunctions.FormatDateTime(date, 4);
          }
        });
      };

      $scope.PostPaymentTransaction = function () {
        if (!$scope.customer) {
          alert($scope.Translate('Select customer from the list.'));
          return;
        }
        if ($scope.AgentInfo.EnterTransactionFlag != 'Y' && $scope.AgentInfo.AddFreePlaysFlag != 'Y') {
          alert($scope.Translate('You are not allowed.'));
          return;
        }
        if ($scope.tranInfo.tranType == null || $scope.tranInfo.tranType == "") {
          alert($scope.Translate('Select transaction type from the list.'));
          return;
        }
        if ($scope.tranInfo.paymentAmt == null || !isValidNumber($scope.tranInfo.paymentAmt)) {
          alert($scope.Translate('Type in a valid amount greater than zero.'));
          return;
        }
        if ($scope.tranInfo.paymentAmt == null && !isValidNumber($scope.tranInfo.paymentAmt) && $scope.tranInfo.paymentAmt > 100000) {
          alert($scope.Translate('Transactions are limit to 100 000 per action'));
          return;
        }
        /*
            if ($scope.tranInfo.paymentDescr == null || $scope.tranInfo.paymentDescr == "") {
             alert($scope.Translate('Write a description for the transaction.'));
             return;
            }
        */
        if (($scope.tranInfo.tranType == "BetAdjCredit" || $scope.tranInfo.tranType == "BetAdjDebit") && $scope.dateSelection.dailyFigure == "") {
          alert($scope.Translate('Select a date for the Bet Adjustment.'));
          return;
        }

        var customerId = $scope.customer.CustomerId;
        var tranCode = getTransactionCode();
        var tranType = getTransactionType();
        var amount = Number($scope.tranInfo.paymentAmt);
        var description = buildDescription();
        var freePlayTransaction = ($scope.tranInfo.tranType == "FpDeposit" || $scope.tranInfo.tranType == "FpWithdrawal");

        $agentService.InsertCustomerTransaction(customerId, tranCode, tranType, amount, null, description, ($scope.tranInfo.tranType == "BetAdjCredit" || $scope.tranInfo.tranType == "BetAdjDebit") ? $scope.Filters.tranDate : null, freePlayTransaction).then(function (result) {
          if (result.Code == 1) {
            $scope.fireSwal('Error posting the transaction.', '', 'error');
            return;
          }
          $scope.fireSwal($scope.Translate('Success'), getTransactionName() + ' for ' + CommonFunctions.FormatNumber(amount, false, false, true) + ' Posted correctly.', 'success', function () { jQuery('#insertTranModal').modal('hide') });
          //if (freePlayTransaction) $scope.loadFreePlayData();
          //else getCustomerTransaction();
          getCustomerTransaction();
          $scope.updateCustomerBalance(
            {
              customerId: $scope.customer.CustomerId,
              currentBalance: ($scope.tranInfo.tranType == 'FpDeposit' || $scope.tranInfo.tranType == 'FpWithdrawal' ? $scope.customer.CurrentBalance : $scope.customer.CurrentBalance + ((tranCode == 'D' ? amount * -1 : amount) * 100))
            }
          );
          $scope.tranInfo.paymentAmt = "";
          $scope.tranInfo.paymentDescr = null;
        });

      };

      $scope.PostQuickLimitsTransaction = function () {

        if ($scope.IsDisabled()) return;

        if ($scope.limits.creditLimitAmt != null && $scope.limits.creditLimitAmt != "" && !isValidNumber($scope.limits.creditLimitAmt, true)) {
          alert($scope.Translate('Type in a valid Credit Limit amount.'));
          return;
        }

        if ($scope.limits.tmpCreditLimitAmt != null && $scope.limits.tmpCreditLimitAmt != "") {
          if (!isValidNumber($scope.limits.tmpCreditLimitAmt, true)) {
            alert($scope.Translate('Type in a valid Temp Credit Adjustment amount.'));
            return;
          }
          var date;
          try {
            date = new Date($scope.limits.tmpCreditAdjDateThru);
          } catch (err) { }

          if (typeof date.getMonth !== 'function') {
            alert($scope.Translate('Select a Valid Date.'));
            return;
          }
          var d1 = new Date();
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

        if ($scope.limits.quickLimitAmt != null && $scope.limits.quickLimitAmt != "" && !isValidNumber($scope.limits.quickLimitAmt, true)) {
          alert($scope.Translate('Type in a valid Credit Limit amount.'));
          return;
        }

        if ($scope.limits.tmpQuickLimitAmt != null && $scope.limits.tmpQuickLimitAmt != "" && !isValidNumber($scope.limits.tmpQuickLimitAmt, true)) {
          alert($scope.Translate('Type in a valid Temp Credit Adjustment amount.'));
          return;
        }

        if ($scope.limits.tmpQuickLimitAmt != null && $scope.limits.tmpQuickLimitAmt != "" && ($scope.tmpQuickAdjDateThru == null || $scope.tmpQuickAdjDateThru == "")
          && Number(($scope.limits.tmpQuickLimitAmt + "").replace(',', '')) > 0) {
          alert($scope.Translate('Select an Ending Date.'));
          return;
        }

        var customerId = $scope.customer.CustomerId;
        ///////////////////

        var settleLimitAmt = null;
        try {
          settleLimitAmt = Math.round(parseFloat(!isNaN($scope.settleLimitAmt) ? $scope.settleLimitAmt : $scope.customer.SettleFigure));
        }
        catch (err) {
        }
        $scope.detailLimitSettlePostedMsg = "";
        if (settleLimitAmt != null && isValidNumber(settleLimitAmt, true) && settleLimitAmt != ($scope.customer.SettleFigure)) {
          $agentService.ChangeCustomerSettleFigure(customerId, (settleLimitAmt), null).then(function (result) {
            if (result.data.d.Code == 1) {
              alert($scope.Translate('Error posting the transaction.'));
            }
            $scope.customer.SettleFigure = settleLimitAmt;
            $scope.detailLimitSettlePostedMsg = $scope.Translate('Settle figure Adjustment for ') + CommonFunctions.FormatNumber(settleLimitAmt, false, false) + $scope.Translate(' Posted correctly.');
            getCustomerTransaction();
          });
        };

        ////////////////

        var creditLimitAmt = null;
        try {
          creditLimitAmt = Math.round(parseFloat(!isNaN($scope.limits.creditLimitAmt) ? $scope.limits.creditLimitAmt : $scope.customer.CreditLimit / 100));
        }
        catch (err) {
        }
        $scope.detailLimitCreditLimitPostedMsg = "";
        if (creditLimitAmt != null && isValidNumber(creditLimitAmt, true) && creditLimitAmt != ($scope.customer.CreditLimit / 100)) {
          $agentService.ChangeCustomerCreditLimit(customerId, (creditLimitAmt * 100), null).then(function (result) {
            if (result.data.d.Code == 1) {
              alert($scope.Translate('Error posting the transaction.'));
            }
            $scope.customer.CreditLimit = creditLimitAmt * 100;
            $scope.updateCustomerBalance(
              {
                customerId: $scope.customer.CustomerId,
                currentBalance: $scope.customer.CurrentBalance
              });
            $scope.detailLimitCreditLimitPostedMsg = $scope.Translate('Credit Limit Adjustment for ') + CommonFunctions.FormatNumber(creditLimitAmt, false, false) + $scope.Translate(' Posted correctly.');
            getCustomerTransaction();
          });
        };

        var tmpCreditLimitAmt = null;
        try {
          tmpCreditLimitAmt = Math.round(parseFloat(!isNaN($scope.limits.tmpCreditLimitAmt) ? $scope.limits.tmpCreditLimitAmt : $scope.customer.TempCreditAdj / 100));
        }
        catch (err) {
        }
        $scope.detailLimitTempPostedMsg = "";
        if (tmpCreditLimitAmt != null && isValidNumber(tmpCreditLimitAmt, true) && tmpCreditLimitAmt != ($scope.customer.TempCreditAdj / 100)) {
          $agentService.ChangeCustomerTempCreditLimit(customerId, tmpCreditLimitAmt != null && isValidNumber(tmpCreditLimitAmt, true) ? (tmpCreditLimitAmt * 100) : $scope.customer.TempCreditAdj, date).then(function (result) {
            if (result.data.d.Code == 1) {
              alert($scope.Translate('Error posting the transaction.'));
            }
            $scope.customer.TempCreditAdj = tmpCreditLimitAmt * 100;
            $scope.customer.TempCreditAdjExpDate = date;
            $scope.customer.TempCreditAdjExpDateString = CommonFunctions.FormatDateTime(date, 4);
            $scope.updateCustomerBalance(
              {
                customerId: $scope.customer.CustomerId,
                currentBalance: $scope.customer.CurrentBalance
              });
            $scope.detailLimitTempPostedMsg = $scope.Translate('Temp Credit Limit Adjustment for ') + CommonFunctions.FormatNumber(tmpCreditLimitAmt, false, false) + $scope.Translate(' Posted correctly.');
            getCustomerTransaction();
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
          var qd1 = new Date();

          if (qDate < qd1) {
            alert($scope.Translate('Select a Valid Date.'));
            return;
          }
        } else qDate = null;

        var qtranAmount = null;
        try {
          qtranAmount = Math.round(parseFloat(!isNaN($scope.limits.quickLimitAmt) ? $scope.limits.quickLimitAmt : $scope.customer.WagerLimit / 100));
        }
        catch (err) {
        }

        $scope.quickLimitTranPostedMsg = "";
        if (qtranAmount != null && isValidNumber(qtranAmount, true) && qtranAmount != ($scope.customer.WagerLimit / 100)) {
          $agentService.ChangeCustomerQuickLimit(customerId, (qtranAmount * 100), null).then(function (result) {
            if (result.data.d.Code == 1) {
              alert($scope.Translate('Error posting the transaction.'));
            }
            $scope.customer.WagerLimit = qtranAmount * 100;
            $scope.updateCustomerBalance(
              {
                customerId: $scope.customer.CustomerId,
                currentBalance: $scope.customer.CurrentBalance
              });
            $scope.quickLimitTranPostedMsg = $scope.Translate('Quick Limit Adjustment for ') + CommonFunctions.FormatNumber(qtranAmount, false, false) + $scope.Translate(' Posted correctly.');
            getCustomerTransaction();
          });
        };

        var tmpQuickLimitAmt = null;
        try {
          tmpQuickLimitAmt = Math.round(parseFloat(!isNaN($scope.limits.tmpQuickLimitAmt) ? $scope.limits.tmpQuickLimitAmt : $scope.customer.TempWagerLimit / 100));
        }
        catch (err) {
        }

        $scope.quickLimitTempPostedMsg = "";
        if ($scope.limits.tmpQuickLimitAmt != null && isValidNumber($scope.limits.tmpQuickLimitAmt, true)) {
          $agentService.ChangeCustomerTempQuickLimit(customerId, (tmpQuickLimitAmt * 100), qDate).then(function (result) {
            if (result.data.d.Code == 1) {
              alert($scope.Translate('Error posting the transaction.'));
            }
            $scope.customer.TempWagerLimit = tmpQuickLimitAmt * 100;
            $scope.customer.TempWagerLimitExpiration = qDate;
            $scope.updateCustomerBalance(
              {
                customerId: $scope.customer.CustomerId,
                currentBalance: $scope.customer.CurrentBalance
              });
            $scope.quickLimitTempPostedMsg = $scope.Translate('Temp Quick Limit Adjustment for ') + CommonFunctions.FormatNumber(tmpQuickLimitAmt, false, false) + $scope.Translate(' Posted correctly.');
            getCustomerTransaction();
          });
        };
      };

      $scope.UpdateCustomerAccess = function (customerId, object, e) {
        if ($scope.IsDisabled()) return;
        if ($scope.SuspendWagering == false) {
          return;
        }
        $scope.customer[object] = !$scope.customer[object];
        var accessValue = $scope.customer[object] ? "Y" : "N";
        $agentService.UpdateCustomerAccess($scope.customer.CustomerId, e.target.id, accessValue);
      };

      $scope.activeTab = 'P'

      $scope.TabActive = function (tab) {
        if (!$agentService.AgentInfo) return;
        return tab == $scope.activeTab;
      };

      $scope.UpdateCustomerTeaserInfo = function (teaserName, checked) {
        $scope.updateCustomerTeaser({ 'teaserName': teaserName, 'checked': checked });
      }

      $scope.$watch('msgInfo.msgPriority', function (val) {
        switch (val) {
          case 'M':
            $scope.PriorityText = $scope.Translate("Message will be displayed on the customer's screen one time, and it will be kept in customer's Inbox until it expires.");
            break;
          case 'H':
            $scope.PriorityText = $scope.Translate("Message will be displayed on the customer's screen until it expires.");
            break;
          case 'L':
            $scope.PriorityText = $scope.Translate("Message will be sent to customer's Inbox and it will be visible until it expires.");
            break;
          case 'S':
            $scope.PriorityText = $scope.Translate("Message will be displayed on the customer's screen when the account is suspended.");
            break;
          default:
        }
      });


      $scope.AgentInfo = $agentService.AgentInfo;
      $scope.SuspendWagering = $agentService.AgentInfo ? $agentService.AgentInfo.SuspendWageringFlag == 'Y' : false;

      $scope.DeleteTransaction = function (t) {
        const documentNumber = t.DocumentNumber;
        if ($scope.AgentInfo.EnterTransactionFlag != 'Y' || !($scope.GetAgentRestriction('AMDT') && $scope.transactionIsThisWeek(t) && !(t.TranType == 'A' || t.TranType == 'L' || t.TranType == 'W' || t.TranType == 'R' || t.TranType == 'X'))) { alert('You are not allowed'); return; };
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
            function ifSuccess() {
              Swal.fire(
                $scope.Translate('Deleted!'),
                $scope.Translate('The transaction has been deleted.'),
                'success'
              );
              $scope.getCustomerTransaction();
              $scope.updateCustomerBalance(
                {
                  customerId: $scope.customer.CustomerId,
                  currentBalance: $scope.customer.CurrentBalance
                });
            }
            if ($scope.freePlayMode == true) {
              $agentService.DeleteFreePlay({ customerId: $scope.customer.CustomerId, documentNumber: documentNumber }).then(function (response) {
                if (response.data.d.Code == 0) {
                  ifSuccess()
                } else {
                  Swal.fire(
                    $scope.Translate('Error!'),
                    '',
                    'error'
                  )
                }
              })
            } else {
              $agentService.DeleteTransaction({ documentNumber: documentNumber }).then(function (response) {
                if (response.data.d.Code == 0) {
                  ifSuccess()
                } else {
                  Swal.fire(
                    $scope.Translate('Error!'),
                    '',
                    'error'
                  )
                }
              })
            }
          }
        })
      }

      $rootScope.$on('AgentInfoLoaded', function () {
        $scope.AgentInfo = $agentService.AgentInfo;
        if ($agentService.AgentInfo) {
          $scope.SuspendWagering = $agentService.AgentInfo.SuspendWageringFlag == 'Y';
          $rootScope.safeApply();
        }
      });


      function getDailyFigureDatesRange() {
        $agentService.GetDailyFigureDatesRange().then(function (result) {
          $scope.DatesRange = result.data.d.Data;
          $scope.dateSelection.dailyFigure = $scope.DatesRange[0];
          formatDatesRangeForDisplay();
        });
      }

      function formatDatesRangeForDisplay() {
        if ($scope.DatesRange != null) {
          for (var i = 0; i < $scope.DatesRange.length; i++) {
            $scope.DatesRange[i].DayOfWeekStr = displayDate($scope.DatesRange[i].DateString);
          }
        }
      }

      function displayDate(strDate) {
        if (strDate == null) return "";
        var date = new Date(strDate);
        return firstLetterUpperCase(CommonFunctions.FormatDateTime(date, 6, 3, true).toString());
      }

      function firstLetterUpperCase(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
      }

      function buildDescription() {
        var baseDesc = "";
        switch ($scope.tranInfo.tranType) {
          case "Deposit":
            baseDesc = $scope.Translate("Customer Deposit");
            break;
          case "FpDeposit":
            baseDesc = $scope.Translate("Customer Deposit * Free Play * [Internet] *");
            break;
          case "BetAdjCredit":
            baseDesc = $scope.Translate("Credit Betting Adjustment for ") + $scope.customer.CustomerId;
            break;
          case "Withdrawal":
            baseDesc = $scope.Translate("Customer Withdrawal");
            break;
          case "FpWithdrawal":
            baseDesc = $scope.Translate("Customer Withdrawal * Free Play * [Internet] *");
            break;
          case "BetAdjDebit":
            baseDesc = $scope.Translate("Debit Betting Adjustment for ") + $scope.customer.CustomerId;
            break;
          case "PromotionalCredit":
            baseDesc = $scope.Translate("Promotional Credit for ") + $scope.customer.CustomerId;
            break;
          case "PromotionalDebit":
            baseDesc = $scope.Translate("Promotional Debit for ") + $scope.customer.CustomerId;
            break;
        }
        baseDesc += $scope.tranInfo.paymentDescr ? ' - ' + $scope.tranInfo.paymentDescr.substring(0, 200) : '';
        return baseDesc;
      }

      function getTransactionCode() {
        switch ($scope.tranInfo.tranType) {
          case "Deposit":
          case "FpDeposit":
          case "BetAdjCredit":
          case "PromotionalCredit":
            return "C";
          case "Withdrawal":
          case "FpWithdrawal":
          case "BetAdjDebit":
          case "PromotionalDebit":
            return "D";
        }
        return "";
      }

      function getTransactionType() {
        switch ($scope.tranInfo.tranType) {
          case "Deposit":
          case "FpDeposit":
            return "E";
          case "Withdrawal":
          case "FpWithdrawal":
            return "I";
          case "BetAdjCredit":
            return "C";
          case "BetAdjDebit":
            return "D";
          case "BetAdjDebit":
            return "D";
          case "PromotionalCredit":
            return "B";
          case "PromotionalDebit":
            return "N";
        }
        return "";
      }

      function getTransactionName() {
        switch ($scope.tranInfo.tranType) {
          case "Deposit":
          case "Withdrawal":
            return $scope.tranInfo.tranType;
          case "FpDeposit":
            return $scope.Translate("Free Play Deposit");
          case "FpWithdrawal":
            return $scope.Translate("Free Play Withdrawal");
          case "BetAdjCredit":
            return $scope.Translate("Bet Adj Credit");
          case "BetAdjDebit":
            return $scope.Translate("Bet Adj Debit");
        }
        return "";
      };

      function isValidNumber(targetAmount, allowZero) {
        if (targetAmount == null) return false;
        if (isNaN((targetAmount + "").replace(',', ''))) return false;
        if (allowZero) {
          if (Number((targetAmount + "").replace(',', '')) < 0) return false;
        } else if (Number((targetAmount + "").replace(',', '')) <= 0) return false;
        return true;
      };

    }],
    templateUrl: appModule.Root + '/app/directives/custActions/custActions.html?v=12'
  };
}]);