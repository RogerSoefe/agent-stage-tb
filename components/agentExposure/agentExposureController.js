appModule.controller("agentExposureController", [
  '$rootScope', '$scope', '$agentService', function ($rootScope, $scope, $agentService) {
    $scope.AllActiveSubSports = [];
    $scope.filterArray = ['All', 'Today', 'Yesterday', 'Tomorrow'];
    $scope.SelectedDateFilterOption = $scope.filterArray[1];
    $scope.showProfit = false;
    $scope.ShowAccuwagers = false;
    $scope.ReportFilters = {
      WeekNumber: {},
      ShowActiveOnly: true
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


    $scope.Init = function () {
      if ($scope.AgentAsCustomerInfo) {
        $scope.WeeksRange = $agentService.GetWeeksRange();
        $scope.ReportFilters.WeekNumber = $scope.WeeksRange[0];
        $scope.GetActivePeriodsAndSports();
      }
      else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.ReportFilters.WeekNumber = $scope.WeeksRange[0];
          $scope.GetActivePeriodsAndSports();
        });
      }
    };
    let wrapper = document.getElementById('aPWrapper');
    let currentScrollPosition = 0;

    $scope.getPeriodDescription = function (availablePeriods, periodNumber) {
      return (availablePeriods.find(x => x.PeriodNumber == periodNumber)).PeriodDescription;
    }

    $scope.GetActivePeriodsAndSports = function () {
      serverDateTime = $agentService.GetServerDateTime();
      yesterdayDate = new Date(serverDateTime);
      yesterdayDate.setDate(yesterdayDate.getDate() - 1);
      tomorrowDate = new Date(serverDateTime);
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      serverDateTime.setHours(0, 0, 0, 0);
      yesterdayDate.setHours(0, 0, 0, 0);
      tomorrowDate.setHours(0, 0, 0, 0);
      currentScrollPosition = wrapper.scrollTop;
      $agentService.GetActivePeriodsAndSports($scope.ReportFilters.WeekNumber.Index).then(async function (result) {
        if (result.data.d.Data == null || result.data.d.Data.length == 0) return;
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
        $scope.SelectedSubSport = $scope.AllActiveSubSports[0];
        LoadGamePeriodInfoFromSport($scope.SelectedSubSport.subSportObj, 0);

      });
    };

    let currentSelection = {};

    $scope.accuDataToggle = function () {
      $scope.SelectedSports = [];
      LoadInfo(currentSelection);
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

    function getAgentPositionBygame(sportTypeArg, periodNumber = 0) {
      const weekNumber = $scope.ReportFilters.WeekNumber;
      $scope.loadindingInfo = true;
      currentSelection = [...sportTypeArg];
      let positionByGame = {};
      $scope.SelectedSports = [];
      $agentService.GetAgentPositionByGame(sportTypeArg, periodNumber, weekNumber, 2).then(result => {
        if (result.data.d.Data.length == 0) {
          $scope.loadindingInfo = false;
          return;
        }
        let groupedData = result.data.d.Data.reduce(function (rv, x) {
          (rv[x['SportType'] + x['SportSubType']] = rv[x['SportType'] + x['SportSubType']] || []).push(x);
          return rv;
        }, {});
        groupedData = Object.keys(groupedData).map((key) => [groupedData[key]]);
        groupedData.forEach(dataSet => {
          const sport = dataSet[0];
          const period = $scope.GetFirstAvailablePeriod(sport[0].SportType, sport[0].SportSubType);
          var availablePeriods = $scope.GetAvailablePeriods(sport[0].SportType, sport[0].SportSubType);
          const selectedPeriod = availablePeriods.find(x => x.PeriodNumber == periodNumber);
          selectedPeriod.Selected = true;
          positionByGame = GroupPositionInfo(sport);
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
      var filterDateOption = $scope.SelectedDateFilterOption;
      var gameDate;

      let teamData = null;
      if (!game.IsTitle)
        teamData = game.Team1Data.straightsData.spreadData ? game.Team1Data.straightsData.spreadData : game.Team1Data.straightsData.moneyData ? game.Team1Data.straightsData.moneyData : game.Team1Data.straightsData.totalData ? game.Team1Data.straightsData.totalData : null;
      if (teamData)
        gameDate = (new Date(teamData.GameDateString)).toDateString();
      else if (game.GameDateString)
        gameDate = (new Date(game.GameDateString)).toDateString();
      else if (game.GameDateTimeString)
        gameDate = (new Date(game.GameDateTimeString)).toDateString();
      if (filterDateOption == "Yesterday") {
        return yesterdayDate.toDateString() == gameDate;
      }
      if (filterDateOption == "Tomorrow") {
        return tomorrowDate.toDateString() == gameDate;
      }
      if (filterDateOption == "All") {
        let dateGame = new Date(gameDate);
        dateGame.setHours(0, 0, 0, 0);
        return dateGame >= serverDateTime;
      }
      return serverDateTime.toDateString() == gameDate;

    }

    $scope.FilterLeagues = function (league) {
      return (league.PositionByGame ? league.PositionByGame.some(x => $scope.FilterGames(x, null)) : false) || league.AvailablePeriods.length > 1;
    }

    $scope.LoadGamePeriodInfoFromGamePeriod = function (sport, period) {
      if (period.Selected)
        return;
      var weekNumber = $scope.ReportFilters.WeekNumber;
      sport.PeriodInfo = period;
      $agentService.GetAgentPositionByGame([{ sportType: sport.SportType, sportSubType: sport.SportSubType }], period.PeriodNumber, weekNumber, 2).then(function (result) {
        sport.PositionByGame = GroupPositionInfo(result.data.d.Data);
        period.Selected = true;
        for (i = 0; i < sport.AvailablePeriods.length; i++) {
          if (sport.AvailablePeriods[i].PeriodNumber != period.PeriodNumber) sport.AvailablePeriods[i].Selected = false;
        }
      });
    };

    $scope.GetWeekNumberInt = function (weekNumberObj) {
      return weekNumberObj.Index;
    };

    var GroupPositionInfo = function (list) {
      if (!list || list.length == 0) return null;
      var result = new Array();
      var gameObj = { Team1Data: {}, Team2Data: {}, IsTitle: false, DrawData: null };
      var holdGameNum = list[0].GameNum;
      var holdGameDate = new Date(list[0].GameDateString).toDateString();

      for (var j = 0; j < list.length; j++) {
        var date = new Date(list[j].GameDateString).toDateString();

        if (holdGameNum != list[j].GameNum) {
          result.push(gameObj);
          gameObj = { Team1Data: {}, Team2Data: {}, IsTitle: false, DrawData: null };
        }
        if ((j == 0 || holdGameDate != date) && list[j].TeamIdIdx == 1) {
          var gameDateObj = { GameDateString: list[j].GameDateString, IsTitle: true, Team1Data: null, Team2Data: null, DrawData: null };
          result.push(gameDateObj);
        }
        gameObj.GameNum = list[j].GameNum;
        gameObj.FinishedGame = list[j].FinishedGame;
        gameObj.GameDateTimeString = list[j].GameDateTimeString;

        gameObj.Team1Data.straightsData = gameObj.Team1Data.straightsData ? gameObj.Team1Data.straightsData : {};
        gameObj.Team1Data.parlaysData = gameObj.Team1Data.parlaysData ? gameObj.Team1Data.parlaysData : {};
        gameObj.Team1Data.teasersData = gameObj.Team1Data.teasersData ? gameObj.Team1Data.teasersData : {};
        gameObj.Team1Data.reverseData = gameObj.Team1Data.reverseData ? gameObj.Team1Data.reverseData : {};

        gameObj.Team2Data.straightsData = gameObj.Team2Data.straightsData ? gameObj.Team2Data.straightsData : {};
        gameObj.Team2Data.parlaysData = gameObj.Team2Data.parlaysData ? gameObj.Team2Data.parlaysData : {};
        gameObj.Team2Data.teasersData = gameObj.Team2Data.teasersData ? gameObj.Team2Data.teasersData : {};
        gameObj.Team2Data.reverseData = gameObj.Team2Data.reverseData ? gameObj.Team2Data.reverseData : {};

        switch (list[j].TeamIdIdx) {
          case 1:
            gameObj.Team1Data.TeamId = list[j].TeamId.trim();

            gameObj.Team1Data.TeamRotNum = list[j].TeamRotNum;
            gameObj.Team1Data.straightsData.spreadData = (list[j].Type == 'S' || list[j].Type == 'M' || list[j].Type == 'L' || list[j].Type == 'E') && list[j].WagerType == 'S' ? list[j] : gameObj.Team1Data.straightsData.spreadData;
            gameObj.Team1Data.straightsData.moneyData = (list[j].Type == 'S' || list[j].Type == 'M' || list[j].Type == 'L' || list[j].Type == 'E') && list[j].WagerType == 'M' ? list[j] : gameObj.Team1Data.straightsData.moneyData;
            gameObj.Team1Data.straightsData.totalData = (list[j].Type == 'S' || list[j].Type == 'M' || list[j].Type == 'L' || list[j].Type == 'E') && list[j].WagerType == 'L' ? list[j] : gameObj.Team1Data.straightsData.totalData;

            gameObj.Team1Data.parlaysData.spreadData = list[j].Type == 'P' && list[j].WagerType == 'S' ? list[j] : gameObj.Team1Data.parlaysData.spreadData;
            gameObj.Team1Data.parlaysData.moneyData = list[j].Type == 'P' && list[j].WagerType == 'M' ? list[j] : gameObj.Team1Data.parlaysData.moneyData;
            gameObj.Team1Data.parlaysData.totalData = list[j].Type == 'P' && list[j].WagerType == 'L' ? list[j] : gameObj.Team1Data.parlaysData.totalData;

            gameObj.Team1Data.teasersData.spreadData = list[j].Type == 'T' && list[j].WagerType == 'S' ? list[j] : gameObj.Team1Data.teasersData.spreadData;
            gameObj.Team1Data.teasersData.moneyData = list[j].Type == 'T' && list[j].WagerType == 'M' ? list[j] : gameObj.Team1Data.teasersData.spreadData;
            gameObj.Team1Data.teasersData.totalData = list[j].Type == 'T' && list[j].WagerType == 'L' ? list[j] : gameObj.Team1Data.teasersData.totalData;


            gameObj.Team1Data.reverseData.spreadData = list[j].Type == 'I' && list[j].WagerType == 'S' ? list[j] : gameObj.Team1Data.reverseData.spreadData;
            gameObj.Team1Data.reverseData.moneyData = list[j].Type == 'I' && list[j].WagerType == 'M' ? list[j] : gameObj.Team1Data.reverseData.spreadData;
            gameObj.Team1Data.reverseData.totalData = list[j].Type == 'I' && list[j].WagerType == 'L' ? list[j] : gameObj.Team1Data.reverseData.totalData;

            break;
          case 2:
            gameObj.Team2Data.TeamId = list[j].TeamId.trim();

            gameObj.Team2Data.TeamRotNum = list[j].TeamRotNum;
            gameObj.Team2Data.straightsData.spreadData = (list[j].Type == 'S' || list[j].Type == 'M' || list[j].Type == 'L' || list[j].Type == 'E') && list[j].WagerType == 'S' ? list[j] : gameObj.Team2Data.straightsData.spreadData;
            gameObj.Team2Data.straightsData.moneyData = (list[j].Type == 'S' || list[j].Type == 'M' || list[j].Type == 'L' || list[j].Type == 'E') && list[j].WagerType == 'M' ? list[j] : gameObj.Team2Data.straightsData.moneyData;
            gameObj.Team2Data.straightsData.totalData = (list[j].Type == 'S' || list[j].Type == 'M' || list[j].Type == 'L' || list[j].Type == 'E') && list[j].WagerType == 'L' ? list[j] : gameObj.Team2Data.straightsData.totalData;

            gameObj.Team2Data.parlaysData.spreadData = list[j].Type == 'P' && list[j].WagerType == 'S' ? list[j] : gameObj.Team2Data.parlaysData.spreadData;
            gameObj.Team2Data.parlaysData.moneyData = list[j].Type == 'P' && list[j].WagerType == 'M' ? list[j] : gameObj.Team2Data.parlaysData.moneyData;
            gameObj.Team2Data.parlaysData.totalData = list[j].Type == 'P' && list[j].WagerType == 'L' ? list[j] : gameObj.Team2Data.parlaysData.totalData;

            gameObj.Team2Data.teasersData.spreadData = list[j].Type == 'T' && list[j].WagerType == 'S' ? list[j] : gameObj.Team2Data.teasersData.spreadData;
            gameObj.Team2Data.teasersData.moneyData = list[j].Type == 'T' && list[j].WagerType == 'M' ? list[j] : gameObj.Team2Data.teasersData.moneyData;
            gameObj.Team2Data.teasersData.totalData = list[j].Type == 'T' && list[j].WagerType == 'L' ? list[j] : gameObj.Team2Data.teasersData.totalData;

            gameObj.Team2Data.reverseData.spreadData = list[j].Type == 'I' && list[j].WagerType == 'S' ? list[j] : gameObj.Team2Data.reverseData.spreadData;
            gameObj.Team2Data.reverseData.moneyData = list[j].Type == 'I' && list[j].WagerType == 'M' ? list[j] : gameObj.Team2Data.reverseData.spreadData;
            gameObj.Team2Data.reverseData.totalData = list[j].Type == 'I' && list[j].WagerType == 'L' ? list[j] : gameObj.Team2Data.reverseData.totalData;
            break;
          case 3:
            gameObj.DrawData = !gameObj.DrawData ? list[j] : list[j].WagerType == 'M' ? list[j] : gameObj.DrawData;
            break;
        }
        holdGameDate = date;
        holdGameNum = list[j].GameNum;
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

    $scope.GetGameActionByLine = function (gameNum, chosenTeam, wagerSubType, wagerType, periodInfo, totalPointsOU) {
      $scope.dataSource = [];
      $agentService.GetOpenWagersByLine(gameNum, periodInfo.PeriodNumber, chosenTeam, wagerType, wagerSubType, totalPointsOU).then(function (result) {
        $scope.dataSource = result.data.d.Data;
      });
    };

    jQuery('#ModalAgentPos').on('hidden.bs.modal', function () {
      $scope.dataSource = [];
    })

    $scope.GetGameActionByLineDraw = function (team1, team2, line, wagerType, wagerName, periodInfo, totalPointsOU = null) {


      $agentService.GetOpenWagersByLine(line.GameNum, periodInfo.PeriodNumber, 'Draw (' + team1.trim() + ' vs ' + team2.trim() + ')', wagerType, wagerSubType, totalPointsOU).then(function (result) {
        $scope.dataSource = result.data.d.Data;
      });

      $scope.AgentInfo = $agentService.AgentInfo;
      $scope.LineTitle = line.TeamId + ' ' + wagerName;
      $scope.LineDate = CommonFunctions.FormatDateTime(line.GameDateTime, 11);
      $agentService.GetGameActionByLine(line.GameNum, periodInfo.PeriodNumber, 'Draw (' + team1.trim() + ' vs ' + team2.trim() + ')', wagerType, totalPointsOU).then(function (result) {
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
      if (!gameInfo) return;
      return String(gameInfo.TeamRotNum) + ' - ' + $scope.Translate(gameInfo.TeamId);
    };


    $scope.CalculateVolume = function (gameInfo, wagerType) {
      if (!gameInfo) return;
      var volume = 0.0;
      switch (wagerType) {
        case "S":
          volume = gameInfo.spreadData ? gameInfo.spreadData.SpreadWagered : 0;
          break;
        case "M":
          volume = gameInfo.moneyData ? gameInfo.moneyData.MoneyLineWagered : 0;
          break;
        case "L":
          volume = gameInfo.totalData ? gameInfo.totalData.TotalPointsWagered : 0;
          break;
        case "I":
          volume = gameInfo.totalData ? gameInfo.totalData.TotalPointsWagered : 0;
          break;
      }

      return $scope.FormatMyNumber(volume, false, true);
    };

    $scope.Init();
  }
]);