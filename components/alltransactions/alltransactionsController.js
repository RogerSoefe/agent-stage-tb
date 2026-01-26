appModule.controller("alltransactionsController", ['$scope', '$rootScope', '$agentService', function ($scope, $rootScope, $agentService) {

    let  dateRange;    
	function startDateRangePicker() {
        function cb(start, end) {
            currentPage = 0;
            globalStart = start.format('MM/DD/YYYY'); globalEnd = end.format('MM/DD/YYYY');
            dateRange = { startDate: start.format('MM/DD/YYYY'), endDate: end.format('MM/DD/YYYY') }
            $scope.GetAgentCustomerTransactions()
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
  function Init() {
    $scope.showLoadingGif('loadingAllTransactions');
    let WeeksRange = $agentService.GetWeeksRange();
     WeeksRange.splice(1, 0, { DateRange: "custom Range", Index: -1 })
    $scope.WeeksRange = WeeksRange;
	
    $scope.Filters = {
      Week: $scope.WeeksRange[0],
      SelectedAgent: null
    };

    if ($rootScope.selectedAgent) {
		startDateRangePicker();
      $scope.GetAgentCustomerTransactions();
    }
    else {
      $rootScope.$on('AgentAsCustomerInfoReady', function () {
        if ($rootScope.selectedAgent) {
			startDateRangePicker();
          $scope.GetAgentCustomerTransactions();
        }
      });
    }
  }

  jQuery("#endDateInput").datepicker({
    defaultDate: new Date()
  });

  jQuery("#startDateInput").datepicker({
    defaultDate: -7
  });

  $scope.AgentWithTransactions = function (ag) {
    return ag.AgentId == $scope.Agents[0].AgentId || (ag.Transactions && ag.Transactions.length > 0);
  };

  $scope.GetAgentCustomerTransactions = function () {
    $scope.showLoadingGif('loadingAllTransactions');
     $agentService.GetAgentCustomersCashTransactions($rootScope.selectedAgent.AgentId, $scope.Filters.Week.Index == -1 ? 0 : $scope.Filters.Week.Index, $scope.Filters.Week.Index == -1 ? dateRange.startDate : null, $scope.Filters.Week.Index == -1 ? dateRange.endDate : null).then(function (result) {
      let groupedData = CommonFunctions.groupBy(result.data.d.Data, 'AgentID');
      $scope.AgentsTrans = GroupTransactions(Object.keys(groupedData).map((key) => groupedData[key]));
      $scope.hideLoadingGif('loadingAllTransactions');
    });
  };

  function GroupTransactions(trans) {
    if (!trans || trans.length <= 0) return;
    for (var i = 0; i < trans.length; i++) {
      let ag = trans[i];
      ag.Transactions = 0;
      ag.Total = 0;
      ag.TotalD = 0;
      ag.TotalC = 0;
      ag.forEach(function (t) {
        ag.Total += t.TranCode == 'D' ? t.Amount * -1 : t.Amount;
        ag.TotalD += t.TranCode == 'D' ? t.Amount : 0;
        ag.TotalC += t.TranCode == 'C' ? t.Amount : 0;
			})
		}
    return trans;
  }

  Init();

}]);