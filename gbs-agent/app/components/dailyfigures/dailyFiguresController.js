appModule.controller("dailyFiguresController", [
	'$scope', '$agentService', '$routeParams', '$location', '$rootScope', '$sce', function ($scope, $agentService, $routeParams, $location, $rootScope, $sce) {

		var agentsCurrentBalance = [], exportData = [], currentPage = 0, dataFinishLoad = false, rawData = [];
		$scope.AgentsToShow = [];
		$scope.thatsAll = false,
			$scope.Summary = { TotalHead: 0 };
		$scope.totalDisplayed = 100000;
		$scope.openBetsSource = [];
		$scope.closeDayOfWeek = 0;
		$scope.expandedRows = [];
		$scope.TransactionsByDate = [];
		$scope.fontMode = {
			size: '1'
		};
		$scope.ReportFilters = {
			WeekNumber: {},
			BreakoutSportsAndCasinos: false,
			ShowCashTrans: false,
			ShowDashboard: true
		};

		$scope.Report = {
			CasinoTransactions: [],
			CashTransactions: [],
			DailyFigures: null,
			OpenBets: null,
			AllTransactions: null,
			TransactionsByDate: null
		};

		$scope.OrderModeList = [
			{ name: $scope.Translate('Order By Hierarchy'), value: true },
			{ name: $scope.Translate('Order By Name'), value: false }
		]

		$scope.dfClassicModeTemplate = appModule.Root + "/app/components/dailyFigures/dFClassicMode.html?v=5";
		$scope.dfNewClassicModeTemplate = appModule.Root + "/app/components/dailyFigures/dFNewClassicMode.html?v=5";
		$scope.dfScrollModeTemplate = appModule.Root + "/app/components/dailyFigures/dFScrollMode.html?v=5";
		$scope.dfNewScrollModeTemplate = appModule.Root + "/app/components/dailyFigures/dFNewScrollMode.html?v=5";
		$scope.dfCompactTemplate = appModule.Root + "/app/components/dailyFigures/dFCompactMobile.html?v=5";
		$scope.summaryCompactTemplate = appModule.Root + "/app/components/dailyFigures/summaryCompact.html?v=5";
		$scope.summaryScrollTemplate = appModule.Root + "/app/components/dailyFigures/summaryScroll.html?v=5";

		$scope.printDiv = function () {
			const content = document.getElementById('dailyFiguresDiv').cloneNode(true);
			const printWindow = window.open('', '', 'height=5000,width=3000');

			printWindow.document.write('<html><head><title>Daily Figures</title>');
			// Copiar los estilos del head
			const styles = document.querySelectorAll('link[rel="stylesheet"], style');
			styles.forEach(style => {
				printWindow.document.write(style.outerHTML);
			});
			printWindow.document.write('</head><body></body></html>');

			printWindow.document.body.appendChild(content);
			printWindow.document.close();
			printWindow.focus();

			// Esperar a que se renderice
			setTimeout(() => {
				printWindow.print();
				printWindow.close();
			}, 500);
		}

		function InitializeTotals() {
			$scope.ReportTotals = {
				PrevBalance: 0,
				MON: 0,
				TUE: 0,
				WED: 0,
				THU: 0,
				FRI: 0,
				SAT: 0,
				SUN: 0,
				Week: 0,
				OverAllFigure: 0,
				PlaysCount: 0,
				LastWeek: 0,
				OverAllFigureLastWeek: 0,
				CurrentBalance: 0,
				PendingCount: 0,
				PendingTotal: 0,
				OtherTran: 0,
				showTran: 1,
				showName: false
			};
		};

		InitializeTotals();


		$scope.hierarchy = $scope.getSessionData('hierarchyMode') ? $scope.getSessionData('hierarchyMode') : { mode: '0' };

		function loadData() {
			if (dataFinishLoad) {
				$scope.totalDisplayed += 100000;
				$scope.GetCustomersDailyFigures(true);
				$rootScope.safeApply();
				if ($scope.totalDisplayed >= $scope.CustomersDailyFigures.length) $scope.LoadMoreIsVisible = false;
			} else {
				setTimeout(loadData, 400);
			}
		}

		$scope.loadData = loadData;


		angular.element('#dailyFiguresDiv').bind("scroll", function () {

			var dash = document.getElementsByClassName('dashbwrapper')[0];
			var windowHeight = "offsetHeight" in document.getElementsByClassName('dashbwrapper')[0] ? document.getElementsByClassName('dashbwrapper')[0].offsetHeight : document.documentElement.offsetHeight;
			var body = document.getElementById('dailyFiguresDiv'), html = dash;
			var docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
			windowBottom = windowHeight + body.scrollTop;

			if (windowBottom >= docHeight) {
				loadData()
			}
		});

		$scope.Init = function () {
			$scope.SettleFigureMode = false;
			$scope.LoadingReportData = false;
			resultData = [];
			totalCustomersGet = 0;
			$scope.CustomersToShow = $scope.BuildCustomerTypesToShowObject();
			let savedCustomerToShowSelection = $scope.getSessionData('dfCustToShow');
			let selectedCustomerToShow = savedCustomerToShowSelection ?
				$scope.CustomersToShow[$scope.CustomersToShow.findIndex(x => x.Code == savedCustomerToShowSelection.Code)] : $scope.CustomersToShow[1];
			$scope.ReportFilters.CustomersToShow = selectedCustomerToShow;

			$scope.ReportFilters.AgentToShow = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
			if ($routeParams.ShowSettleFigure != null) {
				$scope.SettleFigureMode = $routeParams.ShowSettleFigure;
			}
			_customersDailyFiguresAry = new Array();
			if ($scope.AgentAsCustomerInfo && $scope.AllAgentsList) {
				$scope.ReportFilters.AgentToShow = $scope.AllAgentsList && $scope.AllAgentsList.length > 0 ? $scope.AllAgentsList[0] : null;
				getTotalCustomers();
				/*$agentService.GetAgentsCurrentBalance().then(function (result) {
							agentsCurrentBalance = result.data.d.Data;
							getTotalCustomers();
				});*/
			} else {
				$rootScope.$on('AgentAsCustomerInfoReady', function () {
					$scope.ReportFilters.AgentToShow = $scope.AllAgentsList && $scope.AllAgentsList.length > 0 ? $scope.AllAgentsList[0] : null;
					getTotalCustomers();
					/*$agentService.GetAgentsCurrentBalance().then(function (result) {
								  agentsCurrentBalance = result.data.d.Data;
								  getTotalCustomers();
					});*/
				});
			}

			$scope.orderMode = $scope.getSessionData('orderMode') ? $scope.OrderModeList.find(x => x.value == $scope.getSessionData('orderMode').value) : $scope.OrderModeList[0];
			$rootScope.viewMode = $scope.getSessionData('viewMode') ? $scope.getSessionData('viewMode') : '1';

		};

		$scope.getLastGeekBind = function () {
			if (!$scope.WeeksRange) return;
			let weekIdx = $scope.WeeksRange.findIndex(x => $scope.WeekNumber.Index == x.Index) + 1;
			return (weekIdx == $scope.WeeksRange.length) ? `${$scope.Translate('Week before')} ${$scope.WeekNumber.DateRange}` : $scope.WeeksRange[weekIdx].DateRange;
		}


		var getAgentsCurrentBalance = function (agent) {
			if (typeof agentsCurrentBalance === "undefined") return 0;
			var cb = 0;
			agentsCurrentBalance.forEach(function (ag) {
				if (ag.CustomerID.trim() == agent) {
					cb = ag.CurrentBalance;
					return;
				}
			});
			return cb;
		};

		$scope.GetBankTotals = function () {
			if (!agentsCurrentBalance || typeof agentsCurrentBalance === "undefined") return 0;
			var cbt = 0;
			agentsCurrentBalance.forEach(function (ag) {
				cbt += ag.CurrentBalance;
			});
			return cbt;

		};

		$scope.BuildCustomerTypesToShowObject = function () {
			var returnedList = new Array();
			var item = { Code: '0', Description: $scope.Translate('All Players') };
			returnedList.push(item);
			item = { Code: '2', Description: $scope.Translate('Active Players Only') };
			returnedList.push(item);
			item = { Code: '1', Description: $scope.Translate('Active Players With Bal') };
			returnedList.push(item);
			if ($scope.SettleFigureMode) {
				item = { Code: 'S', Description: $scope.Translate('Players With Settle Only') };
				returnedList.push(item);
			}

			return returnedList;
		};


		function getTotalCustomers() {
			$agentService.GetTotalCustomers({ agentId: $scope.ReportFilters.AgentToShow ? $scope.ReportFilters.AgentToShow.AgentId : $scope.AgentAsCustomerInfo.CustomerID }).then(function (result) {
				totalCustomers = result.data.d.Data;
				$scope.GetCustomersDailyFigures();
			});
		}

		$scope.GetCustomersDailyFigures = function (loadMore = false) {
			if (!$scope.AgentAsCustomerInfo) return;
			$scope.closeDayOfWeek = $scope.ReportFilters.AgentToShow.CloseDayOfWeek;
			$scope.WeeksRange = $agentService.GetWeeksRange(true, $scope.closeDayOfWeek);
			$scope.WeekNumber = $scope.WeekNumber ? $scope.WeeksRange[$scope.WeeksRange.findIndex(x => x.Index == $scope.WeekNumber.Index)] : $scope.WeeksRange[0];
			if (loadMore == false) {
				currentPage = 0;
				$scope.thatsAll = false;
			}
			if ($scope.thatsAll === true) return;
			dataFinishLoad = false;
			$scope.LoadingReportData = true;
			$rootScope.safeApply();
			const activeOnly = $scope.ReportFilters.CustomersToShow ? $scope.ReportFilters.CustomersToShow.Code : '2';
			$scope.totalDisplayed = 100000;
			$agentService.GetCustomersDailyFigures($scope.WeekNumber.Index, $scope.ReportFilters.AgentToShow ? $scope.ReportFilters.AgentToShow.AgentId : $scope.AgentAsCustomerInfo.CustomerID, 100000, currentPage++ * 100000, activeOnly, $scope.orderMode.value).then(function (result) {
				rawData = result.data.d.Data;
				prepareData(rawData, loadMore);
			});
		};

		function prepareData(data, loadMore) {
			var groupedData = $scope.GroupDailyFiguresByAgent(data);
			if (groupedData.length == 0) $scope.thatsAll = true;
			var customersDailyFiguresObj = { Data: groupedData, WeekNumber: $scope.WeekNumber.Index };
			_customersDailyFiguresAry.push(customersDailyFiguresObj);
			$scope.ReportTotals.OtherTran = 0;
			groupedData.forEach(function (element) {
				element.showTran = false;
				if (loadMore) {
					if ($scope.CustomersDailyFigures[$scope.CustomersDailyFigures.length - 1].AgentId.trim().toUpperCase() == element.AgentId.trim().toUpperCase()) {
						$scope.CustomersDailyFigures[$scope.CustomersDailyFigures.length - 1].CustomerDailyFigures =
							[...$scope.CustomersDailyFigures[$scope.CustomersDailyFigures.length - 1].CustomerDailyFigures, ...element.CustomerDailyFigures];
						$scope.GetAgentTotals($scope.CustomersDailyFigures[$scope.CustomersDailyFigures.length - 1].CustomerDailyFigures, $scope.CustomersDailyFigures[$scope.CustomersDailyFigures.length - 1]);
					} else {
						$scope.GetAgentTotals(element.CustomerDailyFigures, element);
						$scope.CustomersDailyFigures.push(element);
					}
				} else {
					$scope.GetAgentTotals(element.CustomerDailyFigures, element);
				}
			});
			if (!loadMore) {
				$scope.CustomersDailyFigures = groupedData;
			}
			$scope.LoadingReportData = false;
			dataFinishLoad = true;
			if (loadMore == false) getSummary();
			$rootScope.safeApply();
			setTimeout(function () {
				if (loadMore == false) {
					syncscroll.reset();
					const date = new Date();
					const id = `${date.getMonth() + 1}/${date.getDate()}`;
					const weekBeg = document.getElementById(id);
					if (weekBeg) weekBeg.scrollIntoView({ block: "end", inline: "start" });
				}
			}, 200);
			setTimeout(function () {
				if ($scope.getSessionData('expandedRows') == null) {
					$scope.ExpandAgents();
				}
				$scope.expandedRows = $scope.getSessionData('expandedRows');
			}, 300)
		}

		$scope.ExportData = function () {
			exportData = [];
			Swal.fire({
				title: "Processing...",
				text: "Please wait",
				showConfirmButton: false,
				allowOutsideClick: false
			});
			const activeOnly = $scope.ReportFilters.CustomersToShow.Code;
			$agentService.GetCustomersDailyFigures($scope.WeekNumber.Index, $scope.ReportFilters.AgentToShow ? $scope.ReportFilters.AgentToShow.AgentId : $scope.AgentAsCustomerInfo.CustomerID, 1000000, 0, activeOnly, $scope.orderMode.value).then(function (result) {
				var groupedData = $scope.GroupDailyFiguresByAgent(result.data.d.Data);
				groupedData.forEach(function (agentData) {
					let expAg1 = { Id: '', FullName: '', Password: '', PrevBal: '' };
					expAg1[`${$scope.GetDate(1)}`] = '';
					expAg1[`${$scope.GetDate(2)}`] = '';
					expAg1[`${$scope.GetDate(3)}`] = '';
					expAg1[`${$scope.GetDate(4)}`] = '';


					let expAg2 = { Id: ($scope.rawAgentsList ? agentData.CustomerDailyFigures[0].Hierarchy.substring(2) : $scope.formatCustomer(agentData.AgentId)), FullName: '', Password: '', PrevBal: '' };
					expAg2[`${$scope.GetDate(1)}`] = '';
					expAg2[`${$scope.GetDate(2)}`] = '';
					expAg2[`${$scope.GetDate(3)}`] = '';
					expAg2[`${$scope.GetDate(4)}`] = '';


					let expAg3 = { Id: '', FullName: '', Password: '', PrevBal: '' };
					expAg3[`${$scope.GetDate(1)}`] = '';
					expAg3[`${$scope.GetDate(2)}`] = '';
					expAg3[`${$scope.GetDate(3)}`] = '';
					expAg3[`${$scope.GetDate(4)}`] = '';


					exportData.push(expAg1);
					exportData.push(expAg2);
					exportData.push(expAg3);
					exportData.push(...agentData.CustomerDailyFigures.map(function (d) {
						let expt = { Id: d.CustomerId.trim(), FullName: d.FullName, Password: d.Password, PrevBal: d.PrevBal / 100 };
						expt[`${$scope.GetDate(1)}`] = CommonFunctions.FormatNumber($scope.GetDayFigure(d, 1, false), true);
						expt[`${$scope.GetDate(2)}`] = CommonFunctions.FormatNumber($scope.GetDayFigure(d, 2, false), true);
						expt[`${$scope.GetDate(3)}`] = CommonFunctions.FormatNumber($scope.GetDayFigure(d, 3, false), true);
						expt[`${$scope.GetDate(4)}`] = CommonFunctions.FormatNumber($scope.GetDayFigure(d, 4, false), true);
						expt[`${$scope.GetDate(5)}`] = CommonFunctions.FormatNumber($scope.GetDayFigure(d, 5, false), true);
						expt[`${$scope.GetDate(6)}`] = CommonFunctions.FormatNumber($scope.GetDayFigure(d, 6, false), true);
						expt[`${$scope.GetDate(0)}`] = CommonFunctions.FormatNumber($scope.GetDayFigure(d, 0, false), true);
						expt.ThisWeek = CommonFunctions.FormatNumber($scope.GetWeekFigure(d, false), true);
						expt.OtherTran = CommonFunctions.FormatNumber(d.OtherTran, true);
						expt.PendingTotal = CommonFunctions.FormatNumber(d.PendingTotal, true);
						expt.OverallFigure = CommonFunctions.FormatNumber($scope.GetOverall(d), true);
						return expt;
					}))
				})
				const fileName = 'Daily Figures';
				const exportType = 'xls';
				window.exportFromJSON({ data: exportData, fileName, exportType });
				Swal.fire(
					$scope.Translate('Data exported'),
					'',
					'success'
				);
			});


		}

		$scope.GroupDailyFiguresByAgent = function (rawData, isPreviousWeek = false) {
			var returnedData = [];
			var holdAgentId = null;
			if (rawData && rawData.length > 0) {
				if (isPreviousWeek == false) {
					$scope.StartingDate = rawData[0].StartingDateString;
					$scope.EndingDate = rawData[0].EndingDateString;
				}
				for (var i = 0; i < rawData.length; i++) {
					rawData[i].WeekData = getWeekList();
					if (holdAgentId != rawData[i].AgentId) {
						//var CustomersData = new Array();
						//var AgentData = { AgentId: rawData[i].AgentId, StartingDateString: rawData[i].StartingDateString, EndingDateString: rawData[i].EndingDateString, CustomerDailyFigures: rawData[i].CustomerDailyFigures };
						//CustomersData.push(rawData[i]);
						//AgentData.CustomerDailyFigures = CustomersData;
						returnedData.push(rawData[i]);
					}
					else {
						returnedData[returnedData.length - 1].CustomerDailyFigures.push(rawData[i]);
					}
					holdAgentId = rawData[i].AgentId;
				}
			}
			return returnedData;
		};

		function getWeekList() {
			let currentDate = moment().format('M/D');
			let weekData = { weekList: [], currentDay: null, currentDayIndex: 0 }
			for (let i = 0; i < 7; i++) {
				let date = $scope.GetDate(i);
				if (date == currentDate) weekData.currentDayIndex = i;
				weekData.weekList.push($sce.trustAsHtml(`<span>${$scope.GetWeekDayName(i)}</span><br /><span>${date}</span>`));
			}
			weekData.currentDay = weekData.weekList[weekData.currentDayIndex];
			return weekData;
		}

		$scope.AssignProperObject = function (weekNumIdx) {
			var data = null;
			if (_customersDailyFiguresAry != null) {
				for (var i = 0; i < _customersDailyFiguresAry.length; i++) {
					if (parseInt(_customersDailyFiguresAry[i].WeekNumber) == parseInt(weekNumIdx)) {
						data = _customersDailyFiguresAry[i].Data;
						break;
					}
				}
			}
			return data;
		};

		$scope.AddToList = function (weekNumIdx) {
			if (_customersDailyFiguresAry.length == 0)
				return true;
			for (var i = 0; i < _customersDailyFiguresAry.length; i++) {
				if (parseInt(_customersDailyFiguresAry[i].WeekNumber) == parseInt(weekNumIdx))
					return false;
			}
			return true;
		};

		$scope.GetDate = function (dayIdx) {
			return $agentService.GetDailyFigureDate(dayIdx, $scope.StartingDate);
		};

		$scope.GetMonth = function () {
			return $agentService.GetMonthNameFromDate($scope.StartingDate, $scope.EndingDate);
		};

		$scope.GetWeekDayName = function (idx) {
			if (!$scope.closeDayOfWeek) return;
			return $agentService.GetWeekDayName(idx, $scope.closeDayOfWeek);
		};

		$scope.showDay = function (dayNum) {
			const day = $scope.GetWeekDayName(dayNum);
			switch (day) {
				case "MON":
					return $scope.dfSetting.mon;
				case "TUE":
					return $scope.dfSetting.tue;
				case "WED":
					return $scope.dfSetting.wed;
				case "THU":
					return $scope.dfSetting.thu;
				case "FRI":
					return $scope.dfSetting.fri;
				case "SAT":
					return $scope.dfSetting.sat;
				case "SUN":
					return $scope.dfSetting.sun;
			}
		}

		$scope.GetDayFigure = function (custDf, dayIdx) {
			return $agentService.GetDayFigure(custDf, dayIdx, $scope.ReportFilters.BreakoutSportsAndCasinos);
		};

		$scope.GetCasinoFigure = function (custDf, dayIdx) {
			return $agentService.GetCasinoFigure(custDf, dayIdx);
		};

		$scope.GetWeekFigure = function (custDf) {
			if (custDf == null)
				return 0;
			custDf.weekFigure = (custDf.AmountWonSunday - custDf.AmountLostSunday);
			if (!$scope.ReportFilters.BreakoutSportsAndCasinos) {
				custDf.weekFigure += (custDf.AmountWonCasinoSunday - custDf.AmountLostCasinoSunday);
			}
			custDf.weekFigure += (custDf.AmountWonMonday - custDf.AmountLostMonday);
			if (!$scope.ReportFilters.BreakoutSportsAndCasinos) {
				custDf.weekFigure += (custDf.AmountWonCasinoMonday - custDf.AmountLostCasinoMonday);
			}
			custDf.weekFigure += (custDf.AmountWonTuesday - custDf.AmountLostTuesday);
			if (!$scope.ReportFilters.BreakoutSportsAndCasinos) {
				custDf.weekFigure += (custDf.AmountWonCasinoTuesday - custDf.AmountLostCasinoTuesday);
			}
			custDf.weekFigure += (custDf.AmountWonWednesday - custDf.AmountLostWednesday);
			if (!$scope.ReportFilters.BreakoutSportsAndCasinos) {
				custDf.weekFigure += (custDf.AmountWonCasinoWednesday - custDf.AmountLostCasinoWednesday);
			}
			custDf.weekFigure += (custDf.AmountWonThursday - custDf.AmountLostThursday);
			if (!$scope.ReportFilters.BreakoutSportsAndCasinos) {
				custDf.weekFigure += (custDf.AmountWonCasinoThursday - custDf.AmountLostCasinoThursday);
			}
			custDf.weekFigure += (custDf.AmountWonFriday - custDf.AmountLostFriday);
			if (!$scope.ReportFilters.BreakoutSportsAndCasinos) {
				custDf.weekFigure += (custDf.AmountWonCasinoFriday - custDf.AmountLostCasinoFriday);
			}
			custDf.weekFigure += (custDf.AmountWonSaturday - custDf.AmountLostSaturday);
			if (!$scope.ReportFilters.BreakoutSportsAndCasinos) {
				custDf.weekFigure += (custDf.AmountWonCasinoSaturday - custDf.AmountLostCasinoSaturday);
			}
			custDf.weekFigure *= 100;
			custDf.CurrentBalance = custDf.weekFigure + custDf.PrevBal + custDf.OtherTran;
			return custDf.weekFigure;
		};

		$scope.GetCasinoWeekFigure = function (custDf) {
			var casinoWeekFigure = 0;
			if (custDf == null)
				return casinoWeekFigure;
			casinoWeekFigure = (custDf.AmountWonCasinoSunday - custDf.AmountLostCasinoSunday) +
				(custDf.AmountWonCasinoMonday - custDf.AmountLostCasinoMonday) +
				(custDf.AmountWonCasinoTuesday - custDf.AmountLostCasinoTuesday) +
				(custDf.AmountWonCasinoWednesday - custDf.AmountLostCasinoWednesday) +
				(custDf.AmountWonCasinoThursday - custDf.AmountLostCasinoThursday) +
				(custDf.AmountWonCasinoFriday - custDf.AmountLostCasinoFriday) +
				(custDf.AmountWonCasinoSaturday - custDf.AmountLostCasinoSaturday);
			return casinoWeekFigure * 100;
		};

		$scope.GetOverallFigure = function (custDf, divideFig) {
			return custDf.CurrentBalance;
			/*var weekFigure = 0;
			if (custDf == null)
					return weekFigure;
			weekFigure = $scope.GetWeekFigure(custDf, divideFig);
		
			return custDf.PrevBal + weekFigure;*/
		};


		function getSummary() {
			let params = {
				weekNumber: $scope.WeekNumber.Index,
				agentId: $scope.ReportFilters.AgentToShow ? $scope.ReportFilters.AgentToShow.AgentId : $scope.AgentAsCustomerInfo.CustomerID
			};
			$agentService.GetAgentsDailyFiguresSummary(params).then(function (result) {
				let rawData = result.data.d.Data[0];
				$scope.Summary.Total = 0;
				$scope.Summary.PlaysCount = 0;
				$scope.Summary.Total = rawData.CurrentBalance / 100;
				$scope.Summary.TotalHead = rawData.HeadCount;
				$scope.Summary.PendingCount = rawData.PendingCount;
				$scope.Summary.PreviusWeekTotal = rawData.PrevBal / 100;
				var rawWeek = $scope.GetWeekFigure(rawData, false);
				$scope.ReportTotals.WeekData = getWeekList();
				$scope.ReportTotals.Week = rawWeek;
				$scope.ReportTotals.PrevBalance += rawData.PrevBal;
				$scope.ReportTotals.SUN = $scope.GetDayFigure(rawData, 0, false);
				$scope.ReportTotals.MON = $scope.GetDayFigure(rawData, 1, false);
				$scope.ReportTotals.TUE = $scope.GetDayFigure(rawData, 2, false);
				$scope.ReportTotals.WED = $scope.GetDayFigure(rawData, 3, false);
				$scope.ReportTotals.THU = $scope.GetDayFigure(rawData, 4, false);
				$scope.ReportTotals.FRI = $scope.GetDayFigure(rawData, 5, false);
				$scope.ReportTotals.SAT = $scope.GetDayFigure(rawData, 6, false);
				$scope.ReportTotals.CurrentBalance = rawData.CurrentBalance;
				$scope.ReportTotals.OverAllFigure = rawData.ThisWeekOverall;
				$scope.ReportTotals.PlaysCount = rawData.PlaysCount;
				$scope.ReportTotals.PendingCount = rawData.PendingCount;
				$scope.ReportTotals.PendingTotal = rawData.PendingTotal;
				if (rawData.OtherTran) $scope.ReportTotals.OtherTran = rawData.OtherTran;
				$scope.ReportTotals.LastWeekOverall = rawData.LastWeekOverall;
				$scope.ReportTotals.PrevBal = rawData.PrevBal;


				$scope.ReportTotals.PlaysCountMonday = rawData.PlaysCountMonday ? rawData.PlaysCountMonday : 0;
				$scope.ReportTotals.PlaysCountTuesday = rawData.PlaysCountTuesday ? rawData.PlaysCountTuesday : 0;
				$scope.ReportTotals.PlaysCountWednesday = rawData.PlaysCountWednesday ? rawData.PlaysCountWednesday : 0;
				$scope.ReportTotals.PlaysCountThursday = rawData.PlaysCountThursday ? rawData.PlaysCountThursday : 0;
				$scope.ReportTotals.PlaysCountFriday = rawData.PlaysCountFriday ? rawData.PlaysCountFriday : 0;
				$scope.ReportTotals.PlaysCountSaturday = rawData.PlaysCountSaturday ? rawData.PlaysCountSaturday : 0;
				$scope.ReportTotals.PlaysCountSunday = rawData.PlaysCountSunday ? rawData.PlaysCountSunday : 0;
			})
		}

		$scope.GetOverall = function (df) {
			if ($scope.WeekNumber.Index == 0) {
				df.overall = df.CurrentBalance;
				return df.CurrentBalance
			};
			var x = 0;
			var overall = 0;
			while (x < 7) {
				var dfData = 'df' + x;
				overall += df[dfData];
				x++;
			}
			return df.overall = (overall + df.PrevBal + df.OtherTran);
		};

		$scope.GetAgentTotals = function (sortedFigure, dF) {
			if (sortedFigure == null) return 0;
			var returnedValue = 0.0;
			dF.PrevBalance = 0; dF.Mon = 0; dF.Tue = 0; dF.Wed = 0; dF.Thu = 0; dF.Fri = 0; dF.Sat = 0; dF.Sun = 0; dF.PlaysCount = 0;
			dF.PendingCount = 0; dF.PendingTotal = 0; dF.Week = 0; dF.Overall = 0; dF.settle = 0, dF.OtherTran = 0, dF.TotalActive = 0;
			for (let i = 0; i < sortedFigure.length; i++) {
				$agentService.GetDayFigure(sortedFigure[i]);
				dF.PrevBalance += sortedFigure[i].PrevBal;
				dF.Mon += $scope.GetDayFigure(sortedFigure[i], 1, false);
				dF.Tue += $scope.GetDayFigure(sortedFigure[i], 2, false);
				dF.Wed += $scope.GetDayFigure(sortedFigure[i], 3, false);
				dF.Thu += $scope.GetDayFigure(sortedFigure[i], 4, false);
				dF.Fri += $scope.GetDayFigure(sortedFigure[i], 5, false);
				dF.Sat += $scope.GetDayFigure(sortedFigure[i], 6, false);
				dF.Sun += $scope.GetDayFigure(sortedFigure[i], 0, false);
				dF.Week += $scope.GetWeekFigure(sortedFigure[i]);
				dF.Overall += sortedFigure[i].CurrentBalance;//$scope.GetOverall(sortedFigure[i]);
				dF.PendingCount += sortedFigure[i].PendingCount;
				dF.PendingTotal += sortedFigure[i].PendingTotal;
				dF.OtherTran += sortedFigure[i].OtherTran;
				dF.PlaysCount += sortedFigure[i].PlaysCount;
				dF.TotalActive += (sortedFigure[i].PlaysCountMonday != 0 || sortedFigure[i].PlaysCountTuesday != 0 || sortedFigure[i].PlaysCountWednesday != 0 ||
					sortedFigure[i].PlaysCountThursday != 0 || sortedFigure[i].PlaysCountFriday != 0 || sortedFigure[i].PlaysCountSaturday != 0 ||
					sortedFigure[i].PlaysCountSunday != 0 || sortedFigure[i].PrevBal != 0) ? 1 : 0;
			}
			return returnedValue;
		};

		$scope.Filters = $scope.Filters || {};

		$scope.saveSelections = function () {
			$scope.addSessionData('dfCustToShow', $scope.ReportFilters.CustomersToShow);
			$scope.addSessionData('hierarchyMode', $scope.hierarchy);
			$scope.addSessionData('orderMode', $scope.orderMode);
			$scope.addSessionData('viewMode', $rootScope.viewMode);
			setTimeout(function () {
				syncscroll.reset();
			}, 200);
		};

		$scope.statusCustomerChanged = function () {
			$scope.saveSelections();
			$scope.GetCustomersDailyFigures();
		}

		$scope.Filters.ActiveAgent = function () {
			return function (df) {
				return !(df.Monday == 0 && df.Tuesday == 0 && df.Wednesday == 0 && df.Thursday == 0 && df.Friday == 0 && df.Saturday == 0 && df.Sunday == 0 && ($scope.WeekNumber.Index == 0 ? df.CurrentBalance == 0 : true));

			};
		};

		$scope.ShowRow = function (row) {
			if (!$scope.ReportFilters.CustomersToShow) return true;
			var showItem = false;
			if ($scope.ReportFilters.CustomersToShow.Code == 'A') {
				showItem = true;
			} else {
				if ($scope.ReportFilters.CustomersToShow.Code == 'C' && row.Active == 'Y') {
					showItem = true;
				} else {
					if ($scope.ReportFilters.CustomersToShow.Code == 'S' && row.SettleFigure > 0) {
						showItem = true;
					}
				}
			}
			return showItem;
		};

		//DailyFigure Details

		$scope.CloseDailyFiguresDetails = function () {
			document.getElementById('monday').className = ('collapse');
			$scope.Arrow = -1;
		};

		var OpenDailyFiguresDetails = function () {
			var l = document.getElementById('monday');
			if (l) l.className = ('collapse in');
		};

		$scope.ShowTransactions = function (dfRow) {
			$scope.data = null;
			$scope.currentCustomerId = dfRow.CustomerId.trim();
			$scope.date = $agentService.GetDailyFigureDate(6, dfRow.EndingDateString, true);
		}

		async function showWeekDetails(dfRow, includeCasino) {
			async function showMoreDetailsAsync(dfRow, dayOfWeek, includeCasino, allWeek = false) {
				if (!allWeek) {
					$scope.allWeek = false;
					OpenDailyFiguresDetails();
					$scope.TransactionsByDate = [];
				}
				$scope.date = $agentService.GetDailyFigureDate(dayOfWeek, dfRow.StartingDateString, true);
				$scope.SelectedCustomer = dfRow;
				await $agentService.GetCustomerTransactionListByDate(dfRow.CustomerId, $scope.date, includeCasino)

				$scope.TransactionsByDate = allWeek ? [...$scope.TransactionsByDate, ...$agentService.TransactionList] : $agentService.TransactionList;
				let result = await $agentService.GetCashTransactionsByDate(dfRow.CustomerId, $scope.date);
				if (!result) return;
				var cashTransactions = result.data.d.Data;
				if (cashTransactions != null && cashTransactions.length > 0) {
					$scope.TransactionsByDate.push.apply($scope.TransactionsByDate, cashTransactions[i]);
					for (var i = cashTransactions.length - 1; i >= 0; i--) {
						var inserted = false;
						for (var j = 0; j < $scope.TransactionsByDate.length; j++) {
							if (CommonFunctions.FormatDateTime($scope.TransactionsByDate[j].TranDateTimeString, 10) <
								CommonFunctions.FormatDateTime(cashTransactions.TranDateTimeString, 10)) {
								$scope.TransactionsByDate.splice(1, 0, cashTransactions[i]);
								inserted = true;
								break;
							}
						}
						if (!inserted) {
							$scope.TransactionsByDate.push(cashTransactions[i]);
						}
					}
				}

				let result2 = await $agentService.GetNonPostedCasinoPlaysArchive(dfRow.CustomerId, $scope.date)
				$scope.PostedCasinoPlays = {};
				$scope.PostedCasinoPlays.data = result2;
				$scope.PostedCasinoPlays.totals = { RiskAmount: 0, WinAmount: 0, WinLoss: 0 };
				$scope.PostedCasinoPlays.data.forEach(x => {
					$scope.PostedCasinoPlays.totals.RiskAmount += x.RiskAmount;
					$scope.PostedCasinoPlays.totals.WinAmount += x.WinAmount;
					$scope.PostedCasinoPlays.totals.WinLoss += x.WinLoss;
				})
			};



			$scope.TransactionsByDate = [];
			OpenDailyFiguresDetails();
			$scope.allWeek = true;
			for (let i = 1; i <= 7; i++) {
				await showMoreDetailsAsync(dfRow, i == 7 ? 0 : i, includeCasino, true);
			}
		};

		$scope.ShowWeekDetails = showWeekDetails;

		$scope.ShowMoreDetails = function (dfRow, dayOfWeek, includeCasino, allWeek = false) {
			if (!allWeek) {
				$scope.allWeek = false;
				OpenDailyFiguresDetails();
				$scope.TransactionsByDate = [];
			}
			$scope.date = $agentService.GetDailyFigureDate(dayOfWeek, dfRow.StartingDateString, true);
			$scope.SelectedCustomer = dfRow;
			$agentService.GetCustomerTransactionListByDate(dfRow.CustomerId, $scope.date, includeCasino).then(function () {
				$scope.TransactionsByDate = allWeek ? [...$scope.TransactionsByDate, ...$agentService.TransactionList] : $agentService.TransactionList;
				$agentService.GetCashTransactionsByDate(dfRow.CustomerId, $scope.date).then(function (result) {
					if (!result) return;
					var cashTransactions = result.data.d.Data;
					if (cashTransactions != null && cashTransactions.length > 0) {
						$scope.TransactionsByDate.push.apply($scope.TransactionsByDate, cashTransactions[i]);
						for (var i = cashTransactions.length - 1; i >= 0; i--) {
							var inserted = false;
							for (var j = 0; j < $scope.TransactionsByDate.length; j++) {
								if (CommonFunctions.FormatDateTime($scope.TransactionsByDate[j].TranDateTimeString, 10) <
									CommonFunctions.FormatDateTime(cashTransactions.TranDateTimeString, 10)) {
									$scope.TransactionsByDate.splice(1, 0, cashTransactions[i]);
									inserted = true;
									break;
								}
							}
							if (!inserted) {
								$scope.TransactionsByDate.push(cashTransactions[i]);
							}
						}
					}
				});

				$agentService.GetNonPostedCasinoPlaysArchive(dfRow.CustomerId, $scope.date).then(function (result) {
					$scope.PostedCasinoPlays = {};
					$scope.PostedCasinoPlays.data = result;
					$scope.PostedCasinoPlays.totals = { RiskAmount: 0, WinAmount: 0, WinLoss: 0 };
					$scope.PostedCasinoPlays.data.forEach(x => {
						$scope.PostedCasinoPlays.totals.RiskAmount += x.RiskAmount;
						$scope.PostedCasinoPlays.totals.WinAmount += x.WinAmount;
						$scope.PostedCasinoPlays.totals.WinLoss += x.WinLoss;
					})
				});
			});
		};

		$scope.ScoredPtsHeader = function (openBetItem) {
			var resultsTitle = "";
			if (!openBetItem) return "";

			if (openBetItem.SportType != null && openBetItem.SportType == "Soccer") {
				resultsTitle += "GOALS "; //"Goals ";
			} else {
				resultsTitle += "POINTS "; //"Points ";
			}

			var periodDescripion = "";
			if (openBetItem.PeriodDescription != null)
				periodDescripion = openBetItem.PeriodDescription;

			if (openBetItem.PeriodDescription != null) {
				resultsTitle += "Scored in " + periodDescripion; //" period:";
			}

			return resultsTitle;
		};

		$scope.WriteTeamsScores = function (openBetItem) {

			if (isNaN(openBetItem.Team1Score) || isNaN(openBetItem.Team2Score)) return "Pending";

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
				teamsResults += " " + "TOTAL POINTS: " + (team1Score + team2Score);
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
				winner += winnerId + " Won Period By " + Math.abs(team1Score - team2Score);
			}
			return winner;
		};

		$scope.GetWagerItemDescription = function (fullWagerDescription, wagerItemIndex) {
			if (!fullWagerDescription) return '';
			var descArray = fullWagerDescription.split('\r\n');
			if (descArray.length > 0 && descArray[wagerItemIndex])
				return descArray[wagerItemIndex].replace("Credit Adjustment", '').replace("Debit Adjustment", '');
			else return fullWagerDescription.replace("Credit Adjustment", '').replace("Debit Adjustment", '');
		};

		$scope.TotalPlayers = function () {
			var totalPlayers = 0;
			if ($scope.CustomersDailyFigures)
				$scope.CustomersDailyFigures.forEach(function (e) {
					e.CustomerDailyFigures.forEach(function (c) {
						if (c.PlaysCount > 0) {
							totalPlayers += 1;
						}
					});
				});
			return totalPlayers;
		};

		$scope.ShowCustMaint = function (customerID, tab) {
			if ($scope.AgentAsCustomerInfo.IsAffiliate) return;
			let params = { customerId: customerID, weekNumber: 0 }
			$agentService.GetCustomerInfo(params).then(function (result) {
				$scope.ShowCustomerDialog(result[0], tab, customerID)
			})
		}

		$scope.ShowPendingBets = async function (customerID) {
			$scope.openBetsSource = [];
			jQuery('#opebBetsModal').modal('show');
			let endDate = new Date();
			let startDate = new Date();
			startDate.setDate(startDate.getDate() - 730);
			let params = { customerId: customerID, mode: 2, startDate: startDate, endDate: endDate };
			$scope.openBetsSource = (await $agentService.GetOpenBetsByCustomerId(params));
		}

		$scope.showNewWeeklyFigure = function () {
			if (!$agentService.Restrictions) return false;
			return $agentService.Restrictions.some(q => q.Code == 'EERWYIWUFN');
		}

		$scope.onToggleClicked = function (name) {
			if ($scope.expandedRows.findIndex(x => x == name) == -1) {
				$scope.expandedRows.push(name);
			}
			else {
				$scope.expandedRows.splice($scope.expandedRows.findIndex(x => x == name), 1);
			}
			$scope.addSessionData('expandedRows', $scope.expandedRows);
		}
		$scope.ExpandAgents = function () {
			if ($scope.expandedRows.length > 0) {
				$scope.expandedRows = [];
			}
			else {
				$scope.CustomersDailyFigures.forEach(function (e) {
					$scope.expandedRows.push(e.AgentId);
				})
			}
			$scope.addSessionData('expandedRows', $scope.expandedRows);
		}

		/*$scope.$watch('quickSearch', function (newVal, oldVal) {
		  if (!newVal || newVal == oldVal) {
			if (!newVal)  $scope.GetCustomersDailyFigures(false);
			return;
		  }
		  currentPage = 0;
		  const activeOnly = $scope.ReportFilters.CustomersToShow ? $scope.ReportFilters.CustomersToShow.Code : '2';
		  $agentService.GetCustomersDailyFigures($scope.WeekNumber.Index, newVal, 100, currentPage++ * 100, activeOnly, $scope.orderMode.value).then(function (result) {
			rawData = result.data.d.Data;
			prepareData(rawData, false);
		  });
		});*/

		$rootScope.$on('gridModeToggled', function () { setTimeout(function () { syncscroll.reset(); }, 100000) })

		$rootScope.safeApply();

		$scope.Init();
	}
]);
