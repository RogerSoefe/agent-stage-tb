appModule.directive('customerCounter', ['$agentService', function ($agentService) {
  return {
    restrict: 'AEC',
    scope: {
      tableData: '=',
      totals: '='
    },
    controller: ['$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
      $scope.Translate = $scope.$parent.Translate;
      $scope.AgentAsCustomerInfo = $scope.$parent.AgentAsCustomerInfo;
      $scope.tableData;
      $scope.totals;
      $scope.font = {mode: '1'}
      $scope.inHouse = $scope.totals.filter(x => x.system == 'Inet' || x.system == 'Phone' || x.system == 'Horses' || x.system == 'Virtual Casino' || x.system == 'Props-Builder');
      $scope.liveServices = $scope.totals.filter(x => (
        x.system == 'D-Live' 
        || x.system == 'EZLiveBet' 
        || x.system == 'Dynamic Live'
        || x.system == 'Ultimate Live'
      ));
      $scope.casinoServices = $scope.totals.filter(x => (x.system == 'BTCasino' || x.system == 'EvoCasino' || x.system == 'VIP Casino' || x.system == 'Casino Only' || x.system == 'Bingo'
        || x.system == 'VIP LiveDealer' || x.system == 'Live Casino' || x.system == 'WMLiveDealer' 
        || x.system == 'Dragon Gaming' 
        || x.system == 'Golden Gaming' 
        || x.system == 'VIG Casino' 
      || x.system == 'WM Casino' 
      ));
      $scope.otherServices = $scope.totals.filter(x =>
        !(x.system == 'Current Balance' || x.system == 'Total Active Players') &&
        !$scope.inHouse.some(y => y.system == x.system) 
        && !$scope.liveServices.some(y => y.system == x.system) && !$scope.casinoServices.some(y => y.system == x.system));

      setTimeout(function () {
        syncscroll.reset();
      }, 200);

      $scope.arrayCenter = {
        inHouse: Math.floor($scope.inHouse.length / 2),
        live: Math.floor($scope.liveServices.length / 2),
        casino: Math.floor($scope.casinoServices.length / 2),
        other: Math.floor($scope.otherServices.length / 2)
      }
      let toggling = false;
      $scope.toggleRows = function (agent) {
        if (toggling == true) return;
        if (agent.hasChildren == false || agent.level == 0) return;
        agent.collapse = !agent.collapse;
        if (agent.collapse == true) {
          var childElements = document.querySelectorAll(`.row-${(agent.AgentID.RemoveSpecials())}-child`);
          childElements.forEach(function (element, index) {
            element.classList.toggle('tree-child');
            if (index == childElements.length - 1) toggling = false;
          });
        } else {
          const allChildren = $scope.tableData.filter(x => (x.Hierarchy || '').indexOf(agent.AgentID) >= 0)
          allChildren.forEach((child, index) => {
            if (child.AgentID.trim() == agent.MasterAgentID.trim()) return;
            child.collapse = false;
            var childElements = document.querySelectorAll(`.row-${(child.AgentID.RemoveSpecials())}-child`);
            childElements.forEach(function (element, index) {
              element.classList.add('tree-child');
            });
            if (index == childElements.length - 1) toggling = false;
          })
        }

      }
      let expand = true;
      $scope.expandCollapse = function () {
        $scope.tableData.forEach(data => {
          if (data.level < 1) return;
          data.collapse = expand;
        })
        expand = !expand;
        var childElements = document.querySelectorAll(`.data-row`);
        childElements.forEach(function (element) {
          const level = parseInt(element.getAttribute("level"));
          if (level < 2) return;
          if (expand == false) element.classList.remove('tree-child');
          else element.classList.add('tree-child');
        });
      }
      $scope.printData = function () {
        const divToPrint = document.getElementById('counterData');
        const printWindow = window.open('', '', 'width=600,height=600');
        printWindow.document.open();
        printWindow.document.write('<html><head><title>Print</title></head><body>');
        printWindow.document.write(divToPrint.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }


      $scope.ExportData = function () {
        const exportData = [];
        Swal.fire({
          title: "Processing...",
          text: "Please wait",
          showConfirmButton: false,
          allowOutsideClick: false
        });
        exportData.push(...$scope.tableData.map(function (d) {
          let id = '`';
          for (let j = 0; j < d.level; j++) {
            id += ' _ ';
          }
          let expt = { Id: id + (d.hasChildren == false ? d.CustomerID.trim() : d.AgentID) };
          for (let i = 0; i < $scope.totals.length; i++) {
            expt[$scope.totals[i].system] =  d.hasChildren == false ? (d.SystemsArray.some(x => x.system == $scope.totals[i].system) ? '1' : '') : d[$scope.totals[i].system];
          }
          return expt;
        }));
        const fileName = 'CustomerCounter';
        const exportType = 'xls';
        window.exportFromJSON({ data: exportData, fileName, exportType });
        Swal.fire(
          $scope.Translate('Data exported'),
          '',
          'success'
        );
      }

      $scope.Print = function () {
        jQuery('#counterData').printThis({
          importCSS: true,
          importStyle: true,
          loadCss: appModule.Root + '/assets_core/css/core-style.css'
        });
      }
      var lastRows = [];
      var lastCols = [];

      $scope.highlightData = function (header, user) {
        lastRows.forEach(e => e.classList.remove('bg-light-gray'));
        lastCols.forEach(e => e.classList.remove('bg-light-gray'));
        const rows = document.querySelectorAll(`[row-owner="${user}"]`);
        const cols = document.querySelectorAll(`[col-owner="${header}"]`);
        rows.forEach(e => e.classList.add('bg-light-gray'));
        cols.forEach(e => e.classList.add('bg-light-gray'));
        lastRows = rows;
        lastCols = cols;
      }

      $scope.changeFont = function (mode) {
        if (mode == '1') { 
          var e = document.querySelector('.customers-left').classList.add('cust-counter-small-font');
          document.querySelector('.customers-right').classList.add('cust-counter-small-font');
        }
        else {
          document.querySelector('.customers-left').classList.remove('cust-counter-small-font');
          document.querySelector('.customers-right').classList.remove('cust-counter-small-font');
        }
      }

    }],
    templateUrl: appModule.Root + '/app/directives/customerCounter/customerCounter.html?v=2'
  };
}]);