appModule.controller("customerPerformanceController", [
  '$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', '$timeout', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder, $timeout) {
    let tableData = [];

    let _allOptionsSelected = false, dateRange;
    $scope.AllOptionsSelected = _allOptionsSelected;

    $scope.Filters = {
      Sports: [],
      Periods: [],
      WagerTypes: [],
      WagersWithSameLeagueOnly: false,
      ParlaySports: [],
      TeaserSports: [],
      StraightSports: [],
      ReverseSports: []
    };

    async function Init() {
      if ($rootScope.selectedAgent) {
        $scope.WeeksRange = $agentService.GetWeeksRange();
        $scope.selectedWeek = $scope.WeeksRange[0];
        startDateRangePicker()
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.selectedWeek = $scope.WeeksRange[0];
          $scope.selectedAgent = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
          startDateRangePicker()
        });
      }

    };

    function startDateRangePicker() {
      function cb(start, end) {
        currentPage = 0;
        globalStart = start.format('MM/DD/YYYY'); globalEnd = end.format('MM/DD/YYYY');
        dateRange = { startDate: start.format('MM/DD/YYYY'), endDate: end.format('MM/DD/YYYY') }
        $scope.getData();
        jQuery('#reportrange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
        start.format('MMMM D, YYYY');
      }
      cb(moment().subtract(6, 'days'), moment());
      jQuery('#reportrange').daterangepicker({
        locale: {
          firstDay: 1
        },
        startDate: moment().subtract(6, 'days'),
        ranges: {
          'Today': [moment(), moment()],
          'Yesterday': [moment().subtract(1, 'days'), moment()],
          'Last 7 Days': [moment().subtract(6, 'days'), moment()],
          'Last 30 Days': [moment().subtract(29, 'days'), moment()],
          'Last 90 Days': [moment().subtract(89, 'days'), moment()],
        }
      }, cb);
    }

    var _wagerTypes = [
      {
        Name: "All",
        Code: "All",
        Selected: _allOptionsSelected,
        Index: 0
      }, {
        Name: "Spread",
        Code: "S",
        Selected: _allOptionsSelected,
        Index: 1
      }, {
        Name: "Money Line",
        Code: "M",
        Selected: _allOptionsSelected,
        Index: 2
      }, {
        Name: "Total Points",
        Code: "L",
        Selected: _allOptionsSelected,
        Index: 3
      }, {
        Name: "Team Totals",
        Code: "E",
        Selected: _allOptionsSelected,
        Index: 4
      }, {
        Name: "Parlay",
        Code: "P",
        Selected: _allOptionsSelected,
        Index: 5
      }, {
        Name: "Teaser",
        Code: "T",
        Selected: _allOptionsSelected,
        Index: 6
      }, {
        Name: "If Bet",
        Code: "I",
        Selected: _allOptionsSelected,
        ArLink: false,
        Index: 7
      }, {
        Name: "Action Reverse",
        Code: "I",
        Selected: _allOptionsSelected,
        ArLink: true,
        Index: 8
      }, {
        Name: "Contest",
        Code: "C",
        Selected: _allOptionsSelected,
        Index: 9
      }, {
        Name: "Manual Play",
        Code: "A",
        Selected: _allOptionsSelected,
        Index: 10
      }, {
        Name: "Horses",
        Code: "G",
        Selected: _allOptionsSelected,
        Index: 11
      }
    ];

    $scope.betTypeList = [{ name: $scope.Translate('Wager'), code: 0 }, { name: $scope.Translate('Future'), code: 1 }];
    $scope.SelectedBetType = $scope.betTypeList[0];

    function setFiltersInfo(data) {
      var sports = [];
      var periods = [];
      var wagerTypes = [];
      var customers = [];
      var parlaySports = [];
      var teaserSports = [];
      var straightSports = [];
      var reverseSports = [];
      var d, s, p, wt, c, ps, ts;
      for (var i = 0; i < data.length; i++) {
        d = data[i];
        if (!d.SportType || !d.SportSubType) continue;
        //Sports
        s = sports.find(e => e && e.SportType == (d.SportType || "").trim() && e.SportSubType == (d.SportSubType || "").trim());
        if (!s) sports.push({ SportType: (d.SportType || "").trim(), SportSubType: (d.SportSubType || "").trim(), FullName: (d.SportType || "").trim() + ' - ' + (d.SportSubType || "").trim(), Selected: _allOptionsSelected });

        //Sports Parlays
        if (d.WagerType == "P") {
          s = parlaySports.find(e => e && e.SportType == (d.SportType || "").trim() && e.SportSubType == (d.SportSubType || "").trim());
          if (!s) parlaySports.push({ SportType: (d.SportType || "").trim(), SportSubType: (d.SportSubType || "").trim(), FullName: (d.SportType || "").trim() + ' - ' + (d.SportSubType || "").trim(), Selected: _allOptionsSelected });
        }

        //Sports Teasers
        if (d.WagerType == "T") {
          s = teaserSports.find(e => e && e.SportType == (d.SportType || "").trim() && e.SportSubType == (d.SportSubType || "").trim());
          if (!s) teaserSports.push({ SportType: (d.SportType || "").trim(), SportSubType: (d.SportSubType || "").trim(), FullName: (d.SportType || "").trim() + ' - ' + (d.SportSubType || "").trim(), Selected: _allOptionsSelected });
        }

        //Sports Straights
        if (d.WagerType == "S" || d.WagerType == "M" || d.WagerType == "L" || d.WagerType == "E") {
          s = straightSports.find(e => e && e.SportType == (d.SportType || "").trim() && e.SportSubType == (d.SportSubType || "").trim());
          if (!s) straightSports.push({ SportType: (d.SportType || "").trim(), SportSubType: (d.SportSubType || "").trim(), FullName: (d.SportType || "").trim() + ' - ' + (d.SportSubType || "").trim(), Selected: _allOptionsSelected });
        }

        //Sports AR
        if (d.ArLink) {
          s = reverseSports.find(e => e && e.SportType == (d.SportType || "").trim() && e.SportSubType == (d.SportSubType || "").trim());
          if (!s) reverseSports.push({ SportType: (d.SportType || "").trim(), SportSubType: (d.SportSubType || "").trim(), FullName: (d.SportType || "").trim() + ' - ' + (d.SportSubType || "").trim(), Selected: _allOptionsSelected });
        }

        //Periods
        p = periods.find(e => e && e.PeriodDescription == d.PeriodDescription.trim());
        if (!p) periods.push({ PeriodDescription: d.PeriodDescription.trim(), Selected: _allOptionsSelected });

        wt = wagerTypes.find(e => e && e.Code == d.WagerType.trim() && ((!e.ArLink && !d.ArLink) || (e.ArLink && d.ArLink)));
        if (!wt) {
          wagerTypes.push(_wagerTypes.find(e => e && e.Code == d.WagerType.trim() && ((!e.ArLink && !d.ArLink) || (e.ArLink && d.ArLink))));
        }

        c = customers.find(e => e && e.CustomerId == d.CustomerId.trim());
        if (!c) customers.push({ CustomerId: d.CustomerId.trim(), Selected: _allOptionsSelected });

      }
      sports.splice(0, 0, { SportType: "All", SportSubType: "All", FullName: "All" });
      parlaySports.splice(0, 0, { SportType: "All", SportSubType: "All", FullName: "All", Selected: _allOptionsSelected });
      teaserSports.splice(0, 0, { SportType: "All", SportSubType: "All", FullName: "All", Selected: _allOptionsSelected });
      straightSports.splice(0, 0, { SportType: "All", SportSubType: "All", FullName: "All", Selected: _allOptionsSelected });
      reverseSports.splice(0, 0, { SportType: "All", SportSubType: "All", FullName: "All", Selected: true });
      periods.splice(0, 0, { PeriodDescription: "All", Selected: _allOptionsSelected });
      wagerTypes.splice(0, 0, { Code: "A", Index: 0, Name: "All", Selected: _allOptionsSelected });

      let wagersWithSameLeagueOnly = $scope.Filters.WagersWithSameLeagueOnly;
      $scope.Filters = {
        Sports: sports,
        ParlaySports: parlaySports,
        TeaserSports: teaserSports,
        StraightSports: straightSports,
        ReverseSports: reverseSports,
        Periods: periods,
        WagerTypes: wagerTypes,
        Customers: customers,
        WagersWithSameLeagueOnly: wagersWithSameLeagueOnly
      };
      retrieveSelectedFilters();

    }

    function setInitialSelectedFilters() {
      if ($scope.Filters.Sports && $scope.Filters.Sports.length)
        $scope.Filters.Sports[0].Selected = false;
      if ($scope.Filters.Periods && $scope.Filters.Periods.length)
        $scope.Filters.Periods[0].Selected = false;
      if ($scope.Filters.WagerTypes && $scope.Filters.WagerTypes.length)
        $scope.Filters.WagerTypes[0].Selected = false;
      if ($scope.Filters.Clients && $scope.Filters.Clients.length)
        $scope.SelectedCustomer = $scope.Filters.Clients[0];
    }

    function applyRowFilter(row, allSports) {
      let p = $scope.Filters.Periods.find(e => e.PeriodDescription == 'All' && e.Selected ? true : (e.PeriodDescription || "").trim() == (row.PeriodDescription || "").trim() && e.Selected);
      if (!p) return null;
      p = $scope.Filters.WagerTypes.find(e => e.Code == 'A' && e.Selected ? true : e.Code == row.WagerType && e.Selected);
      if (!p) return null;
      if (!allSports) {
        p = $scope.Filters.Sports.find(e => e.SportType == 'All' && e.Selected ? true : e.SportType == row.SportType && e.SportSubType == row.SportSubType && e.Selected);
        if (!p) return null;
      }

      if ($scope.Filters.WagersWithSameLeagueOnly) {
        let spts = tableData.filter(e => e.TicketNumber == row.TicketNumber && e.WagerNumber == row.WagerNumber);
        if (spts && spts.length) {
          let sameSpts = spts.filter(e => e.SportType == row.SportType && e.SportSubType == row.SportSubType);
          if (spts.length != sameSpts.length) return null;
        }
      }

      return row;
    }

    function refreshTableView() {
      storeFilters();
      if (!tableData) return;
      let result = [];
      let sports = $scope.Filters.Sports.filter(e => e.Selected);
      let parlaySports = $scope.Filters.ParlaySports.filter(e => e.Selected);
      let teaserSports = $scope.Filters.TeaserSports.filter(e => e.Selected);
      let straightSports = $scope.Filters.StraightSports.filter(e => e.Selected);
      let reverseSports = $scope.Filters.ReverseSports.filter(e => e.Selected);
      let allSportsSelected = $scope.Filters.Sports[0].Selected;
      let lastTicketNumber = null;
      let arVol = 0;
      tableData.forEach(function (row) {

        let r = applyRowFilter(row, allSportsSelected);
        if (!r) return;

        var customerRow = result.find(e => e.CustomerId == row.CustomerId);
        if (!customerRow) {
          customerRow = {
            CustomerId: row.CustomerId,
            SportsInfo: new Array(sports.length + 5).fill(0)
          };
          result.push(customerRow);
        }
        var sportIdx = sports.indexOf(sports.find(e => e.SportSubType == row.SportSubType || (e.SportSubType == "All" && allSportsSelected)));
        if (sportIdx >= 0 && !row.ArLink) {
          customerRow.SportsInfo[sportIdx] += row.Volume;
          customerRow.SportsInfo[sports.length + 4] += row.Volume;
        }
        if (row.WagerType == "P") {
          sportIdx = parlaySports.indexOf(parlaySports.find(e => e.SportType == 'All' && e.Selected ? true : e.SportSubType == row.SportSubType));
          if (sportIdx >= 0) customerRow.SportsInfo[sports.length] += row.Volume;
        }
        if (row.WagerType == "T") {
          sportIdx = teaserSports.indexOf(teaserSports.find(e => e.SportType == 'All' && e.Selected ? true : e.SportSubType == row.SportSubType));
          if (sportIdx >= 0) customerRow.SportsInfo[sports.length + 1] += row.Volume;
        }
        if (row.WagerType == "S" || row.WagerType == "M" || row.WagerType == "E" || row.WagerType == "L") {
          sportIdx = straightSports.indexOf(straightSports.find(e => e.SportType == 'All' && e.Selected ? true : e.SportSubType == row.SportSubType));
          if (sportIdx >= 0) customerRow.SportsInfo[sports.length + 2] += row.Volume;
        }
        if (row.ArLink) {
          sportIdx = reverseSports.indexOf(reverseSports.find(e => e.SportType == 'All' || e.SportSubType == row.SportSubType));
          if (sportIdx >= 0) {
            if (lastTicketNumber != row.TicketNumber + "-" + row.WagerNumber) {
              customerRow.SportsInfo[sports.length + 3] += row.Volume;
              customerRow.SportsInfo[sports.indexOf(sports.find(e => e.SportSubType == row.SportSubType || (e.SportSubType == "All" && allSportsSelected)))] += row.Volume;
              customerRow.SportsInfo[sports.length + 4] += row.Volume;
              lastTicketNumber = row.TicketNumber + "-" + row.WagerNumber;
            }
          }
        }
      });
      $scope.VolumeReportInfo = result;

    }

    $scope.FilterSports = function (sp) {
      return !sp.Hidden;
    };

    $scope.SelectAll = function (clickToAll, type) {
      if (type != 'All') $scope.AllOptionsSelected = false;

      switch (type) {
        case 'Sports':
          if(clickToAll) for (let i = 1; i < $scope.Filters.Sports.length; i++) $scope.Filters.Sports[i].Selected = false;
          $scope.Filters.Sports[0].Selected = clickToAll ? $scope.Filters.Sports[0].Selected : false;
          break;
        case 'P':
          if (clickToAll) for (let i = 1; i < $scope.Filters.ParlaySports.length; i++) $scope.Filters.ParlaySports[i].Selected = false;
          $scope.Filters.ParlaySports[0].Selected = clickToAll ? $scope.Filters.ParlaySports[0].Selected : false;
          break;
        case 'T':
          if (clickToAll) for (let i = 1; i < $scope.Filters.TeaserSports.length; i++) $scope.Filters.TeaserSports[i].Selected = false;
          $scope.Filters.TeaserSports[0].Selected = clickToAll ? $scope.Filters.TeaserSports[0].Selected : false;
          break;
        case 'S':
          if (clickToAll) for (let i = 1; i < $scope.Filters.StraightSports.length; i++) $scope.Filters.StraightSports[i].Selected = false;
          $scope.Filters.StraightSports[0].Selected = clickToAll ? $scope.Filters.StraightSports[0].Selected : false;
          break;
        case 'Periods':
          if (clickToAll) for (let i = 1; i < $scope.Filters.Periods.length; i++) $scope.Filters.Periods[i].Selected = false;
          $scope.Filters.Periods[0].Selected = clickToAll ? $scope.Filters.Periods[0].Selected : false;
          break;
        case 'W':
          if (clickToAll) for (let i = 1; i < $scope.Filters.WagerTypes.length; i++) $scope.Filters.WagerTypes[i].Selected = false;
          $scope.Filters.WagerTypes[0].Selected = clickToAll ? $scope.Filters.WagerTypes[0].Selected : false;

          break;
        default:
          let i = 1;
          for (i = 1; i < $scope.Filters.Sports.length; i++) $scope.Filters.Sports[i].Selected = false;
          for (i = 1; i < $scope.Filters.ParlaySports.length; i++) $scope.Filters.ParlaySports[i].Selected = false;
          for (i = 1; i < $scope.Filters.TeaserSports.length; i++) $scope.Filters.TeaserSports[i].Selected = false;
          for (i = 1; i < $scope.Filters.StraightSports.length; i++) $scope.Filters.StraightSports[i].Selected = false;
          for (i = 1; i < $scope.Filters.StraightSports.length; i++) $scope.Filters.StraightSports[i].Selected = false;
          for (i = 1; i < $scope.Filters.Periods.length; i++) $scope.Filters.Periods[i].Selected = false;
          for (i = 1; i < $scope.Filters.WagerTypes.length; i++) $scope.Filters.WagerTypes[i].Selected = false;

          $scope.Filters.Sports[0].Selected = $scope.AllOptionsSelected;
          $scope.Filters.ParlaySports[0].Selected = $scope.AllOptionsSelected;
          $scope.Filters.TeaserSports[0].Selected = $scope.AllOptionsSelected;
          $scope.Filters.StraightSports[0].Selected = $scope.AllOptionsSelected;
          $scope.Filters.Periods[0].Selected = $scope.AllOptionsSelected;
          $scope.Filters.WagerTypes[0].Selected = $scope.AllOptionsSelected;
          break;
      }
      refreshTableView()
    }

    function storeFilters() {
      var filters = {
        Sports: $scope.Filters.Sports.filter(s => s.Selected),
        Periods: $scope.Filters.Periods.filter(s => s.Selected),
        WagerTypes: $scope.Filters.WagerTypes.filter(s => s && s.Selected)
      };
      $scope.addSessionData("customerPerformanceFilters", filters);
    }

    function retrieveSelectedFilters() {
      var filters = $scope.getSessionData("customerPerformanceFilters");
      if (!filters) {
        setInitialSelectedFilters();
        return;
      }
      if (filters.Sports && $scope.Filters.Sports && filters.Sports.length)
        filters.Sports.forEach(function (sf) {
          var s = $scope.Filters.Sports.find(e => e.SportType == sf.SportType && e.SportSubType == sf.SportSubType);
          if (s) s.Selected = false;
        });
      else $scope.Filters.Sports[0].Selected = false;
      if (filters.Periods && $scope.Filters.Periods && filters.Periods.length)
        filters.Periods.forEach(function (pf) {
          var p = $scope.Filters.Periods.find(e => e.PeriodDescription == pf.PeriodDescription);
          if (p) p.Selected = false;
        });
      if (filters.WagerTypes && $scope.Filters.WagerTypes && filters.WagerTypes.length)
        filters.WagerTypes.forEach(function (wtf) {
          var wt = $scope.Filters.WagerTypes.find(e => e.Code == wtf.Code);
          if (wt) wt.Selected = false;
        });
    }

    $scope.getData = function () {
      tableData = [];
      let params = {
        agentId: $rootScope.selectedAgent ? $rootScope.selectedAgent.AgentId : $scope.AgentAsCustomerInfo.CustomerID,
        weekNum: -1,//$scope.selectedWeek.Index,
        betType: $scope.SelectedBetType.code,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      };
      $agentService.GetCustomerPerformance(params).then(function (response) {
        tableData = response.data.d.Data;
        let groupedData = CommonFunctions.groupBy(tableData, 'SportType');

        setFiltersInfo(tableData);

        $scope.Filters.Clients = [{ CustomerId: 'All' }, ...(Object.keys(groupedData).map((key) => groupedData[key])).map(x => x[0])];

        $scope.SelectedSport = $scope.Filters.Sports[0];
        groupedData = CommonFunctions.groupBy(tableData, 'SportSubType');
        $scope.Filters.Leagues = [...(Object.keys(groupedData).map((key) => groupedData[key])).map(x => x[0]).filter(x => x.SportType == $scope.Filters.Sports[1].SportSubType)];

        refreshTableView();
      });
    }

    $scope.ExportData = function () {
      Swal.fire({
        title: "Processing...",
        text: "Please wait",
        showConfirmButton: false,
        allowOutsideClick: false
      });
      const fileName = 'Volume';
      const exportType = 'xls';
      let exportData = [];
      $scope.VolumeReportInfo.forEach(function (row) {
        var info = {
          CustomerId: row.CustomerId
        };
        for (var i = 0; i < row.SportsInfo.length - 3; i++) {
          const sport = $scope.Filters.Sports[i];
          if (!sport.Selected) continue;
          const sportData = row.SportsInfo[i];
          info[sport.FullName] = CommonFunctions.FormatNumber(sportData, true);
        }
        info["Parlays"] = CommonFunctions.FormatNumber(row.SportsInfo[row.SportsInfo.length - 5], true);
        info["Teasers"] = CommonFunctions.FormatNumber(row.SportsInfo[row.SportsInfo.length - 4], true);
        info["Reverses"] = CommonFunctions.FormatNumber(row.SportsInfo[row.SportsInfo.length - 3], true);
        info["Straights"] = CommonFunctions.FormatNumber(row.SportsInfo[row.SportsInfo.length - 2], true);
        info["Total"] = CommonFunctions.FormatNumber(row.SportsInfo[row.SportsInfo.length - 1], true);
        exportData.push(info);
      });
      window.exportFromJSON({ data: exportData, fileName, exportType });
      Swal.fire(
        $scope.Translate('Data exported'),
        '',
        'success'
      );
    }

    Init();
  }
]);
