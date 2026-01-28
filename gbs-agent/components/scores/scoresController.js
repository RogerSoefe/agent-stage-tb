appModule.controller("scoresController", [
  '$scope', '$agentService', '$compile', '$rootScope', function ($scope, $agentService, $compile, $rootScope) {

    $scope.host = SETTINGS.MainSite;

    let interval = null;
    let savedClicks = [];
    $scope.reportFilters = { showFinals: 'false' };
    $scope.scoresByLeague = [];
    $scope.Init = function () {
      $scope.WeeksRange = [{ DateRange: $scope.Translate('Today'), Index: -1 }, ...$agentService.GetWeeksRange()];
      $scope.reportFilters.weekNumber = $scope.WeeksRange[0];
      if ($rootScope.selectedAgent) {
        $scope.getData();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.getData();
        });
      }
    };

    $scope.getData = function () {
      $agentService.GetScores(moment().format("YYYYMMDD HH:mm:ss"), $scope.reportFilters.weekNumber.Index, $scope.reportFilters.showFinals).then(function (response) {
        fixData(response);
        if (interval) clearInterval(interval);
        if ($scope.reportFilters.weekNumber.Index < 0) {
          interval = setInterval(function () {
            $agentService.GetScores(moment().format("YYYYMMDD HH:mm:ss"), $scope.reportFilters.weekNumber.Index, $scope.reportFilters.showFinals).then(function (response) {
              fixData(response);
            });
          }, 30000);
        }
      });

    }

    function fixData(response) {
      let uniqueData = [...new Map(response.data.d.Data.map(item => [item['EventID'], item])).values()];
      let rawData = groupBy(uniqueData, 'SportSubType');
      $scope.scoresByLeague = Object.keys(rawData).map((key) => rawData[key]);
      $scope.sportList = [{ bindName: $scope.Translate('All'), realName: 'All' }];
      Object.getOwnPropertyNames(rawData).forEach(function (val, idx, array) {
        $scope.sportList.push({ bindName: val.trim(), realName: val });
      });
      $scope.reportFilters.sportType = !$scope.reportFilters.sportType ? $scope.sportList[0] :
        $scope.sportList.find(x => x.realName == $scope.reportFilters.sportType.realName);

    };

    $scope.filterScores = function (league) {
      return league[0].SportSubType == $scope.reportFilters.sportType.realName || $scope.reportFilters.sportType.realName == 'All'
    }

    const groupBy = function (xs, key) {
      return xs.reduce(function (rv, x) {
        x.Team1LogoUrl = x.Team1LogoUrl == null ? $scope.host + '/sports/assets_core/sport_types/' + x.SportType.trim() + '.svg' : $scope.host + '/sports/assets_core/sport_types/' + x.Team1LogoUrl + '.png';
        x.Team2LogoUrl = x.Team2LogoUrl == null ? $scope.host + '/sports/assets_core/sport_types/' + x.SportType.trim() + '.svg' : $scope.host + '/sports/assets_core/sport_types/' + x.Team2LogoUrl + '.png';
        (rv[x[key]] = rv[x[key]] || []).push(x);
        return rv;
      }, {});
    };

    $scope.isClicked = function (subSport) {
      return savedClicks.findIndex(x => x == subSport) >= 0;
		}

    $scope.toogleClick = function (subSport) {
      let index = savedClicks.findIndex(x => x == subSport);
      if (index >= 0) savedClicks.splice(index, 1);
      else savedClicks.push(subSport);
    }

    $scope.Init();

    $scope.$on('$locationChangeStart', function () {
      if (interval) clearInterval(interval);
    });
  }
]);

