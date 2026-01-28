appModule.controller("campaignCustomersController", [
  '$scope', '$agentService', '$rootScope', '$routeParams', '$compile', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $rootScope, $routeParams, $compile, DTOptionsBuilder, DTColumnDefBuilder) {

    let currentPage = 0, allData = [], actionLoaded = true, searching = false, searchEvent = null;
    $scope.totalDisplayed = 100;
    $scope.LoadingReportData = true;

    function getData(loadMore = false) {
      if (loadMore != false && $scope.thatsAll === true) return;
      $scope.LoadingReportData = true;
      let params = {
        weekNumber: 0, agentId: $rootScope.selectedAgent ? $rootScope.selectedAgent.AgentId : $scope.AgentAsCustomerInfo.CustomerID,
        wageringStatus: $scope.ReportFilters.CustomerStatus,
        start: currentPage++ * 100, length: 100,
        search: $scope.ReportFilters.search,
        custIdOrder: $scope.ReportFilters.custIdOrder,
        balOrder: $scope.ReportFilters.balOrder
      };
      $agentService.GetCustomersInfoPaging(params).then(function (result) {
        if (loadMore == false) $scope.thatsAll = false;
        if (result.data.d.Data.length == 0) $scope.thatsAll = true;
        let currentAgent = loadMore == false ? null : allData[allData.length - 1].AgentId.toUpperCase().trim();
        if (result.data.d.Data.length > 0) {
          let resultData = result.data.d.Data;
          resultData.forEach(function (data) {
            if (currentAgent == null || currentAgent != data.AgentId.toUpperCase().trim()) {
              currentAgent = data.AgentId;
              data.isTitle = true;
            }
            data.CreditLimitInput = data.CreditLimit / 100;
            data.WagerLimitInput = data.WagerLimit / 100;
            if (loadMore) {
              allData.push(data);
            }
          })
          if (loadMore == false) allData = resultData;
        }
        $scope.tableData = allData;
        npTotal();
        $scope.LoadingReportData = false;
        setTimeout(function () {
          syncscroll.reset();
        }, 200);

      });
    }

    function npTotal() {
      $scope.tableData.forEach(x => {
        x.CurrentBalance += x.CasinoBalance;
      });
    }

    $scope.getData = getData;

    jQuery('#modalDialog').on('hidden.bs.modal', function () {
      let dt = jQuery('#customersDT').DataTable();
      dt.ajax.reload(null, false);
    });

    $scope.ReportFilters = {
      CustomerStatus: '2',
      search: '',
      WeekNumber: {},
      custIdOrder: 0,
      balOrder: 0
    };

    $scope.clickBalOrder = function () {
      $scope.totalDisplayed = 0;
      currentPage = 0;
      allData = [];
      if ($scope.ReportFilters.balOrder == 0)
        $scope.ReportFilters.balOrder = 1;
      else if ($scope.ReportFilters.balOrder == 1)
        $scope.ReportFilters.balOrder = 2;
      else if ($scope.ReportFilters.balOrder == 2)
        $scope.ReportFilters.balOrder = 0;
      $scope.ReportFilters.custIdOrder = 0;
      getData();
    }

    $scope.clickCustIdOrder = function () {
      $scope.totalDisplayed = 0;
      currentPage = 0;
      allData = [];
      if ($scope.ReportFilters.custIdOrder == 0)
        $scope.ReportFilters.custIdOrder = 1;
      else if ($scope.ReportFilters.custIdOrder == 1)
        $scope.ReportFilters.custIdOrder = 0;
      $scope.ReportFilters.balOrder = 0;
      getData();
    }

    $scope.Init = function () {
      showScrollGif();
      $agentService.GetActivePlayersCount().then(function (result) {
        $scope.Players = result.data.d.Data;
        var customerId = $routeParams.cid;
        openCustomer(customerId);
      });
      if ($agentService.AgentInfo) {
        $scope.AgentInfo = $agentService.AgentInfo;
        $scope.SuspendWagering = $agentService.AgentInfo ? $agentService.AgentInfo.SuspendWageringFlag == 'Y' : false;
        selectedAgentReady();
      }
      else {
        $rootScope.$on('AgentAsCustomerInfoLoaded', function () {
          if ($agentService.AgentInfo) {
            $scope.AgentInfo = $agentService.AgentInfo;
            $scope.SuspendWagering = $agentService.AgentInfo.SuspendWageringFlag == 'Y';
            /*$agentService.GetActivePlayersCount().then(function (result) {
              $scope.Players = result.data.d.Data;
              var customerId = $routeParams.cid;
              openCustomer(customerId);
            });*/
            selectedAgentReady();
          }
        });
      }
    };

    angular.element('#customersDiv').bind("scroll", function () {
      var dash = document.getElementsByClassName('dashbwrapper')[0];
      var windowHeight = "offsetHeight" in document.getElementsByClassName('dashbwrapper')[0] ? document.getElementsByClassName('dashbwrapper')[0].offsetHeight : document.documentElement.offsetHeight;
      var body = document.getElementById('customersDiv'), html = dash;
      var docHeight = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);
      windowBottom = windowHeight + body.scrollTop;

      if (windowBottom >= docHeight) {
        loadData()
      }
    });

    function loadData() {
      if ($scope.LoadingReportData == false) {
        $scope.totalDisplayed += 100;
        getData(true)
        $rootScope.safeApply();
        if ($scope.totalDisplayed >= $scope.tableData.length) $scope.LoadMoreIsVisible = false;
      }
    }

    $scope.loadData = loadData;


    function selectedAgentReady() {
      if ($rootScope.selectedAgent) {
        getData();
      } else {

        if (!$scope.AgentAsCustomerInfo) {
          $rootScope.$on('AgentAsCustomerInfoReady', function () {
            getData();
          });
        } else {
          getData();
        }
      }
    }

    $scope.WagerLimit = function (customer) {
      var expTempDate = new Date(customer.TempWagerLimitExpirationString);
      var today = $agentService.GetServerDateTime();
      if (expTempDate > today) {
        return customer.TempWagerLimit;
      }
      return customer.WagerLimit;
    };

    $scope.GetCustomersList = function () {
      $rootScope.AgentsList = $agentService.AgentsList;
      setTimeout(function () {
        jQuery('[data-toggle="tooltip"]').tooltip();
        jQuery('[data-toggle="popover"]').popover({ trigger: "hover" });
        if (!$rootScope.IsMobile)
          jQuery('table.tablesaw').fixedHeader({
            topOffset: 65
          });
      }, 500);
    };

    $scope.setFocus = function (event) {
      searchEvent = event.target;
    }

    $scope.refreshData = function () {
      $scope.totalDisplayed = 100;
      currentPage = 0;
      getData();
      actionLoaded = true;
    }

    $scope.keyPress = function (keyEvent) {
      if (keyEvent.which === 13)
        $scope.refreshData();
    }

    $scope.searchData = function () {
      if (searching == false && ($scope.ReportFilters.search.length > 0 || $scope.ReportFilters.search.length > 3)) {
        $scope.refreshData();
        searching = true;
        setTimeout(() => searching = false, 3000);

      }
    }

    function openCustomer(customerId) {
      if (!customerId || !$scope.AgentsList) return;
      var customerObj = $scope.AgentsList[0].CustomersList;
      for (var i = 0; i < $scope.AgentsList[0].CustomersList.length; i++) {
        var customerObj = $scope.AgentsList[0].CustomersList[i];
        if (customerId == customerObj.CustomerId) {
          $scope.ShowCustomerDialog(customerObj, 1, customerId);
          return;
        }
      }
    }

    $scope.reloadData = function () {
      let dt = jQuery('#customersDT').DataTable();
      dt.ajax.reload(null, false);
      $rootScope.safeApply();
    };

    $scope.ReportFilter = function (cL) {
      return function (cL) {
        switch ($scope.ReportFilters.CustomerStatus) {
          case "2":
            return true;
          case "1":
            return cL.NoWagering;
          case "0":
            return !cL.NoWagering;
        }
      };
    };
    $scope.UpdateCustomerAccess = function (customerId, e, element, restriction, object) {
      if (!actionLoaded) {
        element = !element;
        return;
      }
      actionLoaded = false;
      if ($scope.SuspendWagering == false) return;
      var accessValue;
      if (element)
        accessValue = "Y";
      else
        accessValue = "N";
      var code = e.target.id.split("_")[0];
      let params = { customerId: customerId };
      $agentService.GetActions(params).then(function (res) {
        const rawData = res.data.d.Data;
        actionList = rawData.filter(x => x.HasParameters === false).map(function (x) { return { ...x, checked: x.CustomerId != null } });
        const specAction = {
          account: actionList.find(x => x.Name.trim() == 'Suspend Account'),
          casino: actionList.find(x => x.Name.trim() == 'Suspend Virtual Casino'),
          horses: actionList.find(x => x.Name.trim() == 'Suspend Horses')
        };
        let action = restriction == 'Suspend Wagering' ? specAction.account : restriction == 'Suspend Horses' ? specAction.horses : restriction == 'Suspend Casino' ? specAction.casino : null;
        if (action != null) {
          let params = { customerId: customerId, actionId: action.ActionId };
          if (restriction == 'Suspend Wagering' || restriction == 'Suspend Casino' || restriction == 'Suspend Horses') {
            if (element == false) {
              $agentService.RestrictAction(params);
            } else {
              $agentService.AllowAction(params);
            }
          } else {
            if (element == true) {
              $agentService.RestrictAction(params);
            } else {
              $agentService.AllowAction(params);
            }
          }
        }
        actionLoaded = true;
      });
    };

    $scope.Status = 'disable';
    $scope.UpdateAllCustomersAccess = function (GetPreviusState) {
      if ($scope.ReportFilters.CustomerStatus != '2' && !$scope.SuspendWagering) return;
      var code = iconId;
      var index = 0;
      customersList.forEach(function (e) {
        var element = document.getElementById(code + '_' + index);
        if (!GetPreviusState) {
          e.PreviusState = element.checked ? true : false;
          element.checked = $scope.Status === "disable" ? false : true;
        }
        else element.checked = e.PreviusState;
        index++;
        //$agentService.UpdateCustomerAccess(e.CustomerId, code, $scope.Status === 'enable' ? 'Y' : 'N');
      });
      $scope.Status = $scope.Status === "disable" ? "enable" : "disable";
    };

    var iconId = '';
    var customersList = [];
    $scope.SetIcon = function (icon, name, customers) {
      iconId = icon;
      customersList = customers;
      $scope.RestricionName = name;
    };

    function showScrollGif() {
      if ($scope.IsMobile) {
        let scrollGif = document.getElementById('scrollGif');
        let timesDisplayed = $scope.getSessionData('scrollGifCounter') ? $scope.getSessionData('scrollGifCounter') : 0;
        if (timesDisplayed > 5) return;
        scrollGif.style.zIndex = 4;
        scrollGif.style.display = 'flex';
        setTimeout(function () {
          scrollGif.classList.add('vanish');
          $scope.addSessionData('scrollGifCounter', ++timesDisplayed)
          setTimeout(function () {
            scrollGif.style.zIndex = -1;
          }, 1001)
        }, 2000)
      }
    }


    $scope.Init();

    $scope.$on('$destroy', function () {
      document.getElementById("page-content-wrapper").classList.remove('no-printable');

    });
  }
]);