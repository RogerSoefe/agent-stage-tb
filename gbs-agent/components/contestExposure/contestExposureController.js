appModule.controller("contestExposureController", [
  '$rootScope', '$scope', '$agentService', function ($rootScope, $scope, $agentService) {
    $scope.AllActiveSubSports = [];
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
    let sportCommaSeparate = '';
    let subSportCommaSeparate = '';

    $scope.GetActivePeriodsAndSports = function () {
      $agentService.GetActiveContests($scope.ReportFilters.WeekNumber.Index).then(async function (result) {
        if (result.data.d.Data == null || result.data.d.Data.length == 0) return;
        let rawData = result.data.d.Data;
        $scope.ActiveSports = DistinctActiveSports(rawData);
        //$scope.AllActiveSubSports.push({ ContestType2: { Title: $scope.Translate('All'), Name: 'All' } });
        $scope.ActiveSports.forEach(function (contestType) {
          contestType.SubSportsList.forEach(function (contestType2) {
            contestType2.Title = `${contestType.ContestType} - ${contestType2.ContestType2}`;
            $scope.AllActiveSubSports.push({ ContestType2: contestType2, ContestType: contestType.ContestType });
          })
        });
        $scope.SelectedSubSport = $scope.AllActiveSubSports[0];
        $scope.DDBox = {
          ActiveSport: $scope.ActiveSports[0],
          ActiveSubSport: $scope.ActiveSports[0].SubSportsList[0]
        };
        $scope.LoadGamePeriodInfoFromSport($scope.AllActiveSubSports[0].ContestType, $scope.ActiveSports[0].SubSportsList[0].ContestType2);
        return;
        subSportCommaSeparate = '';
        $scope.ActiveSports.forEach(x => {
          subSportCommaSeparate += x.SubSportsList.length > 1 ? x.SubSportsList.reduce(function (a, b) {
            return (a.ContestType2 || a) + "," + b.ContestType2 + ","
          }) : (subSportCommaSeparate.split(',').length > 0 ? ',' + x.SubSportsList[0].ContestType2 : x.SubSportsList[0].ContestType2)
        });
        sportCommaSeparate = $scope.ActiveSports.length > 1 ? $scope.ActiveSports.reduce(function (a, b) {
          return (a.ContestType || a) + "," + b.ContestType
        }) : $scope.ActiveSports[0].ContestType;
        $scope.LoadGamePeriodInfoFromSport(sportCommaSeparate, subSportCommaSeparate, 0);

      });
    };

    async function LoadInfo(sportTypeArg, sportSubTypeArg) {
      if (sportSubTypeArg && !sportSubTypeArg.Name) {
        LoadGamePeriodInfoFromSport(sportTypeArg, sportSubTypeArg.ContestType2);
      } else {
        $scope.SelectedSports = [];
        $scope.LoadGamePeriodInfoFromSport(sportCommaSeparate, subSportCommaSeparate);
      }
    }

    $scope.LoadInfo = LoadInfo;

    async function LoadGamePeriodInfoFromSport(sportTypeArg, sportSubTypeArg) {
      if (typeof sportSubTypeArg === "undefined") return;
      $scope.SelectedSports = [];
      getAgentPositionByContest(sportTypeArg, sportSubTypeArg);

    }

    function getAgentPositionByContest(contestType, contestType2) {
      const weekNumber = $scope.ReportFilters.WeekNumber;
      $scope.loadindingInfo = true;
      let positionByGame = {};
      $scope.SelectedSports = [];
      $agentService.GetAgentPositionByContest(contestType, contestType2, null, weekNumber).then(result => {
        if (result.data.d.Data.length == 0) {
          $scope.loadindingInfo = false;
          $rootScope.safeApply();
          return;
        }
        let groupedData = CommonFunctions.groupBy(result.data.d.Data, 'ContestType2');
        groupedData = Object.keys(groupedData).map((key) => [groupedData[key]]);
        groupedData.forEach(dataSet => {
          const sport = dataSet[0];
          positionByGame = GroupPositionInfo(sport);
          var selectedSport = {
            ContestType: sport[0].ContestType,
            ContestType2: sport[0].ContestType2,
            ContestType3: sport[0].ContestType3,
            WeekNumber: weekNumber,
            PositionByGame: positionByGame
          };
          $scope.SelectedSports.push(selectedSport);
        });
        displayTooltips();
        $scope.loadindingInfo = false;
        $rootScope.safeApply();
      });
    }

    $scope.GameIsOver = function (dateTime) {
      return (new Date(dateTime)).getTime() < ($agentService.GetServerDateTime()).getTime();
    }

    $scope.LoadGamePeriodInfoFromSport = LoadGamePeriodInfoFromSport;

    $scope.FilterGames = function (game) {
      return validateContestDate(game);
    }

    function validateContestDate(game) {
      return true;
      let filterDate = $agentService.GetServerDateTime();
      var filterDateOption = $scope.SelectedDateFilterOption;
      var contestDate;
      let teamData = null;
      if (!game.IsTitle)
        teamData = game.ContestantData.straightsData.moneyData;
      if (teamData)
        contestDate = (new Date(teamData.ContestDateTimeString)).toDateString();
      else if (game.ContestDateTimeString)
        contestDate = (new Date(game.ContestDateTimeString)).toDateString();
      else if (game.ContestDateTimeString)
        contestDate = (new Date(game.ContestDateTimeString)).toDateString();

      if (filterDateOption == "Yesterday") filterDate.setDate(filterDate.getDate() - 1);
      if (!filterDateOption) return (new Date(contestDate)) > filterDate;
      filterDate = filterDate.toDateString();
      return filterDate == contestDate;

    }

    $scope.FilterLeagues = function (league) {
      return (league.PositionByGame ? league.PositionByGame.some(x => $scope.FilterGames(x, null)) : false);
    }

    $scope.GetWeekNumberInt = function (weekNumberObj) {
      return weekNumberObj.Index;
    };

    var GroupPositionInfo = function (list) {
      if (!list || list.length == 0) return null;
      var result = new Array();
      var gameObj = { ContestantData: {}, Team2Data: {}, IsTitle: false, DrawData: null };
      var holdContestantNum = list[0].ContestantNum;
      var holdContestDate = new Date(list[0].ContestDateTimeString).toDateString();

      for (var j = 0; j < list.length; j++) {        
        var date = new Date(list[j].ContestDateTimeString).toDateString();
        if (holdContestantNum != list[j].ContestantNum) {
          result.push(gameObj);
          gameObj = { ContestantData: {}, Team2Data: {}, IsTitle: false, DrawData: null };
        }
        if ((j == 0 || holdContestDate != date)) {
          var contestDateObj = { ContestDateTimeString: list[j].ContestDateTimeString, IsTitle: true, ContestantData: null, Team2Data: null, DrawData: null };
          result.push(contestDateObj);
        }
        gameObj.ContestantNum = list[j].ContestantNum;
        gameObj.FinishedGame = list[j].FinishedContest;
        gameObj.ContestDateTimeString = list[j].ContestDateTimeString;

        gameObj.ContestantData.straightsData = gameObj.ContestantData.straightsData ? gameObj.ContestantData.straightsData : {};
        gameObj.ContestantData.ContestantName = list[j].ContestantName.trim();
        gameObj.ContestantData.RotNum = list[j].RotNum;
        gameObj.ContestantData.straightsData.moneyData = list[j];

        holdContestDate = date;
        holdContestantNum = list[j].ContestantNum;
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

    $scope.GetContestActionByLine = function (contestantNum, contestantName) {
      $agentService.GetOpenContestByLine(contestantNum, contestantName).then(function (result) {
        $scope.dataSource = result.data.d.Data;
      });
    };

    jQuery('#ModalAgentPos').on('hidden.bs.modal', function () {
      $scope.dataSource = [];
    })

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
        if (typeof (unique[list[i].ContestType]) == "undefined") {
          var List = new Array();
          for (var j = 0; j < list.length; j++) {
            if (list[j].ContestType == list[i].ContestType) {
              List.push(list[j]);
            }
          }
          var distinctSubSports = $scope.DistinctSubSports(List);
          var groupedSportsInfo = { ContestType: list[i].ContestType, SubSportsList: distinctSubSports, ObjectList: List };
          distinctActiveSports.push(groupedSportsInfo);
        }
        unique[list[i].ContestType] = "";
      }
      return distinctActiveSports;
    };

    $scope.DistinctSubSports = function (list) {
      var unique = {};
      var distinctSubSports = [];
      for (var i in list) {
        if (typeof (unique[list[i].ContestType2]) == "undefined") {
          var sportSubType = { ContestType2: list[i].ContestType2 };
          distinctSubSports.push(sportSubType);
        }
        unique[list[i].ContestType2] = "";
      }
      return distinctSubSports;
    };

    $scope.DisplayTeam = function (gameInfo) {
      if (!gameInfo) return;
      return String(gameInfo.RotNum) + ' - ' + $scope.Translate(gameInfo.ContestantName);
    };


    $scope.CalculateVolume = function (gameInfo) {
      if (!gameInfo) return;
      var volume = 0.0;
      volume = gameInfo.moneyData ? gameInfo.moneyData.Wagered : 0;     
      return $scope.FormatMyNumber(volume, false, true);
    };

    $scope.Init();
  }
]);