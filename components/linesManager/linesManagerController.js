appModule.controller("linesManagerController", ['$scope', '$agentService', '$rootScope', '$translatorService', function ($scope, $agentService, $rootScope, $translatorService) {

  _priceOffering = [];

  $scope.Selections = {
    ContestType: null,
    ContestType2: null,
    ContestType3: null,
    ContestDesc: null,
    SportType: null,
    SportSubType: null
  };

  function Init() {
    $scope.ToggleLinesTab();
  }

  $scope.ToggleLinesTab = function (tab) {
    $scope.SelectedTab = $scope.SelectedTab != 1 ? 1 : 2;
    if ($scope.SelectedTab == 1) {
      $scope.ContestInfo = [];
      SportsView();
    }
    else {
      $scope.GamesInfo = [];
      ContestView();
    }
  };

  function SportsView() {
    $scope.CurrentView = appModule.Root + "/app/components/linesManager/gamesView.html";
    GetSports();
  }

  function ContestView() {
    $scope.CurrentView = appModule.Root + "/app/components/linesManager/contestsView.html";
    GetContests();
  }

  function GetSports() {
    if ($scope.Sports) return;
    $agentService.GetSportTypesList().then(function (response) {
      let savedSports = $scope.getSessionData('savedSports') ? $scope.getSessionData('savedSports') :
        [{ SportType: 'Football', order: 1, SportSubTypes: [] }, { SportType: 'Basketball', order: 2, SportSubTypes: [] }, { SportType: 'Baseball', order: 3, SportSubTypes: [] }, { SportType: 'Hockey ', order: 4, SportSubTypes: [] }]
      let groupedSports = GroupSports(response.data.d.Data);
      if (savedSports) {
        groupedSports.forEach(function (gs) {
          gs.order = 99;
          let findIndex;
          switch (gs.SportType) {
            case 'Hockey':
              findIndex = gs.SportSubTypes.findIndex(x => x.SportSubType == 'NHL');
              if (findIndex >= 0) gs.SportSubTypes[findIndex].order = 1;
              break;
            case 'Basketball':
              findIndex = gs.SportSubTypes.findIndex(x => x.SportSubType == 'NBA');
              if (findIndex >= 0) gs.SportSubTypes[findIndex].order = 1;
              break;
            case 'Baseball':
              findIndex = gs.SportSubTypes.findIndex(x => x.SportSubType == 'MLB');
              if (findIndex >= 0) gs.SportSubTypes[findIndex].order = 1;
              break;
            case 'Football':
              findIndex = gs.SportSubTypes.findIndex(x => x.SportSubType == 'NFL');
              if (findIndex >= 0) gs.SportSubTypes[findIndex].order = 1;
              break;
          }
          savedSports.forEach(function (ss) {
            if (ss.SportType.trim() == gs.SportType.trim()) {
              gs.order = ss.order;
              gs.SportSubTypes = ss.SportSubTypes.length > 0 ? ss.SportSubTypes : gs.SportSubTypes;
            }
          })
          gs.SportSubTypes = sortArray(gs.SportSubTypes);
        })
      }
      $scope.Sports = sortArray(groupedSports);
      $scope.leagueFilter = "";
      $scope.Selections.SportType = $scope.Sports[0];
      $scope.SortingSelectedSport = $scope.Sports[0];
      $scope.Selections.SportSubType = $scope.Selections.SportType.SportSubTypes[0];
      if (!$scope.GamesInfo) $scope.GetSportGameLines(true);
    });
  }

  function GetContests() {
    if ($scope.Contests) return;
    $agentService.GetContestsList().then(function (response) {
      $scope.Contests = GroupContest(response.data.d.Data);
      $scope.Selections.ContestType = $scope.Contests[0];
      if ($scope.Contests.length && $scope.Contests[0].ContestTypes2.length) {
        $scope.Selections.ContestType2 = $scope.Contests[0].ContestTypes2[0];
        if ($scope.Contests[0].ContestTypes2[0].ContestTypes3.length) {
          $scope.Selections.ContestType3 = $scope.Contests[0].ContestTypes2[0].ContestTypes3[0];
        }
        else
          $scope.Selections.ContestType3 = null;
      }
      else {
        $scope.Selections.ContestType2 = null;
        $scope.Selections.ContestType3 = null;
      }
      $scope.GetContestLines(3);
    });
  }

  function fillContestDescs() {
    var contestDescs = [];
    var contestType = $scope.Selections.ContestType.ContestType || null;
    var contestType2 = $scope.Selections.ContestType2.ContestType2 || null;
    var contestType3 = $scope.Selections.ContestType3 ? $scope.Selections.ContestType3.ContestType3 : null;
    if ($scope.Selections.ContestType3 && $scope.Selections.ContestType3.ContestDescs.length) {
      for (var i = 0; i < $scope.Selections.ContestType3.ContestDescs.length; i++) {
        contestDescs.push({
          ContestType: contestType,
          ContestType2: contestType2,
          ContestType3: contestType3,
          ContestDesc: $scope.Selections.ContestType3.ContestDescs[i]
        });
      }
    }
    else if ($scope.Selections.ContestType2 && $scope.Selections.ContestType2.ContestDescs.length) {
      for (var i = 0; i < $scope.Selections.ContestType2.ContestDescs.length; i++) {
        contestDescs.push({
          ContestType: contestType,
          ContestType2: contestType2,
          ContestType3: contestType3,
          ContestDesc: $scope.Selections.ContestType2.ContestDescs[i]
        });
      }
    }
    else if ($scope.Selections.ContestType && $scope.Selections.ContestType.ContestDescs.length) {
      for (var i = 0; i < $scope.Selections.ContestType.ContestDescs.length; i++) {
        contestDescs.push({
          ContestType: contestType,
          ContestType2: contestType2,
          ContestType3: contestType3,
          ContestDesc: $scope.Selections.ContestType.ContestDescs[i]
        });
      }
    }
    $scope.Selections.ContestDesc = contestDescs && contestDescs.length ? contestDescs[0] : null;
    $scope.ContestDescs = contestDescs;
  }

  function sortArray(array) {
    return array.sort(function (a, b) {
      if (a.order > b.order) {
        return 1;
      }
      if (a.order < b.order) {
        return -1;
      }
      // a must be equal to b
      return 0;
    })
  }

  function GroupSports(sports) {
    if (!sports || sports.length == 0) return;
    var groupedSports = [];
    var holdSport = "";
    for (var i = 0; i < sports.length; i++) {
      var sport = sports[i];
      if (sport.SportType != holdSport) {
        groupedSports.push({ SportType: sport.SportType, SportSubTypes: [] });
      }
      groupedSports[groupedSports.length - 1].SportSubTypes.push({ SportSubType: sport.SportSubType, order: 99 });
      holdSport = sport.SportType;
    }
    return groupedSports;

  }

  function getSportPeriods(sportType) {

    var periods = [{ PeriodDescription: "Game", PeriodNumber: 0 }];

    if (["Football", "Basketball", "Soccer", "Soccer A", "Soccer B", "Soccer C"].includes(sportType)) {
      periods.push({ PeriodDescription: "1st Half", PeriodNumber: 1 });
      periods.push({ PeriodDescription: "2nd Half", PeriodNumber: 2 });
    }

    if (["Football", "Basketball"].includes(sportType)) {
      periods.push({ PeriodDescription: "1st Quarter", PeriodNumber: 3 });
      periods.push({ PeriodDescription: "2nd Quarter", PeriodNumber: 4 });
      periods.push({ PeriodDescription: "3rd Quarter", PeriodNumber: 5 });
      periods.push({ PeriodDescription: "4th Quarter", PeriodNumber: 6 });
    }


    if (sportType == "Baseball") {
      periods.push({ PeriodDescription: "1st 5 Innings", PeriodNumber: 1 });
      periods.push({ PeriodDescription: "Last 4 Innings", PeriodNumber: 2 });
    }
    if (sportType == "Hockey") {
      periods.push({ PeriodDescription: "1st Period", PeriodNumber: 1 });
      periods.push({ PeriodDescription: "2nd Period", PeriodNumber: 2 });
      periods.push({ PeriodDescription: "3rd Period", PeriodNumber: 3 });
    }

    return periods;

  }

  function onPriceChange(line, wagerType, teamIdx) {
    var adj = 0;
    var dog = 0;
    if (wagerType == "S")
      adj = teamIdx == 1 ? line.SpreadAdj1 : line.SpreadAdj2;
    else if (wagerType == "M")
      adj = teamIdx == 1 ? line.MoneyLine1 : line.MoneyLine2;
    else if (wagerType == "L")
      adj = teamIdx == 1 ? line.TtlPtsAdj1 : line.TtlPtsAdj2;
    else {
      if (teamIdx == 1) adj = line.Team1TtlPtsAdj1;
      else if (teamIdx == 2) adj = line.Team2TtlPtsAdj1;
      else if (teamIdx == 3) adj = line.Team1TtlPtsAdj2;
      else adj = line.Team2TtlPtsAdj2;
    }

    if (adj == '-' || adj == '+' || Math.abs(adj) < 100 || adj > 0) return;

    dog = calculateUnderDog(adj, wagerType);
    if (dog > 0) dog = '+' + dog;

    if (wagerType == "S") {
      if (teamIdx == 1) line.SpreadAdj2 = dog;
      else line.SpreadAdj1 = dog;
    }
    else if (wagerType == "M") {
      if (teamIdx == 1) line.MoneyLine2 = dog;
      else line.MoneyLine1 = dog;
    }
    else if (wagerType == "L") {
      if (teamIdx == 1) line.TtlPtsAdj2 = dog;
      else line.TtlPtsAdj1 = dog;
    }
    else {
      if (teamIdx == 1) line.Team1TtlPtsAdj2 = dog;
      else if (teamIdx == 2) line.Team2TtlPtsAdj2 = dog;
      else if (teamIdx == 3) line.Team1TtlPtsAdj1 = dog;
      else line.Team2TtlPtsAdj1 = dog;
    }
  }

  function calculateUnderDog(adj, wagerType) {
    var centsDiff = getLineCents(adj, wagerType);
    var newAdj = 0;
    if (isNaN(adj)) return '';
    adj = parseInt(adj);
    if (!(adj < 0)) return newAdj;
    var flatAdj = Math.round(100 + (centsDiff / 2)) * -1;
    var fullLine = (100 + centsDiff) * -1;

    if (adj > flatAdj) {
      newAdj = 0;
    } else {
      if (adj == flatAdj) {
        newAdj = flatAdj;
      } else if (adj == fullLine) {
        newAdj = 100;
      } else if (adj > fullLine) {
        newAdj = (100 + Math.abs(fullLine) - Math.abs(adj)) * -1;
      } else {
        newAdj = 100 + (Math.abs(adj) - Math.abs(fullLine));
      }
    }
    return newAdj;
  }

  function getLineCents(adj, wagerType) {
    for (var i = 0; i < _priceOffering.length; i++) {
      if (wagerType == _priceOffering[i].WagerType && (Math.abs(adj)) >= (Math.abs(_priceOffering[i].StartingPrice)) && (Math.abs(adj)) <= (Math.abs(_priceOffering[i].EndingPrice))) {
        return _priceOffering[i].CentsDifference;
      }
    }
  }

  function validatePoints(num) {
    var dataToCompare = Math.abs(Math.floor(num));
    var dataToCompare2 = Math.abs(dataToCompare) - Math.abs(num);
    return (Math.abs(dataToCompare2) == 0 || Math.abs(dataToCompare2) == 0.25 || Math.abs(dataToCompare2) == 0.5 || Math.abs(dataToCompare2) == 0.75);
  }

  function wagerTypeName(wagerType) {
    switch (wagerType) {
      case "S": return "Spread";
      case "M": return "Money Line";
      case "L": return "Total";
      case "E": return "Team Total";
    }
    return "line";
  }

  function GetDBFollowedBooksBySport(sportType, sportSubType, periodNumber) {
    if (!$scope.GamesInfo) return;
    $agentService.GetDBFollowedBooksBySport(sportType, sportSubType, periodNumber).then(function (result) {
      var booksByGame = result.data.d.Data;
      for (var i = 0; i < $scope.GamesInfo.length; i++) {
        var gameInfo = $scope.GamesInfo[i];
        gameInfo.BooksToFollow = [];
        for (var j = 0; j < booksByGame.length; j++) {
          var book = booksByGame[j];
          if (gameInfo.GameNum == book.GameNum)
            gameInfo.BooksToFollow.push(book);
        }
      }
    });

  }

  // Contest private Functions

  function GroupContest(contests) {
    if (!contests || contests.length == 0) return;
    var groupedContests = [];
    var holdContestType = "", holdContestType2 = "", holdContestType3 = "", holdContestDesc = "", contest = null;
    for (var i = 0; i < contests.length; i++) {
      contest = contests[i];
      contestDescAdded = false;
      if (holdContestType != contest.ContestType) {
        groupedContests.push({ ContestType: contest.ContestType, ContestTypes2: [], ContestDescs: [] });
      }
      if (holdContestType2 != contest.ContestType2 && contest.ContestType2 != ".") {
        groupedContests[groupedContests.length - 1].ContestTypes2.push({ ContestType2: contest.ContestType2, ContestTypes3: [], ContestDescs: [] });
      }
      if (holdContestType3 != contest.ContestType3 && contest.ContestType3 != ".") {
        groupedContests[groupedContests.length - 1].ContestTypes2[groupedContests[groupedContests.length - 1].ContestTypes2.length - 1].ContestTypes3.push({ ContestType3: contest.ContestType3, ContestDescs: [] });
      }

      if (contest.ContestType2 == ".") {
        groupedContests.ContestDescs.push(contest.ContestDesc);
      } else if (contest.ContestType3 == ".") {
        groupedContests[groupedContests.length - 1].ContestTypes2[groupedContests[groupedContests.length - 1].ContestTypes2.length - 1].ContestDescs.push(contest.ContestDesc);
      } else {
        groupedContests[groupedContests.length - 1].ContestTypes2[groupedContests[groupedContests.length - 1].ContestTypes2.length - 1].ContestTypes3[groupedContests[groupedContests.length - 1].ContestTypes2[groupedContests[groupedContests.length - 1].ContestTypes2.length - 1].ContestTypes3.length - 1].ContestDescs.push(contest.ContestDesc);
      }

      holdContestType = contest.ContestType;
      holdContestType2 = contest.ContestType2;
      holdContestType3 = contest.ContestType3;
    }
    return groupedContests;
  }

  function contestLineHasError(contestLine) {
    var odds = (contestLine.MoneyLine || "").replace("+", "");
    return odds == "" || isNaN(odds);
  }

  //Games Scope Functions

  $scope.OnLineChange = function (line, wagerType, linePart, teamIdx) {

    if (linePart == 'Adj') {
      if (teamIdx < 3 || wagerType == "E") onPriceChange(line, wagerType, teamIdx);
    }
    else if (wagerType == "S") {
      if (teamIdx == 1) {
        if (isNaN(line.Spread1) || !line.Spread1) {
          if (line.Spread1 != '-' && line.Spread1 != '+' && line.Spread1 != '.') line.Spread1 = line.Spread2 = '';
          return;
        }
        if (parseInt(line.Spread1) > 0) line.Spread1 *= -1;
        line.Spread2 = '+' + (line.Spread1 * -1);
      }
      else if (teamIdx == 2) {
        if (isNaN(line.Spread2) || !line.Spread2) {
          if (line.Spread2 != '-' && line.Spread2 != '+' && line.Spread2 != '.') line.Spread1 = line.Spread2 = '';
          return;
        }
        if (parseInt(line.Spread2) > 0) line.Spread2 *= -1;
        line.Spread1 = '+' + (line.Spread2 * -1);
      }
    }

    line.Changed = true;
  };

  $scope.clearSpread = function (line, moneyline) {
    if (moneyline == 1 && line.SpreadAdj1 == '' && line.SpreadAdj2 == '') {
      line.Spread1 = '';
      line.Spread2 = '';
    }
  };

  $scope.clearTotal = function (line, moneyline) {
    if (moneyline == 3 && line.TtlPtsAdj1 == '' && line.TtlPtsAdj2 == '') {
      line.TotalPoints = '';
    }
  };

  $scope.BooksToFollowChange = function (line) {

    line.Changed = true;
  };

  $scope.GetSportGameLines = function (sportChanged = false) {
    if ($agentService.AgentInfo == null || $scope.Selections.SportType == null) return;
    var periodNumber = !sportChanged && $scope.Selections.Period && $scope.Selections.Period.PeriodNumber >= 0 ? $scope.Selections.Period.PeriodNumber : 0;
    $agentService.GetSportGameLinesAndPriceOffering($agentService.AgentInfo.AgentID.trim(), $scope.Selections.SportType.SportType, $scope.Selections.SportSubType.SportSubType, periodNumber).then(function (result) {
      $scope.GamesInfo = result.data.d.Data.SportGameLines;
      _priceOffering = result.data.d.Data.SportPriceOffering;
      GetDBFollowedBooksBySport($scope.Selections.SportType.SportType, $scope.Selections.SportSubType.SportSubType, periodNumber);
      if (sportChanged) {
        $scope.Periods = getSportPeriods($scope.Selections.SportType.SportType);
        $scope.Selections.Period = $scope.Periods[0];
      }
    });
  };

  $scope.SaveGamesAndContestsLines = function () {
    $scope.SaveGameLines();
    $scope.SaveContestLines();
  };

  $scope.SaveGameLines = function () {
    for (var i = 0; i < $scope.GamesInfo.length; i++) {
      var gameline = $scope.GamesInfo[i];
      if (gameline.Changed) {
        var msg = "";
        var errorValidation = lineHasError(gameline);
        switch (errorValidation) {
          case "E":
            msg = $scope.Translate("Please complete Team Totals");
            break;
          case "T":
            msg = $scope.Translate("Please complete Total Points");
            break;
          case "S":
            msg = $scope.Translate("Check the Spread");
            break;
          case "E1":
            msg = $scope.Translate("Check the Team 1 Total");
            break;
          case "E2":
            msg = $scope.Translate("Check the Team 2 Total");
            break;
        }

        if (msg != "") {

          UI.Alert(
            "",
            msg + (i + 1),
            ""
          );
        } else {
          $agentService.SaveGameLine(gameline, $agentService.AgentInfo.AgentID).then();
          gameline.Changed = false;
          gameline.CustProfile = $agentService.AgentInfo.AgentID;
        }
      }
    }
  };

  $scope.LineIsActive = function (gf) {
    //const gameDateTime = new Date(gf.GameDateTimeString);
    const periodCutoff = new Date(gf.PeriodWagerCutoff);
    const now = $agentService.GetServerDateTime();
    return periodCutoff < now;
  };

  function lineHasError(gameline) {
    if (
      (gameline.SpreadAdj1 && gameline.SpreadAdj2 == '') || (gameline.SpreadAdj1 == '' && gameline.SpreadAdj2) ||
      (gameline.TtlPtsAdj1 && gameline.TtlPtsAdj2 == '') || (gameline.TtlPtsAdj1 == '' && gameline.TtlPtsAdj2) ||
      (gameline.MoneyLine1 && gameline.MoneyLine2 == '') || (gameline.MoneyLine1 == '' && gameline.MoneyLine2) ||
      (gameline.Team1TtlPtsAdj1 && gameline.Team1TtlPtsAdj2 == '') || (gameline.Team1TtlPtsAdj1 == '' && gameline.Team1TtlPtsAdj2) ||
      (gameline.Team2TtlPtsAdj1 && gameline.Team2TtlPtsAdj2 == '') || (gameline.Team2TtlPtsAdj1 == '' && gameline.Team2TtlPtsAdj2)
    ) {
      return "E";
    }

    else if (!validatePoints(gameline.Spread1)) return "S";
    else if (!validatePoints(gameline.TotalPoints)) return "T";
    else if (!validatePoints(gameline.Team1TotalPoints)) return "E1";
    else if (!validatePoints(gameline.Team2TotalPoints)) return "E2";
    return "";
  };

  $scope.DeleteAgentLines = function (gameOrContestLine) {
    if ($scope.ContestInfo.length > 0) {
      $scope.DeleteAgentContestLines(gameOrContestLine);
    }
    else {
      $scope.DeleteAgentGameLines(gameOrContestLine);
    }
  };

  $scope.DeleteAgentGameLines = function (gameLine) {
    var msg = "Proceed removing " + (gameLine != null ? gameLine.Team1RotNum + " game" : "current sport") + " shades?";
    var fncOk = function () {
      var gameNum = gameLine != null ? gameLine.GameNum : null;
      var periodNumber = gameLine != null ? gameLine.PeriodNumber : $scope.Selections.Period.PeriodNumber;
      var store = gameLine ? gameLine.Store : ($scope.GamesInfo[0].Store || null);
      var custProfile = $agentService.AgentInfo.AgentID.trim();
      var sportType = $scope.Selections.SportType.SportType;
      var sportSubType = $scope.Selections.SportSubType.SportSubType;
      $agentService.DeleteAgentGameLine(gameNum, periodNumber, store, custProfile, sportType, sportSubType).then(function () {
        $scope.GetSportGameLines(false);
      });
    };
    UI.Confirm(msg, fncOk, null, "Confirmation");
  };

  $scope.ClearShadeLines = function (wagerType, gameLine) {
    var msg = "Proceed removing " + (gameLine != null ? gameLine.Team1RotNum + " game" : "current sport") + " " + wagerTypeName(wagerType) + "s?";
    var fncOk = function () {
      var store = gameLine ? gameLine.Store : ($scope.GamesInfo[0].Store || null);
      var custProfile = $agentService.AgentInfo.AgentID.trim();
      var gameNum = gameLine ? gameLine.GameNum : null;
      var sportType = $scope.Selections.SportType.SportType;
      var sportSubType = $scope.Selections.SportSubType.SportSubType;
      $agentService.RemoveShadeGameLines(store, custProfile, $scope.Selections.Period.PeriodNumber, gameNum, sportType, sportSubType, wagerType).then(function () {
        $scope.GetSportGameLines();
      });
    };
    UI.Confirm(msg, fncOk, null, "Confirmation");
  };

  $scope.ClearShadeLinesBtnVisible = function (gf) {
    return (gf.SpreadAdj1 && gf.SpreadAdj2) || (gf.MoneyLine1 && gf.MoneyLine2) || (gf.TtlPtsAdj1 && gf.TtlPtsAdj2) || (gf.Team1TtlPtsAdj1 && gf.Team1TtlPtsAdj2) || (gf.Team2TtlPtsAdj1 && gf.Team2TtlPtsAdj2);
  };

  $rootScope.$on('AgentInfoLoaded', function () {
    if (!$scope.GamesInfo) $scope.GetSportGameLines(true);
  });

  $scope.ChangeLineLinkedToStoreFlag = function (gameLine) {
    $agentService.ChangeLineLinkedToStoreFlag(gameLine).then(function () {
      $scope.GetSportGameLines(false);
    });
  };

  $scope.ShowEditDialog = function () {
    document.getElementById("page-content-wrapper").classList.add('no-printable');
    jQuery.noConflict();
    (function ($) {
      $('#editDialog').modal({
        backdrop: 'static',
        keyboard: false
      }).removeData("modal").modal({ backdrop: 'static', keyboard: false });
    })(jQuery);
  };

  $scope.saveOrder = function () {
    $scope.addSessionData('savedSports', $scope.Sports);
    $scope.Sports.forEach(function (gs) {
      gs.SportSubTypes = sortArray(gs.SportSubTypes);
    })
    $scope.Sports = sortArray($scope.Sports);
    $scope.fireSwal($scope.Translate('Success'), $scope.Translate('Order Saved'));
  };

  //Contests Scope Functions

  $scope.DeleteAgentContestLines = function (contestLine) {
    var msg = "Proceed removing " + (contestLine != null ? contestLine.RotNum + " Contestant" : "current contest") + " shades?";
    var fncOk = function () {
      var contestNum = contestLine != null ? contestLine.ContestNum : null;
      var contestantNum = contestLine != null ? contestLine.ContestantNum : null;
      var store = contestLine ? contestLine.Store : ($scope.ContestInfo[0].Store || null);
      var custProfile = $agentService.AgentInfo.AgentID.trim();
      $agentService.DeleteAgentContestLine(contestNum, contestantNum, store, custProfile).then(function () {
        $scope.GetContestLines(3);
      });
    };
    UI.Confirm(msg, fncOk, null, "Confirmation");
  };

  $scope.ClearContestShadeLines = function (contestLine, contestNum) {
    var msg = "Proceed removing " + (contestLine != null ? contestLine.RotNum + " contest" : "current sport") + "?";
    var fncOk = function () {
      var store = contestLine ? contestLine.Store : ($scope.ContestInfo[0].Store || null);
      var custProfile = $agentService.AgentInfo.AgentID.trim();
      var contestantNum = contestLine ? contestLine.ContestantNum : null;
      var contestNum = contestLine ? contestLine.ContestNum : $scope.ContestInfo[0].ContestNum;
      $agentService.RemoveShadeContestLines(store, custProfile, contestNum, contestantNum).then(function () {
        $scope.GetContestLines(3);
      });
    };
    UI.Confirm(msg, fncOk, null, "Confirmation");
  };

  $scope.ClearContestShadeLinesBtnVisible = function (gf) {
    return gf.MoneyLine;
  };

  $scope.SaveContestLines = function () {
    for (var i = 0; i < $scope.ContestInfo.length; i++) {
      var contestline = $scope.ContestInfo[i];
      if (contestline.Changed) {
        var msg = contestLineHasError(contestline) ? "incorrect Contest Price" : "";
        if (msg != "") {
          UI.Alert("", msg + (i + 1), "");
        } else {
          $agentService.SaveContestLine(contestline, $agentService.AgentInfo.AgentID).then();
          contestline.Changed = false;
          contestline.CustProfile = $agentService.AgentInfo.AgentID;
        }
      }
    }
  };

  $scope.ContestLineIsActive = function (gf) {
    const periodCutoff = new Date(gf.WagerCutoff);
    const now = $agentService.GetServerDateTime();
    return periodCutoff < now;
  };

  $scope.OnContestLineChange = function (line) {
    line.Changed = true;
  };

  $scope.GetContestLines = function (changedLevel = 0) {
    if (changedLevel < 3 || !$scope.Selections.ContestDesc) fillContestDescs();
    if (!$scope.Selections.ContestDesc) return;
    var data = {
      contestType: $scope.Selections.ContestType.ContestType,
      contestType2: $scope.Selections.ContestType2.ContestType2,
      contestType3: $scope.Selections.ContestType3 == null ? '.' : $scope.Selections.ContestType3.ContestType3,
      contestDesc: $scope.Selections.ContestDesc.ContestDesc
    };
    $agentService.GetContestLines(data).then(function (result) {
      $scope.ContestInfo = result.data.d.Data;
    });
    $rootScope.safeApply();
  };

  $scope.ChangeContestLineLinkedToStoreFlag = function (contestLine) {
    $agentService.ChangeContestLineLinkedToStoreFlag(contestLine).then(function () {
      $scope.GetContestLines(3);
    });
  };

  Init();

}]);