appModule.controller("deletedWagersController", [
	'$scope', '$agentService', '$routeParams', '$rootScope', '$sce', function ($scope, $agentService, $routeParams, $rootScope, $sce) {
		if ($scope.GetAgentRestriction('HIDEDLWGRS')) {
			document.location.href = '/#dashboard';
			return;
		}
		let vm = this;
		$scope.totalDisplayed = 15;
		$scope.LoadMoreIsVisible = 1;
		$scope.WeekNumber = {};
		let tableData;
		let paramCustomer = null;


		$scope.hierarchy = $scope.getSessionData('hierarchyMode') ? $scope.getSessionData('hierarchyMode') : { mode: '0' };

		$scope.saveSelections = function () {
			$scope.addSessionData('hierarchyMode', $scope.hierarchy);
		};

		$scope.getDetailsHTML = function (oB, parentIndex, index) {
			let bind = '';
			oB.Items.forEach(function (oBi, idx) {
				bind += '';
				bind +=
					`<div class="graded-data-detail"><a class="icon_viewresults" onclick="changeIcon(this); return false;" role = "button" data-toggle="collapse" data-target = "#openbet_${oB.TicketNumber}_${oB.WagerNumber}_${idx}" aria-expanded="false"></a>
						<strong class="${oBi.OutCome == 'L' ? 'num_neg' : oBi.OutCome == 'W' ? 'num_pos' : ''}"> ${oBi.OutCome && oBi.OutCome != 'P' ? oBi.OutCome : ''}</strong>&nbsp
						<span>${!(oB.WagerType == 'A' || oB.WagerType == 'M' || oB.TicketWriter == 'GSLIVE' || oB.WagerType == 'G' || oB.TicketWriter.trim() == 'Colchian-Internet' || oB.TicketWriter.trim() == 'EZLIVEBET - INTERNET' || oB.TicketWriter.trim() == 'Props-Builder') ? oBi.TranslatedDesc : GetWagerItemDescription(oBi.Description, idx)} ${oBi.FreePlayFlag == 'Y' ? '(FP)' : ''}</span>
						<div class="collapse" id="openbet_${oB.TicketNumber}_${oB.WagerNumber}_${idx}">
              <b ng-bind="">${$scope.Translate('Game Notes')}</b>
              ${oBi.Team1ID != null && oBi.Team1ID != '' ? `<span>${oBi.Team1ID} vs ${oBi.Team2ID}<br /></span>` : ''}
              ${oBi.Comments ? `<span ng-show="oBi.Comments">${oBi.Comments}<br /></span>` : ''}`;
								bind += oB.EventDateTimeString && !(oBi.OutCome == 'W' || oBi.OutCome == 'L') ?
							`<span>Event date:${$scope.FormatDateTime(oB.EventDateTimeString, 12)}</span>` : ''
								bind += oBi.OutCome == 'W' || oBi.OutCome == 'L' ? `<section id="resultsf_${parentIndex}_${index}_${idx}" >
              <b ng-bind="">${$scope.Translate('Game Results')}:</b>
              <span>${$scope.ScoredPtsHeader(oBi)}</span>
              <br />
              <span>${$scope.WriteTeamsScores(oBi)}</span>
              <br />
              <span>${$scope.WriteWinner(oBi)}</span>
              </section></div></div>` : `</div></div>`;
			})
			return $sce.trustAsHtml(bind);
		}

		$scope.showComments = function (comments) {
			Swal.fire(
				'Comments',
				comments,
				'info'
			);
		}

		var hashData = /customerID=([^&]+)/.exec(window.location.hash);
		if (hashData) $scope.CustomerHash = hashData[1];
		$scope.CustomersList = [];
		$scope.ReportFilters = {
			CustomerId: {},
			WagerType: "",
			ContinueOnPush: false,
			CheckForAR: false,
			SportType: "",
			DateRange: '7'
		};

		async function Init() {
			$scope.Props = { status: 1 };
			if ($routeParams.CustomerId != null) {
				paramCustomer = $routeParams.CustomerId;
			}
			$scope.WeeksRange = [{ DateRange: $scope.Translate('Last 7 days'), Index: 7 }, { DateRange: $scope.Translate('Last 14 days'), Index: 14 }, { DateRange: $scope.Translate('Last 30 days'), Index: 30 }, { DateRange: $scope.Translate('All'), Index: -1 }];
			$scope.WeekNumber = $scope.WeeksRange[0];
			$scope.CustomersListWithOpens = [{ CustomerId: 'All', bindName: $scope.Translate('All') }];
			$scope.ReportFilters.AgentToShow = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
			await $scope.GetSportTypesList();
			currentCustomer = $scope.CustomersListWithOpens.find(x => x.CustomerId.trim() == paramCustomer);
			$scope.currentCustomer = currentCustomer ? currentCustomer : $scope.CustomersListWithOpens[0];
		}

		async function getData() {
			$scope.AgentsCustomers = [];
			$scope.ReportFilters.DateRange = $scope.Props.status == '2' ? -1 : $scope.ReportFilters.DateRange;
			let params = { agentId: $scope.ReportFilters.AgentToShow ? $scope.ReportFilters.AgentToShow.AgentId : $scope.AgentAsCustomerInfo.CustomerID, props: $scope.Props.status, numDays: $scope.WeekNumber.Index };
			let res = (await $agentService.GetDeletedWagers(params)).data.d.Data;
			if (!res || res.length == 0) {
				$scope.OpenBets = [];
				return;
			}
			let groupedData = $scope.GetGroupedCustomerBets(res);
			tableData = $scope.OpenBets = groupedData;
			groupedData = groupBy($scope.OpenBets, 'AgentID');
			let agentsCustomers = Object.keys(groupedData).map((key) => groupedData[key]);
			agentsCustomers.forEach(function (openBets, i) {
				let groupedData = groupBy(openBets, 'CustomerID');
				openBets = Object.keys(groupedData).map((key) => groupedData[key]);
				openBets.forEach(function (gB) {
					gB.TotalAmountWagered = 0;
					gB.TotalToWinAmount = 0;
					gB.forEach(function (oB) {
						gB.AgentHier = $scope.rawAgentsList ? $scope.getAgentParent(oB.AgentID) + ' / ' + $scope.formatCustomer(oB.AgentID) : '';
						gB.TotalAmountWagered += oB.AmountWagered;
						gB.TotalToWinAmount += oB.ToWinAmount;
					})
					agentsCustomers[i] = openBets;
				});
			});
			$scope.AgentsCustomers = agentsCustomers.sort((a, b) => (a[0].AgentHier > b[0].AgentHier) ? 1 : ((b[0].AgentHier > a[0].AgentHier) ? -1 : 0));
			$rootScope.safeApply();
		}

		$scope.getData = getData;


		function refreshData() {
			getData();
		}

		$scope.refreshData = refreshData;


		$scope.PrintReport = function () {

			if ($scope.GroupedCustomerBets) $scope.totalDisplayed = $scope.GroupedCustomerBets.length;
			$scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
				window.print();
			});
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

		$scope.OpenBetsFilter = function (oB) {
			if (Array.isArray(oB)) oB = oB[0];
			let sportMatch = $scope.ReportFilters.SportType.SportType == 'All' || (oB.SportType && ($scope.ReportFilters.SportType.SportType == oB.SportType.trim()));
			let wagerMatch = ($scope.ReportFilters.WagerType == '' || $scope.ReportFilters.WagerType.indexOf(oB.WagerType.trim()) >= 0);
			return sportMatch && wagerMatch;
		};

		$scope.CustomerFilter = function (gB) {
			let cc = gB.some(x => $scope.OpenBetsFilter(x));
			if ($scope.currentCustomer.CustomerId == 'All' && cc) return true;
			return gB[0].CustomerID.trim() == $scope.currentCustomer.CustomerId && cc;
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

		$scope.ParlayText = function (totalPicks, totalItems) {
			var pendingBets = totalPicks - totalItems;
			return pendingBets > 0 ? ' (' + totalPicks + ' ' + 'Teams, ' + pendingBets + ' Open)' : ' (' + totalPicks + ' ' + 'Teams)';
		};

		async function GetSportTypesList() {
			let result = (await $agentService.GetSportTypesList());
			$scope.SportsList = GetDistinctSports(result.data.d.Data);
			$scope.ReportFilters.SportType = $scope.SportsList[0];
			await $scope.getData();
		}

		$scope.GetSportTypesList = GetSportTypesList;

		function GetDistinctSports(list) {
			var unique = {};
			var distinctSports = [];
			distinctSports.push({ SportType: "All", SportName: $scope.Translate("All sports") });
			for (var i in list) {
				if (typeof (unique[list[i].SportType]) == "undefined") {
					var sportType = { SportType: list[i].SportType.trim(), SportName: $scope.Translate(list[i].SportType.trim()) };
					distinctSports.push(sportType);
				}
				unique[list[i].SportType] = "";
			}
			return distinctSports;
		};

		$scope.GetGroupedCustomerBets = function (list) {
			var groupedCustomerBets = [];
			var holdCustomer = list[0].CustomerID;
			var groupedList = new Array();
			list.forEach(function (i, index) {
				i.TranslatedDesc = i.WagerType != 'C' ? FormatShortDescription(i) : FormatShortContestDescription(i);
				i.Outcome = (i.OutCome == "W" ? 'WON' : i.OutCome == "L" ? 'LOST' : i.OutCome == "X" ? 'PUSH' : '');
				i.Result = (i.OutCome == "W" || i.TranType == "W" ? 'WON' : i.OutCome == "L" || i.TranType == "L" ? 'LOST' : i.OutCome == "X" ? 'PUSH' : '');
				if (holdCustomer != i.CustomerID) {
					$scope.CustomersList.push({ CustomerID: holdCustomer, CustomerName: holdCustomer });
					groupedCustomerBets = [...groupedCustomerBets, ...grouperObjs(groupedList)];
					groupedList = new Array();
					groupedList.push(i);
				} else {
					groupedList.push(i);
				}
				holdCustomer = i.CustomerID;
				if (index == list.length - 1) {
					groupedCustomerBets = [...groupedCustomerBets, ...grouperObjs(groupedList)];
				}
			});
			return groupedCustomerBets;
		};

		$scope.ResetSportType = function () {
			if (jQuery('#scrollBox').hasScrollBar()) $scope.totalDisplayed = 15;
			if ($scope.ReportFilters.WagerType == 'C') $scope.ReportFilters.SportType = $scope.SportsList[0];
		};

		var grouperObjs = function (allOpenBets) {

			var groupedOpenBets = new Array();
			if (allOpenBets != null && allOpenBets.length > 0) {
				var items = new Array();
				holdTicketNumber = allOpenBets[0].TicketNumber;
				holdWagerNumber = allOpenBets[0].WagerNumber;
				for (var i = 0; i < allOpenBets.length; i++) {
					if (holdTicketNumber != allOpenBets[i].TicketNumber || holdWagerNumber != allOpenBets[i].WagerNumber) {
						groupedOpenBets.push(allOpenBets[i - 1]);
						if (allOpenBets[i - 1].WagerType == 'A') {
							groupedOpenBets[groupedOpenBets.length - 1].Items = CreateManualItems(allOpenBets[i - 1].Description);
						}
						else {
							groupedOpenBets[groupedOpenBets.length - 1].Items = CreateWagerItems(items);
						}
						items = [];
					}
					items.push(allOpenBets[i]);
					holdTicketNumber = allOpenBets[i].TicketNumber;
					holdWagerNumber = allOpenBets[i].WagerNumber;

					if (i == allOpenBets.length - 1) {
						allOpenBets[i].Items = CreateWagerItems(items);
						groupedOpenBets.push(allOpenBets[i]);
					}
				}
			}
			return groupedOpenBets;
		};

		function GetWagerItemDescription(fullWagerDescription, wagerItemIndex) {
			if (!fullWagerDescription) return;
			var descArray = fullWagerDescription.split('\r\n');
			if (descArray.length > 0 && descArray[wagerItemIndex])
				return descArray[wagerItemIndex].replace("Credit Adjustment", '').replace("Debit Adjustment", '');
			else return fullWagerDescription.replace("Credit Adjustment", '').replace("Debit Adjustment", '');
		};

		$scope.GetSportType = function () {
			if ($scope.ReportFilters.SportType.SportType == null) {
				return "";
			} else if ($scope.ReportFilters.SportType.SportType == "All") {
				return "";
			}
			else
				return $scope.ReportFilters.SportType.SportType;
		};

		$scope.CheckForWagerType = function () {
			var wagerType = "";
			if ($scope.ReportFilters.WagerType != null) {
				switch ($scope.ReportFilters.WagerType) {
					case "S":
					case "P":
					case "T":
					case "C":
					case "I":
						wagerType = $scope.ReportFilters.WagerType;
						$scope.ReportFilters.CheckForAR = false;
						$scope.ReportFilters.ContinueOnPush = false;
						break;
					case "R":
						wagerType = "I";
						$scope.ReportFilters.CheckForAR = true;
						$scope.ReportFilters.ContinueOnPush = false;
						break;
					case "IWP":
						wagerType = "I";
						$scope.ReportFilters.ContinueOnPush = true;
						$scope.ReportFilters.CheckForAR = false;
						break;
				}
			}
			return wagerType;
		};

		$scope.FormatTicketNumberDisplay = function (wi) {
			return wi.TicketNumber + "-" + wi.WagerNumber;
		};

		$scope.ShowingOpenBetsFor = function (customerId) {
			return $scope.Translate("Pending Bets for ") + customerId;
		};

		$scope.Filters = $scope.Filters || {};

		$scope.Filters.Tickets = function (ObjectList) {
			return function (oB) {
				if (($scope.ReportFilters.WagerType == "" || ($scope.ReportFilters.WagerType == 'R' && oB.ARLink == 1 || (oB.ARLink == 0 && $scope.ReportFilters.WagerType.indexOf(oB.WagerType.trim()) >= 0)))
					&& ($scope.ReportFilters.SportType.SportType == "All" || oB.Description.indexOf($scope.ReportFilters.SportType.SportType) >= 0
						|| (oB.SportType != null ? oB.SportType.trim() == $scope.ReportFilters.SportType.SportType : false))) return true;
				else return false;
			};
		};

		$scope.DisplayWagerTypeName = function (wager) {
			return $agentService.DisplayWagerTypeName(wager);
		};

		$scope.LoadMore = function () {
			$scope.totalDisplayed += 5;
			if ($scope.totalDisplayed >= $scope.OpenBets.length) $scope.LoadMoreIsVisible = false;
			$rootScope.safeApply();

		};

		$scope.GetWagerStatus = function (openBet) {
			var wagerStatus = "";

			if (openBet.WagerStatus === "O") {
				wagerStatus = " (" + $scope.Translate("OPEN_BET_LABEL") + ")";
			}
			return wagerStatus;
		};

		$scope.DeleteWager = function (wager) {

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
					$agentService.DeleteWager({ customerId: wager.CustomerID, ticketNumber: wager.TicketNumber, wagerNumber: wager.WagerNumber, wagerType: wager.WagerType, outcome: wager.OutCome }).then(function (response) {
						if (response.data.d.Code == 0) {
							Swal.fire(
								$scope.Translate('Deleted!'),
								$scope.Translate('The wager has been deleted.'),
								'success'
							);
							getData();
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

		angular.element('#scrollBox').bind("scroll", function () {
			var dash = document.getElementsByClassName('dashbwrapper')[0];
			var windowHeight = "offsetHeight" in document.getElementsByClassName('dashbwrapper')[0] ? document.getElementsByClassName('dashbwrapper')[0].offsetHeight : document.documentElement.offsetHeight;
			var body = document.getElementById('scrollBox'), html = dash;
			var docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
			windowBottom = windowHeight + body.scrollTop;

			if (windowBottom >= docHeight) {
				$scope.totalDisplayed += 5;
				$rootScope.safeApply();
				if ($scope.totalDisplayed >= $scope.OpenBets.length) $scope.LoadMoreIsVisible = false;
			}
		});


		function CreateManualItems(fullDescription) {
			var arr = fullDescription.split("|");
			var items = [];
			for (var i = 0; i < arr.length; i++) {
				items.push({ Description: arr[i] });
			}
			return items;
		}

		function CreateWagerItems(wagerItems) {
			fullDescription = wagerItems[0].Description;
			var arr = fullDescription.split('\r\n');
			var items = [];
			for (var i = 0; i < arr.length; i++) {
				if (i < wagerItems.length)
					items.push({
						Description: arr[i],
						Team1ID: wagerItems[i].Team1ID,
						Team2ID: wagerItems[i].Team2ID,
						Comments: wagerItems[i].Comments,
						OutCome: wagerItems[i].OutCome,
						FreePlayFlag: wagerItems[i].FreePlayFlag,
						WagerStatus: wagerItems[i].WagerStatus,
						Team1Score: wagerItems[i].Team1Score,
						Team2Score: wagerItems[i].Team2Score,
						PeriodDescription: wagerItems[i].PeriodDescription,
						SportType: wagerItems[i].SportType,
						TranslatedDesc: wagerItems[i].TranslatedDesc
					});
			}
			return items;
		}


		function FormatShortContestDescription(cwi) {
			if (!cwi.ContestType) return cwi.Description;
			var descStr = $scope.Translate(cwi.ContestType.trim());

			if (cwi.ContestType2 != null && cwi.ContestType2.trim() != ".") {
				descStr += " - ";
				descStr += cwi.ContestType2.trim();
			}
			if (cwi.ContestType3 != null && cwi.ContestType3.trim() != ".") {
				descStr += " - ";
				descStr += cwi.ContestType3.trim();
			}
			descStr += " - ";

			if (cwi.ContestDesc != null)
				descStr += cwi.ContestDesc.trim();

			descStr += " - ";

			if (cwi.ContestantName != null)
				descStr += cwi.ContestantName.trim();

			descStr += " ";

			if (cwi.ThresholdType == "P") {
				descStr += FormatAhTotal(cwi.ThresholdLine)
					+ " " + cwi.ThresholdUnits.trim();
			}
			if (cwi.ThresholdType == "S") {
				descStr += FormatAhSpread(cwi.ThresholdLine)
					+ " " + cwi.ThresholdUnits.trim();
			}
			descStr += "  ";

			if (cwi.FinalToBase > 0) {
				descStr += cwi.FinalMoney;
				descStr += ` ${$scope.Translate('to')} `;
				descStr += cwi.FinalToBase;
			}
			else {
				if (cwi.FinalMoney > 0) {
					descStr += "+";
				}
				descStr += cwi.FinalMoney;
			}
			return descStr;
		}

		function FormatShortDescription(wi) {
			var descStr = "";
			wi.SportType = wi.SportType ? wi.SportType : '';
			descStr += $scope.Translate(wi.SportType.trim()) + " - ";
			let diffPoints;
			wi.Team1ID = wi.Team1ID ? wi.Team1ID : '';
			wi.Team2ID = wi.Team2ID ? wi.Team2ID : '';
			switch (wi.subWagerType) {
				case "S":
					if (wi.ChosenTeamID.trim() == wi.Team1ID.trim())
						descStr += wi.Team1RotNum + " " + wi.Team1ID.trim();
					else
						descStr += wi.Team2RotNum + " " + wi.Team2ID.trim();
					descStr += " ";

					if (wi.PeriodDescription.trim() == "Game" && wi.WagerType != "T") {
						if (wi.AdjSpread > 0) {
							diffPoints = wi.AdjSpread - Math.abs(wi.OrigSpread);
							descStr += FormatAhSpread(wi.AdjSpread, ",", true, diffPoints > 0 ? diffPoints : 0, diffPoints < 0 ? diffPoints * -1 : 0);
						} else {
							diffPoints = wi.OrigSpread - wi.AdjSpread;
							descStr += FormatAhSpread(wi.AdjSpread, ",", true, diffPoints < 0 ? diffPoints * -1 : 0, diffPoints > 0 ? diffPoints : 0);
						}
					}
					else
						descStr += FormatAhSpread(wi.AdjSpread + wi.TeaserPoints, ",", true);
					break;
				case "M":
					if (wi.ChosenTeamID.trim() == wi.Team1ID.trim())
						descStr += wi.Team1RotNum + " " + wi.Team1ID;
					else if (wi.ChosenTeamID.trim() == wi.Team2ID.trim())
						descStr += wi.Team2RotNum + " " + wi.Team2ID;
					else
						descStr += $scope.Translate("Draw") + " (" + wi.Team1ID.trim()
							+ " vs " + wi.Team2ID.trim() + ")";
					break;
				case "L":
					descStr += wi.Team1RotNum + " " + wi.Team1ID.trim()
						+ "/" + wi.Team2ID.trim() + " ";

					if (wi.TotalPointsOU == "O") {
						descStr += $scope.Translate("over");
						diffPoints = wi.OrigTotalPoints - wi.AdjTotalPoints;
					}
					else {
						descStr += $scope.Translate("under");
						diffPoints = wi.AdjTotalPoints - wi.OrigTotalPoints;
					}
					descStr += " ";
					if (wi.PeriodDescription.trim() == "Game" && wi.WagerType != "T")
						descStr += FormatAhTotal(wi.AdjTotalPoints, ", ", false, diffPoints > 0 ? diffPoints : 0, diffPoints < 0 ? diffPoints * -1 : 0);
					else
						descStr += FormatAhTotal(wi.AdjTotalPoints, ", ");
					break;
				case "E":
					let teams = wi.ChosenTeamID.split('/');
					if (teams[0] == wi.Team1ID.trim())
						descStr += wi.Team1RotNum + " " + wi.Team1ID.trim() + " ";
					else
						descStr += wi.Team2RotNum + " " + wi.Team2ID.trim() + " ";

					if (wi.TotalPointsOU == "O")
						descStr += ` ${$scope.Translate("team total over")} ${FormatAhTotal(wi.AdjTotalPoints, ", ")}`;
					else
						descStr += ` ${$scope.Translate("team total under")} ${FormatAhTotal(wi.AdjTotalPoints, ", ")}`;
					break;
			}
			if (wi.WagerType != "T") {
				descStr += " ";

				/*if (wi.WagerType == "M" && wi.SportType.trim() == "Baseball") {
					if (wi.EasternLine > 0)
						descStr += "+";
					//descStr += ConvertToHalfSymbol(wi.EasternLine);
				}
				else*/
				descStr += (wi.FinalMoney >= 0 ? "+" : "") + wi.FinalMoney;

			}

			if (wi.PeriodDescription != null) {
				if (wi.SportType != null && wi.SportSubType != null &&
					(wi.SportType.trim() == "Baseball" || wi.SportType.trim() == "Basketball") &&
					wi.SportSubType.trim() == "SeriesPrices") {
					descStr += " " + $scope.Translate("for Series");
				}
				else
					descStr += " " + $scope.Translate("for") + " " + $scope.Translate(wi.PeriodDescription.trim());
			}
			if (wi.HalfPointAdded) descStr += " *** " + $scope.Translate("Free Half Point Added") + " ***";

			if (!wi.SportType.trim() == "Baseball") return descStr;
			var pitcher1Required = wi.Pitcher1ReqFlag;
			var pitcher2Required = wi.Pitcher2ReqFlag;

			if (wi.SportSubType != null && wi.SportSubType.trim() == "SeriesPrices") {
				if (wi.AdjustableOddsFlag == "N" || (wi.ListedPitcher1 == '' && wi.ListedPitcher2 == '')) {
					descStr += ". ";// + $scope.Translate("Price is Fixed");
				}
				return descStr;
			}
			else if (wi.AdjustableOddsFlag == "N") descStr += ". ";// + $scope.Translate("Price Is Fixed") + " ";
			if (pitcher1Required == 'Y' || pitcher2Required == 'Y') {
				descStr += (wi.ListedPitcher1 != null ? " " + $scope.Translate("Pitchers") + " : " + wi.ListedPitcher1.trim() + "(" + (pitcher1Required == 'Y' ? $scope.Translate("must start") : $scope.Translate("action")) + ")" : "");

				if (pitcher2Required == 'Y') {
					descStr += (wi.ListedPitcher1 != null ? (wi.ListedPitcher1.trim().Length > 0 ? ", " : " ") + (wi.ListedPitcher2 ? wi.ListedPitcher2.trim() : '') + " " + $scope.Translate("(must start)") : "");
				}
				else descStr += (wi.ListedPitcher1 != null ? (wi.ListedPitcher1.trim().Length > 0 ? ", " : " ") + (wi.ListedPitcher2 ? wi.ListedPitcher2.trim() : '') + " " + $scope.Translate("(action)") : "");
			}
			return descStr;
		}

		function FormatAhSpread(spread, asianHandicap = ",", useWebHalfSymbol = false, pointsBought = 0, pointsSold = 0) {
			var str = "";
			const regExp = "/\s+/g";
			const HALFSYMBOL = "½";
			const PICK = "pk"

			if (spread == null) return "";
			var spreadVal = spread;

			if ((spreadVal * 2) == Math.floor(spreadVal * 2)) {
				if (spread == 0) str += PICK;
				else {
					if (spreadVal > 0) str += "+";
					str += ConvertToHalfSymbol(spreadVal);
				}
			}
			else {
				if (spreadVal < 0) {
					if (spreadVal + 0.25 == 0) str += PICK;
					else str += ConvertToHalfSymbol(spreadVal + 0.25);
					str += asianHandicap + " ";
					if (spreadVal - 0.25 == 0) str += PICK;
					else str += ConvertToHalfSymbol(spreadVal - 0.25);
				}
				else {
					if (spreadVal - 0.25 == 0) str += PICK;
					else {
						str += "+";
						str += ConvertToHalfSymbol(spreadVal - 0.25);
					}
					str += asianHandicap + " ";
					if (spreadVal + 0.25 == 0) str += PICK;
					else {
						str += "+";
						str += ConvertToHalfSymbol(spreadVal + 0.25);
					}
				}
			}

			var str2 = useWebHalfSymbol ? str.replace("/" + HALFSYMBOL + "/g", "&#189;") : str;

			if (pointsBought != 0) {
				pointsBought = parseFloat(pointsBought.toString().replace(regExp, ""));
				pointsBought = parseFloat(pointsBought.toString().replace("/0.5/g", HALFSYMBOL));
				pointsBought = parseFloat(pointsBought.toString().replace("/1.5/g", "1" + HALFSYMBOL));
				str2 += ` ${$scope.Translate("Buying")} ${ConvertToHalfSymbol(pointsBought)} ${$scope.Translate("Pt(s)")}  `;
			}
			else if (pointsSold != 0) {
				pointsSold = parseFloat(pointsSold.toString().replace(regExp, ""));
				pointsSold = parseFloat(pointsSold.toString().replace("/0.5/g", HALFSYMBOL));
				pointsSold = parseFloat(pointsSold.toString().replace("/1.5/g", "1" + HALFSYMBOL));
				str2 += ` ${$scope.Translate("Selling")} ${ConvertToHalfSymbol(pointsSold)} ${$scope.Translate("Pt(s)")}  `;
			}
			return str2;
		}

		function FormatAhTotal(total, ahSeparator = ",", useWebHalfSymbol = false, pointsbought = 0, pointsSold = 0, returnPositiveSign = false) {
			var str = "";
			const regExp = "/\s+/g";
			const HALFSYMBOL = "½";
			if (total == null) return "";
			var totalValue = total;

			if (total > 0 && returnPositiveSign) str += "+";

			if ((total * 2) == Math.floor(totalValue * 2)) str += ConvertToHalfSymbol(totalValue);
			else {
				str += ConvertToHalfSymbol(totalValue - 0.25);
				str += ahSeparator + " ";
				str += ConvertToHalfSymbol(totalValue + 0.25);
			}

			var str2 = "";
			if (returnPositiveSign && !str.Contains("+")) str2 += "+";

			if (useWebHalfSymbol) str2 += str.replace("/" + "½" + "/g", "&#189;");
			else str2 += str;

			if (pointsbought != 0) {
				var pointsboughtString = pointsbought.toString().replace(regExp, "");
				pointsboughtString = pointsboughtString.replace("0.5", HALFSYMBOL).replace("1.5", "1" + HALFSYMBOL);
				str2 += ` ${$scope.Translate("Buying")} ` + pointsboughtString + ` ${$scope.Translate("Pt(s)")}  `;
			}
			else if (pointsSold != 0) {
				pointsSold = parseFloat(pointsSold.toString().replace(regExp, ""));
				pointsSold = parseFloat(pointsSold.toString().replace("/0.5/g", HALFSYMBOL));
				pointsSold = parseFloat(pointsSold.toString().replace("/1.5/g", "1" + HALFSYMBOL));
				str2 += ` ${$scope.Translate("Selling")} ` + ConvertToHalfSymbol(pointsSold) + ` ${$scope.Translate("Pt(s)")}  `;
			}
			return str2;
		}

		function ConvertToHalfSymbol(num) {
			const HALFSYMBOL = "½";
			var x = num;
			var returnStr = "";

			if (Math.floor(x) != num) {
				var intPortion = 0;
				var halfPortion = "";

				if (x > 0) {
					intPortion = (Math.floor(x));
					halfPortion = HALFSYMBOL;
				}
				if (x < 0) {
					intPortion = (Math.floor(x)) + 1;
					halfPortion = "-" + HALFSYMBOL;
				}
				if (intPortion != 0) {
					returnStr += intPortion;
					returnStr += HALFSYMBOL;
				}
				else
					returnStr = halfPortion;
			}
			else
				returnStr = num.toString();
			return returnStr;
		}

		const groupBy = function (xs, key) {
			return xs.reduce(function (rv, x) {
				(rv[x[key]] = rv[x[key]] || []).push(x);
				return rv;
			}, {});
		};

		Init();
	}]);


changeIcon = function (el) {
	var st;
	if (el.className.indexOf('icon_viewresults_minus') != -1) {
		st = el.className.toString().replace("icon_viewresults_minus", "");
		el.className = "icon_viewresults " + st;
	}
	else {
		st = el.className.toString().replace("icon_viewresults", "");
		el.className = "icon_viewresults_minus " + st;
	}
};
