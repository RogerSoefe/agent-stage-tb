appModule.controller("customertransactionsController", [
    '$scope', '$agentService', '$rootScope', '$routeParams', function ($scope, $agentService, $rootScope, $routeParams) {

        $scope.ReportFilters = {
            WeekNumber: {},
            CustomerId: "",
            ShowCashTransOnly: false,
            IsRootAgent: false
        };

        $scope.Init = function () {
            $scope.WeeksRange = $agentService.GetWeeksRange();
            $scope.ReportFilters.WeekNumber = $scope.WeeksRange[0];
            $scope.ReportFilters.CustomerId = null;
            if ($routeParams.CustomerIdArg != null) {
                $scope.ReportFilters.CustomerId = $routeParams.CustomerIdArg;
            }
            if ($routeParams.IsAgent != null) {
                $scope.ReportFilters.IsRootAgent = $routeParams.IsAgent == 'true';
            }
            $scope.GetCustomerTransactions(0, null);
        };

        $scope.WriteTransactionDesc = function (tran) {
            var desc = "";
            if (tran.GradeNum == null) {
                desc = tran.ShortDesc;
            }
            else {
                switch (tran.WagerType) {
                    case "A":
						desc = $scope.Translate("Manual");
                        break;
                    case "C":
						desc = $scope.Translate("Contest");
                        break;
                    case "E":
						desc = $scope.Translate("Team Totals");
                        break;
                    case "G":
						desc = $scope.Translate("Horse Racing");
                        break;
                    case "I":
						desc = $scope.Translate("If-Bet");
                        break;
                    case "L":
						desc = $scope.Translate("Total Points");
                        break;
                    case "M":
						desc = $scope.Translate("Money Line");
                        break;
                    case "P":
						desc = $scope.Translate("Parlay");
                        break;
                    case "S":
						desc = $scope.Translate("Spread");
                        break;
                    case "T":
						desc = $scope.Translate("Teaser") + ' ' + tran.TeaserName;
                        break;
                }
            }
            return desc;
        };

        $scope.ShowWonLost = function (tran) {
            if (tran.TranType == "L")
				return $scope.Translate("LOST");
            if (tran.TranType == "W")
				return $scope.Translate("WON");
            return "";
        };

        $scope.ShowGradeResults = function (tran) {
            var keepGoing = true;
            for (var i = 0; i < $scope.CustomerTransactions.length; i++) {
                if ($scope.CustomerTransactions[i].DocumentNumber == tran.DocumentNumber &&
                    $scope.CustomerTransactions[i].WagerItems) {
                    keepGoing = false;
                    break;
                }
            }
            if (!keepGoing)
                return;

            $agentService.GetCustomerTransactionByGradeNumber(tran.GradeNum).then(function (result) {
                var items = result.data.d.Data;
                for (var j = 0; j < $scope.CustomerTransactions.length; j++) {
                    if ($scope.CustomerTransactions[j].DocumentNumber == tran.DocumentNumber) {
                        $scope.CustomerTransactions[j].WagerItems = items;
                        break;
                    }
                }
            });
        };

        $scope.DisplayShowingLabel = function () {
            if ($scope.selected == null || $scope.selected == "") {
                return "";
            }
            switch ($scope.selected) {
                case "ShowLast30Days":
					return $scope.Translate("Showing Last 30 Days");
                case "ShowLast60Days":
					return $scope.Translate("Showing Last 60 Days");
                case "ShowLast90Days":
					return $scope.Translate("Showing Last 90 Days");
                case "ShowAllTransactions":
					return $scope.Translate("Showing All Transactions");
            }
            return "";
        };

        $scope.GetCustomerTransactions = function (idx, $event) {
            $scope.selected = "";
            var numWeek = $scope.ReportFilters.WeekNumber.Index;
            if (idx != null) {
                numWeek = idx;
                if ($event != null) {
                    var checkbox = $event.target;
                    $scope.selected = String(checkbox.id).replace("chb", "");
                }
            }
            if (/*$scope.ReportFilters.CustomerId != null && $scope.ReportFilters.CustomerId != "" &&*/ ($event == null || $event.target.checked == true)) {
                var cust = "";
                if ($scope.ReportFilters.CustomerId != null && $scope.ReportFilters.CustomerId != "")
                    cust = $scope.ReportFilters.CustomerId;
                $agentService.GetCustomerTransactions(cust, numWeek).then(function (result) {
                    $scope.CustomerTransactions = result.data.d.Data;
                    for (var i = 0; i < $scope.CustomerTransactions.length; i++) {
                        $scope.CustomerTransactions[i].WagerItems = null;
                    }
                    if ($scope.CustomerTransactions.length > 0 && $scope.ReportFilters.CustomerId == null || $scope.ReportFilters.CustomerId == "") {
                        $scope.ReportFilters.CustomerId = $scope.CustomerTransactions[0].CustomerId;
                    }
                });
            }
        };

        $scope.GetWagerInformation = function () {
            if (!$scope.CustomerTransactions || $scope.CustomerTransactions.length == 0) {
                return;
            }
        };

        $scope.IsSelected = function (strId) {
            return $scope.selected.indexOf(strId) >= 0;
        };

        $scope.ShowCashTransOnly = function (cT) {
            if ($scope.ReportFilters.ShowCashTransOnly == false || (cT.TranType != "A" && cT.TranType != "R" && cT.TranType != "M" && cT.TranType != "W" && cT.TranType != "L" && cT.DailyFigureDate == null)) {
                return true;
            }
            return false;
        };

        $scope.Translate = function (str) {
            return str;
        };

        $scope.ScoredPtsHeader = function (gradedBetItem) {
            var resultsTitle = "";
            if (!gradedBetItem) return "";

            if (gradedBetItem.SportType != null && gradedBetItem.SportType == "Soccer") {
                resultsTitle += $scope.Translate("goals") + " "; //"Goals ";
            } else {
                resultsTitle += $scope.Translate("points") + " "; //"Points ";
            }

            var periodDescripion = "";
            if (gradedBetItem.PeriodDescription != null)
                periodDescripion = gradedBetItem.PeriodDescription;

            if (gradedBetItem.PeriodDescription != null) {
                resultsTitle += $scope.Translate("scored in") + " " + $scope.Translate(periodDescripion); //" period:";
            }

            return resultsTitle;
        };

        $scope.WriteTeamsScores = function (gradedBetItem) {
            if (!gradedBetItem) return "";

            if (isNaN(gradedBetItem.Team1Score) || isNaN(gradedBetItem.Team2Score)) return $scope.Translate("Pending");

            var teamsResults = "";
            var team1Id = "";
            var team2Id = "";
            var team1Score = "";
            var team2Score = "";
            if (gradedBetItem.Team1ID != null)
                team1Id = gradedBetItem.Team1ID;
            if (gradedBetItem.Team2ID != null)
                team2Id = gradedBetItem.Team2ID;
            if (gradedBetItem.Team1Score != null)
                team1Score = gradedBetItem.Team1Score;
            if (gradedBetItem.Team2Score != null)
                team2Score = gradedBetItem.Team2Score;
            teamsResults += team1Id + " - " + team1Score + " / " + team2Id + " - " + team2Score;
            if (gradedBetItem.WagerType == "E" || gradedBetItem.WagerType == "L" || gradedBetItem.WagerType == "T") {
                teamsResults += " " + $scope.Translate("Total Points") + ": " + (team1Score + team2Score);
            }
            return teamsResults;
        };

        $scope.WriteWinner = function (gradedBetItem) {
            if (!gradedBetItem) return "";
            var team1Score = "";
            var team2Score = "";
            var winner = "";
            if (gradedBetItem.Team1Score != null)
                team1Score = gradedBetItem.Team1Score;
            if (gradedBetItem.Team2Score != null)
                team2Score = gradedBetItem.Team2Score;
            if (team1Score != team2Score) {
                var winnerId = "";
                if (gradedBetItem.WinnerID != null)
                    winnerId = gradedBetItem.WinnerID;
                winner += winnerId + " " + $scope.Translate("won period by") + " " + Math.abs(team1Score - team2Score);
            }
            return winner;
        };
        /*
        function changeIcon (el) {
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
        */
        $scope.Init();
    }
]);