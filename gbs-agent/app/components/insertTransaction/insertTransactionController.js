appModule.controller("insertTransactionController", [
	'$scope', '$agentService', '$rootScope', '$routeParams', '$compile', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $rootScope, $routeParams, $compile, DTOptionsBuilder, DTColumnDefBuilder) {

		let vm = this;
		vm.dtInstance = {};
		vm.dtOptions = DTOptionsBuilder.newOptions()
			.withOption('createdRow', function (row) {
				// Recompiling so we can bind Angular directive to the DT
				$compile(angular.element(row).contents())($scope);
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
				vm.dtInstance = jQuery('#' + settings.sTableId).DataTable();
				vm.dtInstance.on('length', function (e, settings, len) {
					$scope.addSessionData('savedLength', len);
				});
			})
			.withOption('responsive', {
				details: {
					type: 'column',
					target: 8
				}
			})
			.withDOM('Bflrtip')
			.withOption('buttons', [
				{ extend: 'copy', text: 'Copy' },
				{ extend: 'excel', text: 'XLS' },
				{ extend: 'pdf', text: 'PDF' },
				{ extend: 'print', text: 'Print' },
				{
					text: '<i class="fa fa-refresh">', titleAttr: 'Update', action: function (e, dt, node, config) {
						dt.ajax.reload(null, false);
					}
				},
			])
			.withOption('aaSorting', [])
			.withOption('lengthMenu', [[10, 25, 50, 100], [10, 25, 50, 100]])
			.withOption('pageLength', $scope.getSessionData('savedLength') ? $scope.getSessionData('savedLength') : 50)
			.withOption('stateSave', true);
		vm.dtColumnDefs = [
			DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Id (Name)')).renderWith(render).notSortable(),
			DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Balance')).renderWith(render).notSortable(),
			DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Settle')).renderWith(render).notSortable(),
			DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Transaction')).renderWith(render).notSortable(),
			DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Amount')).renderWith(render).notSortable(),
			DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Figure Date')).renderWith(render).notSortable(),
			DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('Description')).renderWith(render).notSortable(),
			DTColumnDefBuilder.newColumnDef(7).withTitle($scope.Translate('Action')).renderWith(render).notSortable(),
			DTColumnDefBuilder.newColumnDef(8).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
		];

		function render(data, type, cL, meta) {
			switch (meta.col) {
				case 0:
					return `<span>${$scope.AgentAsCustomerInfo.IsAffiliate ? '***' + cL.CustomerID.trim().substring(cL.CustomerId.trim().length - 4, cL.CustomerId.trim().length) : cL.CustomerId}</span> 
              ${(cL.NameFirst != '' && cL.NameFirst) || (cL.NameLast != '' && cL.NameLast) ? '<span class="ml-1">(' + cL.NameFirst + ' ' + cL.NameLast + ')</span>' : ''}`;
				case 1:
					let bind4 = `<span class="${($scope.tableData[meta.row].CurrentBalance + cL.CasinoBalance) < 0 ? 'num_neg' : ($scope.tableData[meta.row].CurrentBalance + cL.CasinoBalance) > 0 ? 'num_pos' : ''}">${CommonFunctions.FormatNumber(($scope.tableData[meta.row].CurrentBalance + cL.CasinoBalance), true)}</span>`
					return bind4;;
				case 2:
					return `<span>${CommonFunctions.FormatNumber(cL.SettleFigure, false, true, false)}</span>`;
				case 3:
					$scope.tableData[meta.row].tranType = cL.CurrentBalance <= 0 ? 'Deposit' : 'Withdrawal';
					return `<select ng-model="tableData[${meta.row}].tranType">
										<option value="Deposit" ng-show="AgentInfo.EnterTransactionFlag == 'Y'">${$scope.Translate('Deposit')}</option>
										<option value="Withdrawal" ng-show="AgentInfo.EnterTransactionFlag == 'Y'">${$scope.Translate('Withdrawal')}</option>
										<option value="FpDeposit" ng-show="CanPostFreePlay()">${$scope.Translate('Free Plays Deposit')}</option>
										<option value="FpWithdrawal" ng-show="CanPostFreePlay()">${$scope.Translate('Free Plays Withdrawal')}</option>
										<option value="BetAdjCredit" ng-show="AgentInfo.EnterBettingAdjustmentFlag == 'Y'">${$scope.Translate('Bet Adj Credit')}</option>
										<option value="BetAdjDebit" ng-show="AgentInfo.EnterBettingAdjustmentFlag == 'Y'">${$scope.Translate('Bet Adj Debit')}</option>
										<option value="PromotionalCredit" ng-show="AgentInfo.EnterTransactionFlag == 'Y'">${$scope.Translate('Promotional Credit')}</option>
										<option value="PromotionalDebit" ng-show="AgentInfo.EnterTransactionFlag == 'Y'">${$scope.Translate('Promotional Debit')}</option>
									</select>`;
				case 4:
					$scope.tableData[meta.row].tranAmount = null;
					return `<input type='text' ng-model="tableData[${meta.row}].tranAmount" only-digits>`;
				case 5:
					$scope.tableData[meta.row].figureDate = $agentService.GetServerDateTime();
					return `<input type="date" ng-disabled="AgentInfo.EnterBettingAdjustmentFlag != 'Y' || !(tableData[${meta.row}].tranType == 'BetAdjDebit' || tableData[${meta.row}].tranType == 'BetAdjCredit')" class="form-control form-control-ios-fix" ng-model="tableData[${meta.row}].figureDate" ng-disabled="AgentInfo.ChangeTempCreditFlag != 'Y'">`;
				case 6:
					$scope.tableData[meta.row].description = null;
					return `<input type='text' ng-model="tableData[${meta.row}].description"</input>`;
				case 7:
					return `<button class="btn btn-default" ng-click="ShowCustomerDialog(tableData[${meta.row}], 5, '${cL.CustomerId}')">${$scope.Translate('History')}</button><button class="btn btn-default ml-1" ng-click="submitTransaction(${meta.row})">${$scope.Translate('Submit')}</button>`;
				default: return '';
			}
		}

		function getData() {
			vm.dtOptions
				.withOption('serverSide', true)
				.withOption('processing', true)
				.withOption('ajax', function (data, callback, settings) {
					let params = { weekNumber: 0, agentId: $rootScope.selectedAgent.AgentId, wageringStatus: '2', start: data.start, length: data.length, search: data.search.value };
					$agentService.GetCustomersInfoPaging(params).then(function (result) {
						if (result.data.d.Data.length > 0) {
							result.data.d.Data.forEach(function (data) {
								data.WageringActiveSwitch = data.WageringActive ? true : false;
							})
							$scope.tableData = result.data.d.Data;
						}
						else $scope.tableData = [];
						callback({
							recordsTotal: $scope.tableData[0] ? $scope.tableData[0].RecordsTotal : 0,
							recordsFiltered: $scope.tableData[0] ? $scope.tableData[0].RecordsTotal : 0,
							data: $scope.tableData[0] ? $scope.tableData : []
						});
						$compile(angular.element('#' + settings.sTableId).contents())($scope);
					});
				})
				.withDataProp('data');
		}

		jQuery('#modalDialog').on('hidden.bs.modal', function () {

			let dt = jQuery('#customersDT').DataTable();
			dt.ajax.reload(null, false);
			//vm.dtInstance.DataTable.ajax.reload(null, false);
		})

		async function submitTransactions() {
			for (let i = 0; i < $scope.tableData.length; i++) {
				let customer = $scope.tableData[i];
				if(customer.tranAmount != null && customer.tranAmount != '' && customer.tranAmount != 0){
					if (!(await submitTransaction(i, false))) { 
                                            break; 
                                        }
				}
				if (i == $scope.tableData.length - 1) {
					$scope.reloadData();
					$scope.fireSwal($scope.Translate('Success'), $scope.Translate('Transactions applied to customers of') + ' ' + $rootScope.selectedAgent.AgentId);
				}
			};
		}

		async function submitTransaction(index, single = true) {
			let customer = $scope.tableData[index];
			var customerId = customer.CustomerId;
			var tranCode = getTransactionCode(customer.tranType);
			var tranType = getTransactionType(customer.tranType);
			var amount = customer.tranAmount;
			var description = buildDescription(customer.CustomerId, customer.tranType, customer.description);
			var freePlayTransaction = (customer.tranType == "FpDeposit" || customer.tranType == "FpWithdrawal");
			let figureDate = moment(customer.figureDate).format('YYYY/MM/DD');

			if (customer.tranAmount != null && customer.tranAmount != '' && customer.tranAmount != 0) {
				let result = (await $agentService.InsertCustomerTransaction(customerId, tranCode, tranType, amount, null, description, (customer.tranType == "BetAdjCredit" || customer.tranType == "BetAdjDebit") ? figureDate : null, freePlayTransaction));
				if (result.Code == 1) {
					$scope.fireSwal($scope.Translate('Error posting the transaction.'), '', 'error');
					return false;
				}
				if (single) {
					$scope.reloadData();
					$scope.fireSwal($scope.Translate('Success'), $scope.Translate('Transaction applied to customer') + ' ' + customer.CustomerId);
				}
			} else {
				$scope.fireSwal($scope.Translate('Warning'), $scope.Translate('Please set amount'), 'warning');
			}
                        return true
		}

		$scope.submitTransaction = submitTransaction;

		$scope.CanPostFreePlay = function () {
			if ($agentService.AgentInfo.AddFreePlaysFlag != 'Y' || !$agentService.Restrictions) return false;
			for (var i = 0; $agentService.Restrictions.length > i; i++) {
				if ($agentService.Restrictions[i].Code === "POSTFPTRN") return false;
			}
			return true;
		};

		$scope.submitTransactions = submitTransactions;

		$scope.Init = function () {
			if ($agentService.AgentInfo) {
				$scope.SuspendWagering = $agentService.AgentInfo ? $agentService.AgentInfo.SuspendWageringFlag == 'Y' : false;
				selectedAgentReady();
			}
			else {
				$rootScope.$on('AgentInfoLoaded', function () {
					if ($agentService.AgentInfo) {
						$scope.SuspendWagering = $agentService.AgentInfo.SuspendWageringFlag == 'Y';
						selectedAgentReady();
					}
				});
			}
		};

		function buildDescription(customerId, tranType, description) {
			if (description != null && description != '') return description;
			var baseDesc = "";
			switch (tranType) {
				case "Deposit":
					baseDesc = $scope.Translate("Customer Deposit");
					break;
				case "FpDeposit":
					baseDesc = $scope.Translate("Customer Deposit * Free Play * [Internet] *");
					break;
				case "BetAdjCredit":
					baseDesc = $scope.Translate("Credit Betting Adjustment for ") + customerId;
					break;
				case "Withdrawal":
					baseDesc = $scope.Translate("Customer Withdrawal");
					break;
				case "FpWithdrawal":
					baseDesc = $scope.Translate("Customer Withdrawal * Free Play * [Internet] *");
					break;
				case "BetAdjDebit":
					baseDesc = $scope.Translate("Debit Betting Adjustment for ") + customerId;
					break;
				case "PromotionalCredit":
					baseDesc = $scope.Translate("Promotional Credit for ") + customerId;
					break;
				case "PromotionalDebit":
					baseDesc = $scope.Translate("Promotional Debit for ") + customerId;
					break;
			}
			baseDesc += description ? ' - ' + description.substring(0, 200) : '';
			return baseDesc;
		}

		function getTransactionCode(tranType) {
			switch (tranType) {
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

		function getTransactionType(tranType) {
			switch (tranType) {
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
				  case "PromotionalCredit":
					return "B";
				  case "PromotionalDebit":
					return "N";
			}
			return "";
		}

		function getTransactionName(tranType) {
			switch (tranType) {
				case "Deposit":
				case "Withdrawal":
					return tranType;
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

		function selectedAgentReady() {
			if ($rootScope.selectedAgent) {
				getData();
			} else {
				$rootScope.$on('AgentAsCustomerInfoReady', function () {
					getData();
				});
			}
		}

		$scope.WagerLimit = function (customer) {
			var expTempDate = new Date(customer.TempWagerLimitExpirationString);
			var today = $agentService.GetServerDateTime();
			if (expTempDate > today) {
				return customer.TempWagerLimit;
			}
			return customer.WagerLimit;
		};

		$scope.reloadData = function () {
			let dt = jQuery('#customersDT').DataTable();
			dt.ajax.reload(null, false);
			//vm.dtInstance.DataTable.ajax.reload(null, false);
		};

		$scope.Init();

		$scope.$on('$destroy', function () {
			document.getElementById("page-content-wrapper").classList.remove('no-printable');

		});
	}
]);