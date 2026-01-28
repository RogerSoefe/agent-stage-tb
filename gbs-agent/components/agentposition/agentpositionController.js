appModule.controller("agentpositionController", [
  '$rootScope', '$scope', '$agentService', function ($rootScope, $scope, $agentService) {
    $scope.AllActiveSubSports = [];
    $scope.SelectedDateFilterOption = 'Today';
    $scope.showProfit = false;
    $scope.nothingToShow = false;

    // Use agentService for view state management - initialize with values not references
    $scope.compactHeader = $agentService.getCompactHeader();
    $scope.viewSettings = $agentService.getViewSettings();

    // Watch for changes and update service
    $scope.$watch('compactHeader', function (newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('🔴 agentpositionController: compactHeader cambió de', oldVal, 'a', newVal);
        $agentService.setCompactHeader(newVal);
      }
    });

    $scope.ReportFilters = {
      WeekNumber: {},
      ShowActiveOnly: true,
      IncludeGradedWagers: false,
      AllPeriods: false
    };

    $scope.SelectedSport = {
      SportType: "",
      SportSubType: "",
      PeriodNumber: 0,
      WeekNumber: 0,
      AvailablePeriods: {},
      PositionByGame: {}
    };
    $scope.ActiveSports = {};
    $scope.SelectedSports = [];
    $scope.loadindingInfo = true;
    $scope.SelectedWagerType = "A"; //"A" = All, S = Straights & IfBets, PT = Parlay / Teasers, P = Parlays, T = Teasers


    $scope.Init = function () {

      // Asegurar modo compact activo al entrar a la vista /agentposition
      if (!$agentService.getCompactHeader() && !SETTINGS.LegacySite) {
        $agentService.setCompactHeader(true);
      }
      $scope.compactHeader = $agentService.getCompactHeader();



      if ($scope.AgentAsCustomerInfo) {
        $scope.WeeksRange = $agentService.GetWeeksRange();
        $scope.ReportFilters.WeekNumber = $scope.WeeksRange[0];
        $scope.GetActivePeriodsAndSports();
        if ($scope.AgentAsCustomerInfo.CustomerID == "GOLDEN88") {
          $scope.SelectedWagerType = "S";
        }
      }
      else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.ReportFilters.WeekNumber = $scope.WeeksRange[0];
          $scope.GetActivePeriodsAndSports();
          if ($scope.AgentAsCustomerInfo && $scope.AgentAsCustomerInfo.CustomerID == "GOLDEN88") {
            $scope.SelectedWagerType = "S";
          }
        });
      }
    };
    let wrapper = document.getElementById('aPWrapper');
    let currentScrollPosition = 0;

    $scope.getPeriodDescription = function (availablePeriods, periodNumber) {
      return (availablePeriods.find(x => x.PeriodNumber == periodNumber)).PeriodDescription;
    }

    $scope.GetActivePeriodsAndSports = function () {
      $scope.AllActiveSubSports = [];
      currentScrollPosition = wrapper.scrollTop;
      const dateMode = $scope.SelectedDateFilterOption === 'All' ? 0 : ($scope.SelectedDateFilterOption === "Today" ? 1 : ($scope.SelectedDateFilterOption === "Tomorrow" ? 2 : 3));
      $agentService.GetActivePeriodsAndSports($scope.ReportFilters.WeekNumber.Index, 0, dateMode).then(async function (result) {
        if (result.data.d.Data == null || result.data.d.Data.length == 0) {
          $scope.nothingToShow = true;
          return;
        }
        $scope.nothingToShow = false;
        let rawData = result.data.d.Data;
        let reorderNFL = rawData.filter(x => x.SportSubType == 'NFL');
        let reorderCFB = rawData.filter(x => x.SportSubType == 'College Football');
        let reorderNBA = rawData.filter(x => x.SportSubType == 'NBA');
        let reorderCBB = rawData.filter(x => x.SportSubType == 'College Basketball');
        let reorderMLB = rawData.filter(x => x.SportSubType == 'MLB');
        let reorderNHL = rawData.filter(x => x.SportSubType == 'NHL');
        let reorderOthers = rawData.filter(x => x.SportSubType != 'NFL' && x.SportSubType != 'College Football' && x.SportSubType != 'NBA' && x.SportSubType != 'College Basketball' && x.SportSubType != 'MLB' && x.SportSubType != 'NHL');
        rawData = [...reorderNFL, ...reorderCFB, ...reorderNBA, ...reorderCBB, ...reorderMLB, ...reorderNHL, ...reorderOthers];
        $scope.ActiveSports = DistinctActiveSports(rawData);
        $scope.AllActiveSubSports.push({ SubSport: { Title: $scope.Translate('All'), Name: 'All' }, subSportObj: [] });
        $scope.ActiveSports.forEach(function (sport) {
          sport.SubSportsList.forEach(function (subSport) {
            $scope.AllActiveSubSports[0].subSportObj.push({ sportType: sport.SportType, sportSubType: subSport.SportSubType });
            subSport.Title = `${sport.SportType} - ${subSport.SportSubType}`;
            $scope.AllActiveSubSports.push({ SubSport: subSport, SportType: sport.SportType, subSportObj: [{ sportType: sport.SportType, sportSubType: subSport.SportSubType }] });
          })
        });
        if ($scope.AllActiveSubSports.length) $scope.SelectedSubSport = $scope.AllActiveSubSports[0];
        else $scope.SelectedSubSport = $scope.AllActiveSubSports[0];
        LoadGamePeriodInfoFromSport($scope.SelectedSubSport.subSportObj, 0);
      });
    };

    let currentSelection = {};

    $scope.accuDataToggle = function () {
      $scope.SelectedSports = [];
      LoadInfo();
    }

    $scope.onFilterChange = function (filter) {
      var sport = $scope.SelectedSubSport ? $scope.SelectedSubSport.subSportObj : null;
      if (filter === "date") {
        $scope.GetActivePeriodsAndSports();
        return;
      }
      if (!sport && $scope.AllActiveSubSports && $scope.AllActiveSubSports.length) sport = $scope.AllActiveSubSports[0].subSportObj;
      LoadGamePeriodInfoFromSport(sport);
    }

    async function LoadInfo(sportTypeArg) {
      if (sportTypeArg) {
        currentSelection = [...sportTypeArg];
        LoadGamePeriodInfoFromSport(sportTypeArg);
      } else {
        $scope.SelectedSports = [];
        LoadGamePeriodInfoFromSport(currentSelection);
      }
    }

    $scope.LoadInfo = LoadInfo;

    async function LoadGamePeriodInfoFromSport(sportTypeArg) {
      if (typeof sportTypeArg === "undefined") return;
      $scope.SelectedSports = [];
      getAgentPositionBygame(sportTypeArg);

    }

    function getAgentPositionBygame(sportTypeArg, periodNumber = -1) {
      if (!sportTypeArg) return;
      const weekNumber = $scope.ReportFilters.WeekNumber;
      currentSelection = [...sportTypeArg];
      $scope.loadindingInfo = true;
      let positionByGame = {};
      $scope.SelectedSports = [];
      let mode = 0;
      if ($scope.SelectedWagerType === "A") mode = $scope.ReportFilters.IncludeGradedWagers ? 1 : 0;
      else if ($scope.SelectedWagerType === "S") mode = $scope.ReportFilters.IncludeGradedWagers ? 4 : 3;
      else if ($scope.SelectedWagerType === "PT") mode = $scope.ReportFilters.IncludeGradedWagers ? 6 : 5;
      else if ($scope.SelectedWagerType === "P") mode = $scope.ReportFilters.IncludeGradedWagers ? 11 : 8;
      else if ($scope.SelectedWagerType === "T") mode = $scope.ReportFilters.IncludeGradedWagers ? 12 : 9;
      else if ($scope.SelectedWagerType === "I") mode = $scope.ReportFilters.IncludeGradedWagers ? 10 : 7;
      const dateMode = $scope.SelectedDateFilterOption === 'All' ? 0 : ($scope.SelectedDateFilterOption === "Today" ? 1 : ($scope.SelectedDateFilterOption === "Tomorrow" ? 2 : 3));
      $agentService.GetAgentPositionByGameV2(sportTypeArg, periodNumber, weekNumber, mode, dateMode).then(result => {
        if (result.data.d.Data.length == 0) return;
        const periodNumberP = (periodNumber < 0 ? 0 : periodNumber);
        let groupedData = result.data.d.Data.reduce(function (rv, x) {
          (rv[x['SportType'] + x['SportSubType']] = rv[x['SportType'] + x['SportSubType']] || []).push(x);
          return rv;
        }, {});
        groupedData = Object.keys(groupedData).map((key) => [groupedData[key]]);
        $scope.nothingToShow = false;
        groupedData.forEach(dataSet => {
          const sport = dataSet[0];
          var availablePeriods = $scope.GetAvailablePeriods(sport[0].SportType, sport[0].SportSubType);
          const selectedPeriod = availablePeriods.find(x => x.PeriodNumber == periodNumberP);
          if (selectedPeriod) selectedPeriod.Selected = true;
          positionByGame = GroupPositionInfo(sport, periodNumberP);
          var selectedSport = {
            SportType: sport[0].SportType,
            SportSubType: sport[0].SportSubType,
            PeriodInfo: selectedPeriod,
            WeekNumber: weekNumber,
            AvailablePeriods: availablePeriods,
            PositionByGame: positionByGame,
            AllPeriods: false
          };
          selectedSport.SelectedPeriod = selectedSport.AvailablePeriods[0];
          $scope.SelectedSports.push(selectedSport);
        });
        displayTooltips();
        $scope.loadindingInfo = false;
        if (!$scope.SelectedSports.length) $scope.nothingToShow = true;
        setTimeout(() => wrapper.scrollTop = currentScrollPosition, 900);
        $rootScope.safeApply();
      });
    }

    $scope.GameIsOver = function (dateTime) {
      return (new Date(dateTime)).getTime() < ($agentService.GetServerDateTime()).getTime();
    }

    $scope.FilterGames = function (game) {
      return validateGameDate(game);
    }

    function validateGameDate(game) {
      if (!game) return false;
      if (Object.entries(game.Team1Data).length === 0 && Object.entries(game.Team2Data).length === 0) return false;
      let filterDate = new Date($agentService.GetServerDateTime());
      var filterDateOption = $scope.SelectedDateFilterOption;
      var gameDate;
      //var gameDate = (new Date(game.GameDateString || game.GameDateTimeString.split(' ')[0])).toDateString();
      if ($scope.ReportFilters.IncludeGradedWagers == false && game.FinishedGame == 1) return false;
      let teamData = null;
      if (!game.IsTitle) {
        if (game.Team1Data.spreadData || game.Team1Data.spreadData || game.Team1Data.moneyData || game.Team1Data.totalData)
          teamData = game.Team1Data.spreadData;
        else if (game.Team2Data.spreadData || game.Team2Data.spreadData || game.Team2Data.moneyData || game.Team2Data.totalData)
          teamData = game.Team2Data.spreadData;
      }
      if (teamData)
        gameDate = (new Date(teamData.GameDateString)).toDateString();
      else if (game.GameDateString)
        gameDate = (new Date(game.GameDateString)).toDateString();
      else if (game.GameDateTimeString)
        gameDate = (new Date(game.GameDateTimeString)).toDateString();
      if (filterDateOption == "Yesterday") filterDate.setDate(filterDate.getDate() - 1);
      if (filterDateOption == "Tomorrow") filterDate.setDate(filterDate.getDate() + 1);
      if (!filterDateOption || filterDateOption == 'All') return true;
      filterDate = filterDate.toDateString();
      return filterDate == gameDate;

    }

    $scope.FilterLeagues = function (league) {
      return (league.PositionByGame ? league.PositionByGame.some(x => $scope.FilterGames(x)) : false) || league.AvailablePeriods.length > 1;
    }

    $scope.LoadGamePeriodInfoFromGamePeriod = function (sport, period, allPeriods = false) {
      if (allPeriods == false) sport.AllPeriods = false;
      var weekNumber = $scope.ReportFilters.WeekNumber;
      sport.PeriodInfo = period;

      let mode = 0;
      if ($scope.SelectedWagerType === "A") mode = $scope.ReportFilters.IncludeGradedWagers ? 1 : 0;
      else if ($scope.SelectedWagerType === "S") mode = $scope.ReportFilters.IncludeGradedWagers ? 4 : 3;
      else if ($scope.SelectedWagerType === "PT") mode = $scope.ReportFilters.IncludeGradedWagers ? 6 : 5;
      const dateMode = $scope.SelectedDateFilterOption === 'All' ? 0 : ($scope.SelectedDateFilterOption === "Today" ? 1 : ($scope.SelectedDateFilterOption === "Tomorrow" ? 2 : 3));
      const periodNumber = sport.AllPeriods == true ? -1 : period.PeriodNumber;
      $agentService.GetAgentPositionByGameV2([{ sportType: sport.SportType, sportSubType: sport.SportSubType }], periodNumber, weekNumber, mode, dateMode).then(function (result) {
        sport.PositionByGame = GroupPositionInfo(result.data.d.Data, periodNumber);
        period.Selected = true;
        for (i = 0; i < sport.AvailablePeriods.length; i++) {
          if (sport.AvailablePeriods[i].PeriodNumber != period.PeriodNumber) sport.AvailablePeriods[i].Selected = false;
        }
      });
    };

    $scope.GetWeekNumberInt = function (weekNumberObj) {
      return weekNumberObj.Index;
    };

    var GroupPositionInfo = function (list, periodNumber) {
      if (!list || list.length == 0) return null;
      var result = new Array();
      var gameObj = {
        Team1Data: {}, Team2Data: {}, IsTitle: false, DrawData: {}
      };
      var holdGameNum = list[0].GameNum + ' ' + list[0].PeriodNumber;
      var holdGameDate = new Date(list[0].GameDateString).toDateString();

      for (var j = 0; j < list.length; j++) {
        var date = new Date(list[j].GameDateString).toDateString();

        if (holdGameNum != (list[j].GameNum + ' ' + list[j].PeriodNumber)) {
          result.push(gameObj);
          gameObj = {
            Team1Data: {}, Team2Data: {}, IsTitle: false, DrawData: {}
          };
        }
        if (list[j].PeriodNumber == periodNumber) {
          if ((j == 0 || holdGameDate != date) && list[j].TeamIdIdx == 1) {
            var gameDateObj = {
              GameDateString: list[j].GameDateString, IsTitle: true, Team1Data: {}, Team2Data: {}, DrawData: {}
            };
            result.push(gameDateObj);
          }
          gameObj.FinishedGame = list[j].FinishedGame;
          gameObj.GameDateTimeString = list[j].GameDateTimeString;
          gameObj.PeriodNumber = list[j].PeriodNumber;
          switch (list[j].TeamIdIdx) {
            case 1:
              gameObj.Team1Data.TeamId = list[j].TeamId;
              gameObj.Team1Data.TeamRotNum = list[j].TeamRotNum;
              gameObj.Team1Data.GameNum = list[j].GameNum;
              gameObj.Team1Data.spreadData = list[j].WagerType == 'S' ? (gameObj.Team1Data.spreadData ?
                {
                  ...list[j],
                  SpreadCount: gameObj.Team1Data.spreadData.SpreadCount + list[j].SpreadCount,
                  SpreadVolume: gameObj.Team1Data.spreadData.SpreadVolume + list[j].SpreadVolume,
                  SpreadWagered: gameObj.Team1Data.spreadData.SpreadWagered + list[j].SpreadWagered,
                  SpreadToWin: gameObj.Team1Data.spreadData.SpreadToWin + list[j].SpreadToWin,
                } : list[j]) : gameObj.Team1Data.spreadData || null;


              gameObj.Team1Data.moneyData = list[j].WagerType == 'M' ? (gameObj.Team1Data.moneyData ?
                {
                  ...list[j],
                  MoneyLineCount: gameObj.Team1Data.moneyData.MoneyLineCount + list[j].MoneyLineCount,
                  MoneyLineVolume: gameObj.Team1Data.moneyData.MoneyLineVolume + list[j].MoneyLineVolume,
                  MoneyLineWagered: gameObj.Team1Data.moneyData.MoneyLineWagered + list[j].MoneyLineWagered,
                  MoneyLineToWin: gameObj.Team1Data.moneyData.MoneyLineToWin + list[j].MoneyLineToWin,
                } : list[j]) : gameObj.Team1Data.moneyData || null;

              gameObj.Team1Data.totalData = list[j].WagerType == 'L' ? (gameObj.Team1Data.totalData ?
                {
                  ...list[j],
                  TotalPointsCount: gameObj.Team1Data.totalData.TotalPointsCount + list[j].TotalPointsCount,
                  TotalPointsVolume: gameObj.Team1Data.totalData.TotalPointsVolume + list[j].TotalPointsVolume,
                  TotalPointsWagered: gameObj.Team1Data.totalData.TotalPointsWagered + list[j].TotalPointsWagered,
                  TotalPointsToWin: gameObj.Team1Data.totalData.TotalPointsToWin + list[j].TotalPointsToWin,
                } : list[j]) : gameObj.Team1Data.totalData || null;

              break;
            case 2:
              gameObj.Team2Data.TeamId = list[j].TeamId;
              gameObj.Team2Data.TeamRotNum = list[j].TeamRotNum;
              gameObj.Team2Data.GameNum = list[j].GameNum;
              gameObj.Team2Data.spreadData = list[j].WagerType == 'S' ? (gameObj.Team2Data.spreadData ?
                {
                  ...list[j],
                  SpreadCount: gameObj.Team2Data.spreadData.SpreadCount + list[j].SpreadCount,
                  SpreadVolume: gameObj.Team2Data.spreadData.SpreadVolume + list[j].SpreadVolume,
                  SpreadWagered: gameObj.Team2Data.spreadData.SpreadWagered + list[j].SpreadWagered,
                  SpreadToWin: gameObj.Team2Data.spreadData.SpreadToWin + list[j].SpreadToWin,
                } : list[j]) : gameObj.Team2Data.spreadData || null;

              gameObj.Team2Data.moneyData = list[j].WagerType == 'M' ? (gameObj.Team2Data.moneyData ?
                {
                  ...list[j],
                  MoneyLineCount: gameObj.Team2Data.moneyData.MoneyLineCount + list[j].MoneyLineCount,
                  MoneyLineVolume: gameObj.Team2Data.moneyData.MoneyLineVolume + list[j].MoneyLineVolume,
                  MoneyLineWagered: gameObj.Team2Data.moneyData.MoneyLineWagered + list[j].MoneyLineWagered,
                  MoneyLineToWin: gameObj.Team2Data.moneyData.MoneyLineToWin + list[j].MoneyLineToWin,
                } : list[j]) : gameObj.Team2Data.moneyData || null;

              gameObj.Team2Data.totalData = list[j].WagerType == 'L' ? (gameObj.Team2Data.totalData ?
                {
                  ...list[j],
                  TotalPointsCount: gameObj.Team2Data.totalData.TotalPointsCount + list[j].TotalPointsCount,
                  TotalPointsVolume: gameObj.Team2Data.totalData.TotalPointsVolume + list[j].TotalPointsVolume,
                  TotalPointsWagered: gameObj.Team2Data.totalData.TotalPointsWagered + list[j].TotalPointsWagered,
                  TotalPointsToWin: gameObj.Team2Data.totalData.TotalPointsToWin + list[j].TotalPointsToWin,
                } : list[j]) : gameObj.Team2Data.totalData || null;

              break;
            case 3:
              gameObj.DrawData.TeamId = list[j].TeamId;
              gameObj.DrawData.TeamRotNum = list[j].TeamRotNum;
              gameObj.DrawData.GameNum = list[j].GameNum;
              gameObj.DrawData.moneyData = list[j].WagerType == 'M' ? (gameObj.DrawData.moneyData ?
                {
                  ...list[j],
                  MoneyLineCount: gameObj.DrawData.moneyData.MoneyLineCount + list[j].MoneyLineCount,
                  MoneyLineVolume: gameObj.DrawData.moneyData.MoneyLineVolume + list[j].MoneyLineVolume,
                  MoneyLineWagered: gameObj.DrawData.moneyData.MoneyLineWagered + list[j].MoneyLineWagered,
                  MoneyLineToWin: gameObj.DrawData.moneyData.MoneyLineToWin + list[j].MoneyLineToWin,
                } : list[j]) : gameObj.DrawData.moneyData || null;

              break;
          }
        }
        holdGameDate = date;
        holdGameNum = list[j].GameNum + ' ' + list[j].PeriodNumber;
        if (j == list.length - 1) {
          result.push(gameObj);
        }
      }
      return result;
    };

    $scope.GetAvailablePeriods = function (sportType, sportSubType) {
      var availablePeriods = [];

      for (var i = 0; i < $scope.ActiveSports.length; i++) {
        const subSportList = $scope.ActiveSports[i].ObjectList.filter(x => x.SportSubType == sportSubType.trim()) || [];
        if (subSportList.length > 0) {
          for (var j = 0; j < subSportList.length; j++) {
            var period = { PeriodNumber: subSportList[j].PeriodNumber, PeriodDescription: subSportList[j].PeriodDescription, Selected: false };
            availablePeriods.push(period);
          }
        }
      }
      return availablePeriods;
    };

    $scope.GetFirstAvailablePeriod = function (sportType, sportSubType) {
      if (!$scope.ActiveSports)
        return -2;
      for (var i = 0; i < $scope.ActiveSports.length; i++) {
        const subSport = $scope.ActiveSports[i].ObjectList.find(x => x.SportSubType == sportSubType.trim())
        if (subSport) return subSport.PeriodNumber;
      }
      return -1;
    };

    jQuery('#ModalAgentPos').on('hidden.bs.modal', function () {
      $scope.dataSource = [];
    })


    $scope.GetGameActionByLine = function (line, wagerType, wagerName, periodInfo) {
      $scope.AgentInfo = $agentService.AgentInfo;
      $scope.LineTitle = line.TeamId + ' ' + wagerName + ' ON ' + periodInfo.PeriodDescription.trim();
      $scope.dataSource = [];
      let wType = 'A';
      if ($scope.SelectedWagerType === "S") wType = line.WagerType;
      else if ($scope.SelectedWagerType === "PT") wType = 'P';
      else wType = $scope.SelectedWagerType;

      $agentService.GetWagersByLine(line.GameNum, periodInfo.PeriodNumber, line.TeamId.trim(), wType, line.WagerType, line.TotalPointsOU).then(function (result) {
        $scope.dataSource = result.data.d.Data;
      });
      return;
      $agentService.GetGameActionByLine(line.GameNum, periodInfo.PeriodNumber, wagerType == 'L' ? line.TotalPointsOU : line.TeamId.trim(), wagerType).then(function (result) {
        $scope.GameActionByLine = [];
        var rawData = result.data.d.Data;
        if (!rawData || rawData.length == 0) return;
        var agentID = rawData[0].AgentID;
        var groupedItems = new Array();
        var groupedData = new Array();
        for (var i = 0; i < rawData.length; i++) {
          if (agentID != rawData[i].AgentID) {
            groupedData.push({ Items: groupedItems, AgentID: groupedItems[0].AgentID });
            groupedItems = new Array();
            groupedItems.push(rawData[i]);
          } else {
            groupedItems.push(rawData[i]);
          }
          if (i == rawData.length - 1) {
            groupedData.push({ Items: groupedItems, AgentID: groupedItems[0].AgentID });
          }
          agentID = rawData[i].AgentID;
        }
        $scope.GameActionByLine = groupedData;
      });
    };

    $scope.GetGameActionByLineDraw = function (team1, team2, line, wagerType, wagerName, periodInfo) {
      $scope.AgentInfo = $agentService.AgentInfo;
      $scope.LineTitle = line.TeamId + ' ' + wagerName;
      $scope.LineDate = CommonFunctions.FormatDateTime(line.GameDateTime, 11);
      $agentService.GetGameActionByLine(line.GameNum, periodInfo.PeriodNumber, 'Draw (' + team1.trim() + ' vs ' + team2.trim() + ')', wagerType).then(function (result) {
        $scope.GameActionByLine = [];
        var rawData = result.data.d.Data;
        if (!rawData || rawData.length == 0) return;
        var agentID = rawData[0].AgentID;
        var groupedItems = new Array();
        var groupedData = new Array();
        for (var i = 0; i < rawData.length; i++) {
          if (agentID != rawData[i].AgentID) {
            groupedData.push({ Items: groupedItems, AgentID: groupedItems[0].AgentID });
            groupedItems = new Array();
            groupedItems.push(rawData[i]);
          } else {
            groupedItems.push(rawData[i]);
          }
          if (i == rawData.length - 1) {
            groupedData.push({ Items: groupedItems, AgentID: groupedItems[0].AgentID });
          }
          agentID = rawData[i].AgentID;
        }
        $scope.GameActionByLine = groupedData;
      });
    };

    $scope.FormatLine = function (gameLine) {
      return LineOffering.ConvertToHalfSymbol(gameLine.Line, gameLine.TotalPointsOU == '') + ' ' + (gameLine.Price > 0 ? '+' + gameLine.Price : gameLine.Price) + (gameLine.TotalPointsOU == "O" ? " OVER" : gameLine.TotalPointsOU == "U" ? " UNDER" : "");
    };

    $scope.FormatMaxMin = function (minLine, maxLine, count, char = '') {
      const min = LineOffering.ConvertToHalfSymbol(minLine, char == '');
      const max = LineOffering.ConvertToHalfSymbol(maxLine, char == '');
      if (min == '' || max == '' || count == 0) return '-';
      return min == max ? `${char}${min}` : `${char}${min}/${max}`
    }

    function DistinctActiveSports(list) {
      var unique = {};
      var distinctActiveSports = [];
      for (var i in list) {
        if (typeof (unique[list[i].SportType]) == "undefined") {
          var List = new Array();
          for (var j = 0; j < list.length; j++) {
            if (list[j].SportType == list[i].SportType) {
              List.push(list[j]);
            }
          }
          var distinctSubSports = $scope.DistinctSubSports(List);
          //var activePeriods = $scope.DistinctPeriods(List);
          var groupedSportsInfo = { SportType: list[i].SportType, SubSportsList: distinctSubSports, /*ActiveGamePeriods: activePeriods,*/ ObjectList: List };
          distinctActiveSports.push(groupedSportsInfo);
        }
        unique[list[i].SportType] = "";
      }
      return distinctActiveSports;
    };

    $scope.DistinctSubSports = function (list) {
      var unique = {};
      var distinctSubSports = [];
      for (var i in list) {
        if (typeof (unique[list[i].SportSubType]) == "undefined") {
          var sportSubType = { SportSubType: list[i].SportSubType };
          distinctSubSports.push(sportSubType);
        }
        unique[list[i].SportSubType] = "";
      }
      return distinctSubSports;
    };

    $scope.DisplayTeam = function (gameInfo) {
      if (!gameInfo || !gameInfo.TeamRotNum) return;
      return String(gameInfo.TeamRotNum) + ' - ' + $scope.Translate(gameInfo.TeamId);
    };

    $scope.CalculateProfit = function (teamData, otherTeamData, sportType, sportSubType, wagerType, drawData) {
      var profit = 0;
      if (!teamData || typeof teamData.GameNum === "undefined") return $scope.FormatMyNumber(profit, false, true);
      var keepGoing = true;
      angular.forEach($scope.SelectedSports, function (myItem) {
        if (keepGoing) {
          if (myItem.SportType == sportType && myItem.SportSubType == sportSubType) {
            positionByGame = myItem.PositionByGame;
            keepGoing = false;
          }
        }
      });
      if (!otherTeamData) return profit;
      switch (wagerType) {
        case "S":
          profit = otherTeamData.SpreadWagered - teamData.SpreadToWin;
          break;
        case "M":
          profit = otherTeamData.MoneyLineWagered - teamData.MoneyLineToWin;
          break;
        case "D":
          profit = drawData.MoneyLineWagered - drawData.MoneyLineToWin;
          break;
        case "L":
          profit = otherTeamData.TotalPointsWagered - teamData.TotalPointsToWin;
          break;
      }

      return $scope.FormatMyNumber(profit, false, true);
    };

    $scope.CalculateVolume = function (gameInfo, wagerType) {
      var volume = 0.0;
      if (!gameInfo || typeof gameInfo.GameNum === "undefined") return $scope.FormatMyNumber(volume, false, true);
      switch (wagerType) {
        case "S":
          volume = gameInfo.SpreadVolume;
          break;
        case "M":
          volume = gameInfo.MoneyLineVolume;
          break;
        case "L":
          volume = gameInfo.TotalPointsVolume;
          break;
      }

      return $scope.FormatMyNumber(volume, false, true);
    };

    $scope.CalculateCount = function (gameInfo, wagerType) {
      var count = 0;
      if (!gameInfo || typeof gameInfo.GameNum === "undefined") return $scope.FormatMyNumber(count, false, true);
      switch (wagerType) {
        case "S":
          count = gameInfo.SpreadCount;
          break;
        case "M":
          count = gameInfo.MoneyLineCount;
          break;
        case "L":
          count = gameInfo.TotalPointsCount;
          break;
      }

      return $scope.FormatMyNumber(count, false, true);
    };

    $scope.Init();
  }
]);

//20241004 T -> Added Mode 3 & 4 to the API call and some changes reported by Bookies