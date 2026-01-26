appModule.controller("contestPositionController", [
  '$scope', '$agentService', function ($scope, $agentService) {
    var periodNum = 0, periodName = '';
    $scope.AllActiveSubSports = [];

    $scope.ReportFilters = {
      WeekNumber: {},
      ShowActiveOnly: false
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

    $scope.Init = function () {
      $scope.WeeksRange = $agentService.GetWeeksRange();
      $scope.ReportFilters.WeekNumber = $scope.WeeksRange[0];
      $scope.GetActivePeriodsAndSports();
    };

    $scope.ActiveSportChanged = function () {

      $scope.SelectedSports = [];
      $scope.DDBox.ActiveSubSport = $scope.DDBox.ActiveSport.SubSportsList[0];
      $scope.LoadGamePeriodInfoFromSport($scope.DDBox.ActiveSport.SportType, $scope.DDBox.ActiveSubSport);
    };

    $scope.GetActivePeriodsAndSports = function () {
      $agentService.GetActivePeriodsAndSports($scope.ReportFilters.WeekNumber.Index).then(function (result) {
        if (result.data.d.Data == null || result.data.d.Data.length == 0) return;
        $scope.ActiveSports = DistinctActiveSports(result.data.d.Data);
        $scope.AllActiveSubSports.push({ SubSport: { Title: $scope.Translate('All') } });
        $scope.ActiveSports.forEach(function (sport) {
          sport.SubSportsList.forEach(function (subSport) {
            subSport.Title = `${sport.SportType} - ${subSport.SportSubType}`;
            $scope.AllActiveSubSports.push({SubSport: subSport, SportType: sport.SportType});
          })
        });
        $scope.SelectedSubSport = $scope.AllActiveSubSports[0];
        $scope.DDBox = {
          ActiveSport: $scope.ActiveSports[0],
          ActiveSubSport: $scope.ActiveSports[0].SubSportsList[0]
        };
        $scope.ActiveSports.forEach(function (activeSport) {
          activeSport.SubSportsList.forEach(function (activeSubSport) {
            $scope.LoadGamePeriodInfoFromSport(activeSport.SportType, activeSubSport);
          })
        });
      });
    };

    $scope.LoadGamePeriodInfoFromSport = function (sportTypeArg, sportSubTypeArg, clearSelectedSports = false) {
      if (typeof sportSubTypeArg === "undefined") return;
      if (clearSelectedSports == true) $scope.SelectedSports = [];
      if (clearSelectedSports == false && sportSubTypeArg.Selected) {
        sportSubTypeArg.Selected = false;
        RemoveSportFromArray(sportTypeArg, sportSubTypeArg.SportSubType);
        return;
      }
      if (SportIsSelected(sportTypeArg, sportSubTypeArg.SportSubType)) return;
      sportSubTypeArg.Selected = true;
      let period = $scope.GetFirstAvailablePeriod(sportTypeArg, sportSubTypeArg.SportSubType);
      periodNum = period.PeriodNumber;
      periodName = period.PeriodDescription.trim();
      var availablePeriods = $scope.GetAvailablePeriods(sportTypeArg, sportSubTypeArg.SportSubType);
      var positionByGame = {};
      var weekNumber = $scope.ReportFilters.WeekNumber;
      $agentService.GetAgentPositionByGame(sportTypeArg, sportSubTypeArg.SportSubType, periodNum, weekNumber).then(function (result) {
        positionByGame = GroupPositionInfo(result.data.d.Data);
        var selectedSport = {
          SportType: sportTypeArg,
          SportSubType: sportSubTypeArg.SportSubType,
          PeriodNumber: periodNum,
          WeekNumber: weekNumber,
          AvailablePeriods: availablePeriods,
          PositionByGame: positionByGame
        };
        $scope.SelectedSports.push(selectedSport);
        displayTooltips();
        sportSubTypeArg.Selected = true;
      });
    };

    $scope.FilterGames = function (game) {
      if (!$scope.ReportFilters.ShowActiveOnly)
        return true;
      var gameTime;
      if (game.Team1Data)
        gameTime = parseInt(game.Team1Data.GameDate.replace('/Date(','').replace(')/', ''));
      else
        gameTime = game.GameDate;
      var today = $agentService.GetServerDateTime().toLocaleDateString();
      var todayTime = new Date(today).getTime();
      if (gameTime >= todayTime) return true;
      return false;
    }

    function SportIsSelected(sportType, sportSubType) {
      for (var i = 0; i < $scope.SelectedSports.length; i++) {
        if ($scope.SelectedSports[i].SportType == sportType && $scope.SelectedSports[i].SportSubType == sportSubType) {
          return true;
        }
      }
      return false;
    }

    function RemoveSportFromArray(sportType, sportSubType) {
      /*var remainingSelectedSports = [];
      for (var i = 0; i < $scope.SelectedSports.length; i++) {
        if ($scope.SelectedSports[i].SportType == sportType && $scope.SelectedSports[i].SportSubType == sportSubType) {
          continue;
        }
        remainingSelectedSports.push($scope.SelectedSports[i]);
      }
      */
      //$scope.SelectedSports = remainingSelectedSports;
      $scope.SelectedSports = [];
    }

    $scope.LoadGamePeriodInfoFromGamePeriod = function (sport, period) {
      if (period.Selected)
        return;
      var selectedSport = {};
      var selectedSports = $scope.SelectedSports;
      var weekNumber = $scope.ReportFilters.WeekNumber;
      periodNum = period.PeriodNumber;
      periodName = period.PeriodDescription;
      $agentService.GetAgentPositionByGame(sport.SportType, sport.SportSubType, period.PeriodNumber, weekNumber).then(function (result) {
        selectedSport = {
          SportType: sport.SportType,
          SportSubType: sport.SportSubType,
          PeriodNumber: period.PeriodNumber,
          WeekNumber: weekNumber,
          AvailablePeriods: null,
          PositionByGame: GroupPositionInfo(result.data.d.Data)
        };
        var i;
        for (i = 0; i < selectedSports.length; i++) {
          if (selectedSports[i].SportType == sport.SportType && selectedSports[i].SportSubType == sport.SportSubType) {
            selectedSports[i].PeriodNumber = selectedSport.PeriodNumber;
            selectedSports[i].PositionByGame = selectedSport.PositionByGame;
            break;
          }
        }
        $scope.SelectedSports = selectedSports;
        period.Selected = true;
        for (i = 0; i < sport.AvailablePeriods.length; i++) {
          if (sport.AvailablePeriods[i].PeriodNumber != period.PeriodNumber) sport.AvailablePeriods[i].Selected = false;
        }
      });
    };

    $scope.LoadGamePeriodInfoFromDatesRange = function () {
      var selectedSports = $scope.SelectedSports;
      angular.forEach(selectedSports, function (myItem) {
        myItem.WeekNumber = $scope.GetWeekNumberInt($scope.ReportFilters.WeekNumber);
        var lSportType = myItem.SportType;
        var lSportSubType = myItem.SportSubType;
        var lPeriodNumber = myItem.PeriodNumber;
        var lWeekNumber = myItem.WeekNumber;
        $scope.GetAgentPositionByGame(lSportType, lSportSubType, lPeriodNumber, lWeekNumber);
      });
    };

    $scope.GetAgentPositionByGame = function (sportTypeArg, sportSubTypeArg, periodNumberArg, weekNumberArg) {
      $agentService.GetAgentPositionByGame(sportTypeArg, sportSubTypeArg, periodNumberArg, weekNumberArg).then(function (result) {
        var positionByGame = GroupPositionInfo(result.data.d.Data);
        var keepGoing = true;
        angular.forEach($scope.SelectedSports, function (myItem) {
          if (keepGoing) {
            if (myItem.SportType == sportTypeArg && myItem.SportSubType == sportSubTypeArg) {
              myItem.PositionByGame = positionByGame;
              keepGoing = false;
            }
          }
        });
      });
    };

    $scope.GetWeekNumberInt = function (weekNumberObj) {
      return weekNumberObj.Index;
    };

    var GroupPositionInfo = function (list) {
      if (list.length == 0) return null;
      var result = new Array();
      var gameObj = { Team1Data: null, Team2Data: null, IsTitle: false, DrawData: null };
      var holdGameNum = list[0].GameNum;
      var holdGameDate = new Date(parseInt(list[0].GameDate.substr(6))).getTime();

      for (var j = 0; j < list.length; j++) {
        var date = new Date(parseInt(list[j].GameDate.substr(6))).getTime();

        if (holdGameNum != list[j].GameNum) {
          result.push(gameObj);
          gameObj = { Team1Data: null, Team2Data: null, IsTitle: false, DrawData: null };
        }
        if ((j == 0 || holdGameDate != date) && list[j].TeamIdIdx == 1) {
          var gameDateObj = { GameDate: date, IsTitle: true, Team1Data: null, Team2Data: null, DrawData: null };
          result.push(gameDateObj);
        }
        switch (list[j].TeamIdIdx) {
          case 1:
            gameObj.Team1Data = list[j];
            break;
          case 2:
            gameObj.Team2Data = list[j];
            break;
          case 3:
            gameObj.DrawData = list[j];
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
        if ($scope.ActiveSports[i].SportType == sportType) {
          for (var j = 0; j < $scope.ActiveSports[i].ObjectList.length; j++) {
            if ($scope.ActiveSports[i].ObjectList[j].SportSubType == sportSubType) {
              var period = { PeriodNumber: $scope.ActiveSports[i].ObjectList[j].PeriodNumber, PeriodDescription: $scope.ActiveSports[i].ObjectList[j].PeriodDescription, Selected: false };
              availablePeriods.push(period);
            }
          }
        }
      }
      availablePeriods[0].Selected = true;
      return availablePeriods;
    };

    $scope.GetFirstAvailablePeriod = function (sportType, sportSubType) {
      if (!$scope.ActiveSports)
        return -2;
      for (var i = 0; i < $scope.ActiveSports.length; i++) {
        if ($scope.ActiveSports[i].SportType == sportType) {
          for (var j = 0; j < $scope.ActiveSports[i].ObjectList.length; j++) {
            if ($scope.ActiveSports[i].ObjectList[j].SportSubType == sportSubType)
              return $scope.ActiveSports[i].ObjectList[j];
          }
        }
      }
      return -1;
    };

    $scope.GetGameActionByLine = function (line, wagerType, wagerName) {
      $scope.AgentInfo = $agentService.AgentInfo;
      $scope.LineTitle = line.TeamId + ' ' + wagerName + ' ON ' + periodName;
      $scope.LineDate = CommonFunctions.FormatDateTime(line.GameDateTime, 11);
      $agentService.GetGameActionByLine(line.GameNum, periodNum/*line.periodNum*/, wagerType == 'L' ? line.TotalPointsOU : line.TeamId, wagerType).then(function (result) {
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

    $scope.GetGameActionByLineDraw = function (team1, team2, line, wagerType, wagerName) {
      $scope.AgentInfo = $agentService.AgentInfo;
      $scope.LineTitle = line.TeamId + ' ' + wagerName ;
      $scope.LineDate = CommonFunctions.FormatDateTime(line.GameDateTime, 11);
      $agentService.GetGameActionByLine(line.GameNum, periodNum/*line.periodNum*/, 'Draw (' + team1 + ' vs ' + team2 + ')', wagerType).then(function (result) {
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
      return LineOffering.ConvertToHalfSymbol(gameLine.Line) + ' ' + (gameLine.Price > 0 ? '+' + gameLine.Price : gameLine.Price) + (gameLine.TotalPointsOU == "O" ? " OVER" : gameLine.TotalPointsOU == "U" ? " UNDER" : "");
    };

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

    /*
    $scope.DistinctPeriods = function (list) {
        var unique = {};
        var distinctPeriods = [];
        for (var i in list) {
            if (typeof (unique[list[i].PeriodNumber]) == "undefined") {
                var gamePeriod = { PeriodNumber: list[i].PeriodNumber, PeriodDescription: list[i].PeriodDescription };
                distinctPeriods.push(gamePeriod);
            }
            unique[list[i].PeriodNumber] = 0;
        }
        return distinctPeriods;
    };
    */

    $scope.DisplayTeam = function (gameInfo) {
      return String(gameInfo.TeamRotNum) + ' - ' + $scope.Translate(gameInfo.TeamId);
    };

    $scope.CalculateProfit = function (teamData, otherTeamData, sportType, sportSubType, wagerType, drawData) {
      var profit = 0;
      var positionByGame = [];
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