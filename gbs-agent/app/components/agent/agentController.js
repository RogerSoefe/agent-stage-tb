appModule.controller("agentController", [
	'$scope', '$agentService', '$compile', '$rootScope', function ($scope, $agentService, $compile, $rootScope) {

    let currentPage = 0, dataFinishLoad = false, allData = [];
    $scope.totalDisplayed = 100;
    $scope.filter = {
      originSearchInput: null,
      destinySearchInput: null,
    }

		$scope.DDBox = {
			TranType: 'ALL'
		};

    $scope.notification = {
      notificationType: 'agent'
    };

		$scope.Init = function () {
      if (!$scope.LookupAgent) {

        if ($scope.AgentAsCustomerInfo) {
          $scope.LookupAgent = $scope.AgentAsCustomerInfo;
          loadModule();
        }
        else {
          $rootScope.$on('AgentAsCustomerInfoReady', function () {
            $scope.LookupAgent = $scope.AgentAsCustomerInfo;
            loadModule();
          });
        }
      }
      loadModule();
    }

    function loadModule() {
      if (!$scope.LookupAgent || $scope.LookupAgent.AgentID.trim() == $scope.AgentAsCustomerInfo.CustomerID.trim()) {
        document.location.href = '#/agentAccess';
        return;
      }
			$scope.SelectedCustomer = $scope.LookupAgent;
			$scope.SelectedCustomer.IsAgent = true;
			$scope.allTransactionsTemplate = appModule.Root + "/app/components/customer/allTransactions.html";
      $scope.notificationsTemplate = appModule.Root + "/app/components/agent/notifications.html";
      $scope.permissionsTemplate = appModule.Root + "/app/components/agent/permissions.html";
      $scope.moveCustomersTemplate = appModule.Root + "/app/components/agent/moveCustomers.html";
      $scope.generalTemplate = appModule.Root + "/app/components/agent/general.html";
			let params = { agentId: $scope.SelectedCustomer.AgentID }
      $scope.notification.agentId = $scope.SelectedCustomer.AgentID;
			$agentService.GetSpecificAgentAsCustomerInfo(params).then(function (response) {
        if (!response.data.d.Data) return;
        $scope.SelectedCustomer = {
           ...response.data.d.Data, ...$scope.SelectedCustomer,
        };
        $scope.MasterAgentsList = $scope.AllAgentsList.filter(x => x.AgentType == 'M');
        $scope.SelectedCustomer.CustomerId = $scope.SelectedCustomer.CustomerID;
        $scope.SelectedCustomer.currentAgent = $scope.MasterAgentsList ? $scope.MasterAgentsList.find(x => x.AgentId.toUpperCase().trim() == $scope.SelectedCustomer.MasterAgentID.toUpperCase().trim()) : { AgentId: $rootScope.selectedAgent.MasterAgentID };
				$scope.SelectedCustomer.ChangeWagerLimitFlagBoolean = $scope.SelectedCustomer.ChangeWagerLimitFlag == 'Y';
				$scope.SelectedCustomer.ChangeCreditLimitFlagBoolean = $scope.SelectedCustomer.ChangeCreditLimitFlag == 'Y';
				$scope.SelectedCustomer.SuspendWageringFlagBoolean = $scope.SelectedCustomer.SuspendWageringFlag == 'Y';
				$scope.SelectedCustomer.ManageLinesFlagBoolean = $scope.SelectedCustomer.ManageLinesFlag == 'Y';
				$scope.SelectedCustomer.AddNewAccountFlagBoolean = $scope.SelectedCustomer.AddNewAccountFlag == 'Y';
				$scope.SelectedCustomer.EnterTransactionFlagBoolean = $scope.SelectedCustomer.EnterTransactionFlag == 'Y';
				$scope.SelectedCustomer.ChangeTempCreditFlagBoolean = $scope.SelectedCustomer.ChangeTempCreditFlag == 'Y';
				$scope.SelectedCustomer.UpdateCommentsFlagBoolean = $scope.SelectedCustomer.UpdateCommentsFlag == 'Y';
				$scope.SelectedCustomer.ChangeSettleFigureFlagBoolean = $scope.SelectedCustomer.ChangeSettleFigureFlag == 'Y';
				$scope.SelectedCustomer.SetMinimumBetAmountFlagBoolean = $scope.SelectedCustomer.SetMinimumBetAmountFlag == 'Y';
				$scope.SelectedCustomer.EnterBettingAdjustmentFlagBoolean = $scope.SelectedCustomer.EnterBettingAdjustmentFlag == 'Y';
				$scope.SelectedCustomer.RoundDecimalsFlagBoolean = $scope.SelectedCustomer.RoundDecimalsFlag == 'Y';

				$scope.SelectedCustomer.EnableOfferingGlobalFlagBoolean = $scope.SelectedCustomer.EnableOfferingGlobalFlag == 'Y';
				$scope.SelectedCustomer.EnableOfferingBuySellPointsFlagBoolean = $scope.SelectedCustomer.EnableOfferingBuySellPointsFlag == 'Y';
        $scope.SelectedCustomer.EnableEditAccountsFlagBoolean = $scope.SelectedCustomer.EnableEditAccountsFlag == 'Y';
        $scope.SelectedCustomer.AddFreePlaysFlagBoolean = $scope.SelectedCustomer.AddFreePlaysFlag == 'Y';
        $scope.SelectedCustomer.ActiveBoolean = $scope.SelectedCustomer.Active == 'Y';
        $scope.SelectedCustomer.PlaceBets = $scope.SelectedCustomer.PlaceBets.toString();
        $scope.SelectedCustomer.DeleteBets = $scope.SelectedCustomer.DeleteBets.toString();
        getCustomerBalance($scope.SelectedCustomer.CustomerID);
        _getActions();
        getData();
        $scope.selectOrigin($scope.AllAgentsList.find(x => x.AgentId.trim() == $scope.SelectedCustomer.CustomerID.trim()));
			});
		}

    async function _getActions() {
      let params = { customerId: $scope.SelectedCustomer.AgentID };
      let res = (await $agentService.GetActions(params));
      const rawData = res.data.d.Data;
      actionList = rawData.filter(x => x.HasParameters === false).map(function (x) { return { ...x, checked: x.CustomerId != null } });
      $scope.icons = actionList.slice(0, Math.round(actionList.length / 2));
      $scope.customerPanel = actionList.slice(Math.round(actionList.length / 2), actionList.length + 1);
      $scope.agentPanel = actionList.slice(Math.round(actionList.length / 2), actionList.length + 1);
    }

$scope.toggleAction = function (action, isQuick = false) {
      let params = { customerId: $scope.SelectedCustomer.AgentID, actionId: action.ActionId };
      if (isQuick && action.Name == 'Suspend Account') {
        if (action.checked) {
          $agentService.AllowAction(params).then();
        } else {
          $agentService.RestrictAction(params).then();
        }
        return;
      }
      if (action.checked) {
        $agentService.RestrictAction(params).then();
      } else {
        $agentService.AllowAction(params).then();
      }

    }

		$scope.UpdateCustomerBalance = function (customerId, currentBalance) {
			$scope.SelectedCustomer.CurrentBalance = currentBalance;
      if (customerId) getCustomerBalance(customerId);
    };

    $scope.sendNotification = function () {
      $agentService.SendNotification($scope.notification).then(function (result) {
        $scope.fireSwal('Success');
      });
		};

    $scope.UpdateAgentAsCustomer = function () {
      $scope.SelectedCustomer.CommentsForCstExpDate = $scope.SelectedCustomer.CommentsForCstExpDateString;
      $scope.SelectedCustomer.CommentsForAgentExpDate = $scope.SelectedCustomer.CommentsForAgentExpDateString;
      $scope.SelectedCustomer.CommentsForTWExpDate = $scope.SelectedCustomer.CommentsForTWExpDateString;
      $scope.SelectedCustomer.InetVigDiscountExpDate = $scope.SelectedCustomer.InetVigDiscountExpDateString;
      $scope.SelectedCustomer.LastCallDateTime = $scope.SelectedCustomer.LastCallDateTimeString;
      $scope.SelectedCustomer.LastVerDateTime = $scope.SelectedCustomer.LastVerDateTimeString;
      $scope.SelectedCustomer.OpenDateTime = $scope.SelectedCustomer.OpenDateTimeString;
      $scope.SelectedCustomer.TempCreditAdjExpDate = $scope.SelectedCustomer.TempCreditAdjExpDateString;
      $scope.SelectedCustomer.TempWagerLimitExpiration = $scope.SelectedCustomer.TempWagerLimitExpirationString;
      $scope.SelectedCustomer.VigDiscountExpDate = $scope.SelectedCustomer.VigDiscountExpDateString;
      $scope.SelectedCustomer.Active = $scope.SelectedCustomer.ActiveBoolean ? 'Y' : 'N';
      $scope.SelectedCustomer.__type = "GBSLibs.Entities.spCstGetCustomerInfoNoNulls_Result";
      $agentService.UpdateCustomerObj($scope.SelectedCustomer).then(function (result) {
        if (result.Code == 0) {
          if ($scope.SelectedCustomer.currentAgent.AgentId.trim() != $scope.SelectedCustomer.MasterAgentID.trim()) {
            $agentService.ChangeMasterAgent({ agentId: $scope.SelectedCustomer.CustomerID, newAgentId: $scope.SelectedCustomer.currentAgent.AgentId.trim() }).then(function (result) {
              if (result.Code == 0) {
                updateAgentList();
              } else {
                $scope.fireSwal('Error', 'Update Master Agent Failed', 'error');
              }
            })
          } else {
            updateAgentList();
          }
        } else {
          $scope.fireSwal('Error', '', 'error');
        }
      });
    }

    function updateAgentList() {
      $agentService.GetAgentHierarchy().then(function (result) {
        $scope.$parent.AllAgentsList = $scope.bindAgentHierarchy(result.data.d.Data);
        $scope.$parent.AllActiveAgentsList = $scope.AllAgentsList.filter(x => x.Active == 'Y');
        $scope.$parent.rawAgentsList = result.data.d.Data;
        $scope.SelectedCustomer.MasterAgentID = $scope.SelectedCustomer.currentAgent.AgentId.trim();
        $rootScope.safeApply();
        $scope.fireSwal('Success');
      });
    }

		var getCustomerBalance = function (customerId) {
			ShowAllTransactions(1);
			$agentService.GetCustomerBalance(customerId).then(function (result) {
				$scope.CustomerBalance = result.data.d.Data;
        $scope.AllAgentsList.find(x => x.AgentId == customerId.trim()).CurrentBalance = result.data.d.Data.CurrentBalance;
			});
		};

		$scope.SetCustomerOption = function (option) {
			$scope.CustomerOption = option;
			if (option == 2) ShowAllTransactions(1);
			if (option == 3) ShowAllTransactions();
      if (option == 7) {

        setTimeout(function () {
          var element = document.getElementById($scope.SelectedCustomer.CustomerID + '-source');
          element.scrollIntoView();
        }, 200);
      }
    };

		$scope.UpdateCustomerInfo = function () {
			if (!$scope.SelectedCustomer.Password || $scope.SelectedCustomer.Password.toString().trim() == "") {
				alert($scope.Translate('Please set a valid password'));
				return;
			}
			$scope.SelectedCustomer.Password = $scope.SelectedCustomer.Password.trim();
			$scope.SelectedCustomer.ChangeWagerLimitFlag = $scope.SelectedCustomer.ChangeWagerLimitFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.ChangeCreditLimitFlag = $scope.SelectedCustomer.ChangeCreditLimitFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.SuspendWageringFlag = $scope.SelectedCustomer.SuspendWageringFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.ManageLinesFlag = $scope.SelectedCustomer.ManageLinesFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.AddNewAccountFlag = $scope.SelectedCustomer.AddNewAccountFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.EnterTransactionFlag = $scope.SelectedCustomer.EnterTransactionFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.ChangeTempCreditFlag = $scope.SelectedCustomer.ChangeTempCreditFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.UpdateCommentsFlag = $scope.SelectedCustomer.UpdateCommentsFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.ChangeSettleFigureFlag = $scope.SelectedCustomer.ChangeSettleFigureFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.SetMinimumBetAmountFlag = $scope.SelectedCustomer.SetMinimumBetAmountFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.EnterBettingAdjustmentFlag = $scope.SelectedCustomer.EnterBettingAdjustmentFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.EnableOfferingGlobalFlag = $scope.SelectedCustomer.EnableOfferingGlobalFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.EnableOfferingBuySellPointsFlag = $scope.SelectedCustomer.EnableOfferingBuySellPointsFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.EnableEditAccountsFlag = $scope.SelectedCustomer.EnableEditAccountsFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.AddFreePlaysFlag = $scope.SelectedCustomer.AddFreePlaysFlagBoolean == true ? 'Y' : 'N';
      $scope.SelectedCustomer.RoundDecimalsFlag = $scope.SelectedCustomer.RoundDecimalsFlagBoolean == true ? 'Y' : 'N';
			$scope.SelectedCustomer.CommentsForAgentExpDate = $scope.SelectedCustomer.CommentsForAgentExpDateString;
			$scope.confirmationMsg = "";
			$agentService.UpdateAgent({ agCustomer: $scope.SelectedCustomer }).then(function (result) {
				if (result.data.d.Code != 0) {
					Swal.fire(
						$scope.Translate("Error updating agent"),
						'',
						'error'
					);
					$scope.confirmationMsg = $scope.Translate("Error updating agent");
				} else {
					Swal.fire(
						$scope.Translate("Agent updated"),
						'',
						'success'
					);
					$scope.confirmationMsg = $scope.Translate("Agent updated");

				}
			});
			if ($scope.SelectedCustomer.Password && $scope.SelectedCustomer.Password.toString().trim() != "") {
				$agentService.UpdateAgentPassword({ agentId: $scope.SelectedCustomer.AgentID, password: $scope.SelectedCustomer.Password }
				).then(function (result) {
					if (result.data.d.Code != 0) {
						$scope.confirmationMsg = $scope.Translate("Error updating agent");

					} else {
						$scope.confirmationMsg = $scope.Translate("Agent updated");

					}
				});
			};

			setTimeout(function () {
				$scope.confirmationMsg = '';
			}, 10000)
    };

    $scope.TitleAgent = function () {
      if (!$scope.SelectedCustomer) return;
      return $scope.Translate("Agent") + ': ' + $scope.SelectedCustomer.CustomerID;
		};

		$rootScope.$on('transactionListLoaded', function () {
			$scope.Report = { AllTransactions: $agentService.TransactionList };
			$rootScope.safeApply();
			return true;
		});

		const ShowAllTransactions = function (presetDays = 0) {
			setTimeout(function () {
				function cb(start, end) {
					var diff = end.diff(start, 'days');
					jQuery('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
          if ($scope.SelectedCustomer.CustomerID)
            if (presetDays == 0) $agentService.GetCustomerTransactionListByDays($scope.SelectedCustomer.CustomerID, diff + 1);
						else {
              $agentService.GetCustomerTransactionListByDays($scope.SelectedCustomer.CustomerID, presetDays);
						}
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

		$scope.DeleteTransaction = function (documentNumber, presetDays = 0) {
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
							ShowAllTransactions(presetDays);
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
    };

    $scope.selectOrigin = function (agent) {
      $scope.AllAgentsList.forEach(x => x.originSelected = false);
      agent.originSelected = true;
      currentPage = 0, dataFinishLoad = false, allData = [];
      $scope.totalDisplayed = 100;
      $scope.tableData = [];
      getData(agent.AgentId);
    }

    $scope.selectDestiny = function (agent) {
      $scope.AllAgentsList.forEach(x => x.destinySelected = false);
      agent.destinySelected = true;
    }

    angular.element('#customersDiv').bind("scroll", function () {

      var dash = document.getElementsByClassName('dashbwrapper')[0];
      var windowHeight = "offsetHeight" in document.getElementsByClassName('dashbwrapper')[0] ? document.getElementsByClassName('dashbwrapper')[0].offsetHeight : document.documentElement.offsetHeight;
      var body = document.getElementById('customersDiv'), html = dash;
      var docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      windowBottom = windowHeight + body.scrollTop;

      if (windowBottom >= docHeight) {
        loadData()
      }
    });

    function loadData() {
      if (dataFinishLoad) {
        $scope.totalDisplayed += 100;
        getData($scope.AllAgentsList.find(x => x.originSelected == true).AgentId, true)
        $rootScope.safeApply();
        if ($scope.totalDisplayed >= $scope.tableData.length) $scope.LoadMoreIsVisible = false;
      } else {
        setTimeout(loadData, 400);
      }
    }

    function getData(agentId = null, loadMore = false) {
      let params = { weekNumber: 0, agentId: agentId ? agentId : $scope.SelectedCustomer.CustomerID, wageringStatus: '2', start: currentPage++ * 100, length: 100, search: '' };
      $agentService.GetCustomerListByAgentId(params).then(function (result) {
        if (loadMore == false) {
          thatsAll = false;
        }
        if (thatsAll === true) return;
        if (result.data.d.Data.length == 0) thatsAll = true;
        if (result.data.d.Data.length > 0) {
          let resultData = result.data.d.Data;
          resultData.forEach(function (data) {
            if (loadMore) {
              allData.push(data);
            }
          })
          if (loadMore == false) allData = resultData;
        }
        $scope.tableData = allData;
        dataFinishLoad = true;

      });
    }

    $scope.selectAllCustomerToMove = function () {
      $scope.tableData.forEach(x => x.selectedToMove = true)
    }

    $scope.unSelectAllCustomerToMove = function () {
      $scope.tableData.forEach(x => x.selectedToMove = false)
    }

    $scope.filterOriginAgents = function (e) {
      return !$scope.filter.originSearchInput || e.AgentId.toString().indexOf($scope.filter.originSearchInput.toUpperCase()) >= 0;
    }

    $scope.filterDestinyAgents = function (e) {
      return !$scope.filter.destinySearchInput || e.AgentId.toString().indexOf($scope.filter.destinySearchInput.toUpperCase()) >= 0;
    }

    $scope.moveCustomers = function () {
      let selectedCustomers = $scope.tableData.filter(x => x.selectedToMove == true);
      if (!selectedCustomers || selectedCustomers.length == 0) {
        Swal.fire({
          title: $scope.Translate('Select at leat one customer'),
          icon: 'warning',
          showCancelButton: false
        })
        return;
      }
      const selectedDestiny = $scope.AllAgentsList.find(x => x.destinySelected == true);
      if (!selectedDestiny) {
        Swal.fire({
          title: $scope.Translate('Select an agent to move selected customers'),
          icon: 'warning',
          showCancelButton: false
        })
        return;
      }
      Swal.fire({
        title: $scope.Translate('Are you sure?'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: $scope.Translate('Yes, move selected customers')
      }).then((result) => {
        if (result.isConfirmed) {

          Swal.fire({
            title: "Inherit from agent?",
            type: "warning",
            showDenyButton: true,
            showCancelButton: false,
            confirmButtonText: $scope.Translate(`Just Change agent`),
            denyButtonText: $scope.Translate(`Change agent and Inherit`),
          }).then((result) => {

            selectedCustomers.forEach(function (x, index) {
              Swal.fire({
                title: "Processing...",
                text: "Please wait",
                showConfirmButton: false,
                allowOutsideClick: false
              });
              $agentService.ChangeAgentToCustomer({ customerId: x.CustomerId, newAgentId: selectedDestiny.AgentId, inherit: result.isConfirmed == true ? false : true }).then(function () {
                if (index == selectedCustomers.length - 1) {
                  Swal.fire(
                    $scope.Translate('Success!'),
                    $scope.Translate('The customers were moved'),
                    'success'
                  );
                  $scope.tableData = [];
                  allData = [];
                  $rootScope.safeApply();
                  getData($scope.AllAgentsList.find(x => x.originSelected == true).AgentId, false)
                }
              })
            })
          })
        }
      })
    }


		$scope.Init();
	}
]);

