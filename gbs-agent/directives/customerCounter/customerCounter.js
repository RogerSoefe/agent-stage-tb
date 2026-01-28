appModule.directive('customerCounter', ['$agentService', function ($agentService) {
  return {
    restrict: 'AEC',
    scope: {
      tableData: '=',
      totals: '='
    },
    controller: ['$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
      $scope.Translate = $scope.$parent.Translate;
      $scope.UseOldViews = $rootScope.UseOldViews || false;
      $scope.AgentAsCustomerInfo = $scope.$parent.AgentAsCustomerInfo;
      $scope.tableData;
      $scope.totals;
      $scope.font = { mode: '1' }
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
        !$scope.inHouse.some(y => y.system == x.system) && !$scope.liveServices.some(y => y.system == x.system) && !$scope.casinoServices.some(y => y.system == x.system));

      // Helper functions to check if ALL columns in a group are visible
      $scope.hasVisibleInHouse = function () {
        return $scope.inHouse.length > 0 && $scope.inHouse.every(x => !x.hidden);
      };
      $scope.hasVisibleLive = function () {
        return $scope.liveServices.length > 0 && $scope.liveServices.every(x => !x.hidden);
      };
      $scope.hasVisibleCasino = function () {
        return $scope.casinoServices.length > 0 && $scope.casinoServices.every(x => !x.hidden);
      };
      $scope.hasVisibleOther = function () {
        return $scope.otherServices.length > 0 && $scope.otherServices.every(x => !x.hidden);
      };

      // Helper function to check if any group has all columns visible
      $scope.hasAnyVisibleGroup = function () {
        return $scope.hasVisibleInHouse() || $scope.hasVisibleLive() || $scope.hasVisibleCasino() || $scope.hasVisibleOther();
      };

      // Helper functions to count visible columns in each group
      $scope.countVisibleInHouse = function () {
        return $scope.inHouse.filter(x => !x.hidden).length;
      };
      $scope.countVisibleLive = function () {
        return $scope.liveServices.filter(x => !x.hidden).length;
      };
      $scope.countVisibleCasino = function () {
        return $scope.casinoServices.filter(x => !x.hidden).length;
      };
      $scope.countVisibleOther = function () {
        return $scope.otherServices.filter(x => !x.hidden).length;
      };

      // Helper function to get total width of all visible columns
      $scope.getTotalColumnsWidth = function () {
        var visibleCount = $scope.totals.filter(t => !t.hidden).length;
        var columnWidth = getComputedStyle(document.documentElement).getPropertyValue('--counter-table-column-width').trim() || '90px';
        var widthValue = parseFloat(columnWidth);
        return (visibleCount * widthValue) + 'px';
      };

      setTimeout(function () {
        syncscroll.reset();
      }, 200);

      // Helper functions to get the center index for each group based on visible columns
      $scope.getCenterInHouse = function () {
        return Math.floor($scope.countVisibleInHouse() / 2);
      };
      $scope.getCenterLive = function () {
        return Math.floor($scope.countVisibleLive() / 2);
      };
      $scope.getCenterCasino = function () {
        return Math.floor($scope.countVisibleCasino() / 2);
      };
      $scope.getCenterOther = function () {
        return Math.floor($scope.countVisibleOther() / 2);
      };

      let toggling = false;
      $scope.toggleRows = function (agent) {
        console.log('toggleRows called:', agent.AgentID, 'level:', agent.level, 'collapse:', agent.collapse);
        if (toggling == true) return;
        if (agent.hasChildren == false) return;

        // Check if breadcrumbs mode is enabled
        const isFiltered = $scope.$parent.filteredByAgent !== null;
        const isRootOfFilteredView = isFiltered && agent.AgentID === $scope.$parent.filteredByAgent;
        console.log('isFiltered:', isFiltered, 'isRootOfFilteredView:', isRootOfFilteredView);

        // Allow level 0 nodes to expand only in filtered view
        if (agent.level == 0 && !isFiltered) {
          console.log('Blocked: level 0 in unfiltered view');
          return;
        }

        // Function to check if any children have their own children (grandchildren exist)
        function hasGrandchildren(agentId) {
          // Find the node in fullTreeNodes
          function findNode(tree, targetAgentId) {
            if (tree.AgentID === targetAgentId) return tree;
            if (tree.children && tree.children.length > 0) {
              for (let i = 0; i < tree.children.length; i++) {
                const found = findNode(tree.children[i], targetAgentId);
                if (found) return found;
              }
            }
            return null;
          }

          let targetNode = null;
          if ($scope.$parent.fullTreeNodes) {
            for (let i = 0; i < $scope.$parent.fullTreeNodes.length; i++) {
              targetNode = findNode($scope.$parent.fullTreeNodes[i], agentId);
              if (targetNode) break;
            }
          }

          if (!targetNode || !targetNode.children) return false;

          // Check if any child has children
          for (let i = 0; i < targetNode.children.length; i++) {
            if (targetNode.children[i].children && targetNode.children[i].children.length > 0) {
              return true;
            }
          }
          return false;
        }

        // If we're in breadcrumbs mode and have children
        if ($scope.$parent.usarBreadcrumbs && agent.hasChildren) {
          // If this is the root node of the filtered view, allow normal expand/collapse
          if (isRootOfFilteredView) {
            // Fall through to normal expand/collapse behavior
          } else if (hasGrandchildren(agent.AgentID)) {
            // If children have their own children, trigger breadcrumb filter
            $scope.$parent.filterByAgent(agent);
            return;
          }
          // If children are leaf nodes (no grandchildren), fall through to normal expand/collapse
        }

        // Normal expand/collapse behavior
        agent.collapse = !agent.collapse;

        // Get the parent row element to add/remove expanded class
        var parentRow = document.querySelector(`[row-owner="${agent.AgentID.trim().RemoveSpecials()}"]`);

        if (agent.collapse == true) {
          // Add expanded class to parent
          if (parentRow) parentRow.classList.add('expanded');

          // Check if children need to be loaded dynamically
          if (!agent.childrenLoaded && $scope.$parent.expandNode) {
            toggling = true;
            $scope.$parent.expandNode(agent);
            // Wait for Angular to digest and render the changes
            setTimeout(function () {
              // Force digest cycle to ensure both columns are rendered
              if (!$scope.$$phase && !$scope.$root.$$phase) {
                $scope.$apply();
              }
              // Wait a bit more for rendering
              setTimeout(function () {
          var childElements = document.querySelectorAll(`.row-${(agent.AgentID.RemoveSpecials())}-child`);
          childElements.forEach(function (element, index) {
            element.classList.toggle('tree-child');
                  element.classList.add('child-visible');
                });
                toggling = false;
              }, 100);
            }, 50);
          } else {
            // Children already loaded, just toggle visibility
            var childElements = document.querySelectorAll(`.row-${(agent.AgentID.RemoveSpecials())}-child`);
            childElements.forEach(function (element, index) {
              element.classList.toggle('tree-child');
              if (!element.classList.contains('tree-child')) {
                element.classList.add('child-visible');
              }
            if (index == childElements.length - 1) toggling = false;
          });
          }
        } else {
          // Remove expanded class from parent
          if (parentRow) parentRow.classList.remove('expanded');

          const allChildren = $scope.tableData.filter(x => (x.Hierarchy || '').indexOf(agent.AgentID) >= 0)
          allChildren.forEach((child, index) => {
            if (child.AgentID.trim() == agent.MasterAgentID.trim()) return;
            child.collapse = false;
            var childElements = document.querySelectorAll(`.row-${(child.AgentID.RemoveSpecials())}-child`);
            childElements.forEach(function (element, index) {
              element.classList.add('tree-child');
              element.classList.remove('child-visible');
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
            expt[$scope.totals[i].system] = d.hasChildren == false ? (d.SystemsArray.some(x => x.system == $scope.totals[i].system) ? '1' : '') : d[$scope.totals[i].system];
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

      // Chunked full-tree export (does not depend on visible/expanded DOM rows)
      $scope.ExportDataFullChunked = function () {
        const roots = ($scope.$parent && $scope.$parent.fullTreeNodes) || [];
        if (!roots.length) {
          // Fallback to current partial export if full tree not available
          return $scope.ExportData();
        }
        Swal.fire({
          title: 'Processing full tree...',
          text: 'Please wait',
          showConfirmButton: false,
          allowOutsideClick: false
        });
        const totals = $scope.totals || [];
        const stack = roots.map(r => ({ node: r, level: 0 }));
        const seen = new Set(); // prevent duplicate agent rows
        const rows = [];
        const chunkSize = 1000; // tune if needed

        function processChunk() {
          let processed = 0;
          while (stack.length && processed < chunkSize) {
            const { node, level } = stack.pop();
            const isAgent = !!node.hasChildren;
            if (isAgent) {
              const key = (node.AgentID || '') + '|' + level;
              if (seen.has(key)) { continue; }
              seen.add(key);
            }
            const row = {
              Id: isAgent ? (node.AgentID || '').trim() : (node.CustomerID || '').trim(),
              Level: level
            };
            for (let i = 0; i < totals.length; i++) {
              const col = totals[i].system;
              if (isAgent) {
                row[col] = (node[col] !== undefined && node[col] !== null) ? node[col] : '';
              } else {
                row[col] = (node.SystemsArray && node.SystemsArray.some(s => s.system === col)) ? 1 : '';
              }
            }
            rows.push(row);
            if (node.children && node.children.length) {
              for (let i = node.children.length - 1; i >= 0; i--) {
                stack.push({ node: node.children[i], level: level + 1 });
              }
            }
            processed++;
          }
          if (stack.length) {
            // yield to UI thread
            setTimeout(processChunk, 0);
          } else {
            window.exportFromJSON({ data: rows, fileName: 'CustomerCounterFull', exportType: 'xls' });
            Swal.fire($scope.Translate('Data exported'), '', 'success');
          }
        }
        processChunk();
      };

      // Export only currently visible (expanded) rows
      $scope.ExportDataVisible = function () {
        Swal.fire({
          title: 'Processing visible rows...',
          text: 'Please wait',
          showConfirmButton: false,
          allowOutsideClick: false
        });
        const totals = $scope.totals || [];
        const data = $scope.tableData || [];

        // Build a Set of IDs actually visible in the DOM to avoid inference errors
        const visibleIdSet = new Set();
        try {
          // A visible row is either not having class 'tree-child' OR has 'child-visible'
          const domRows = document.querySelectorAll('.data-row');
          domRows.forEach(r => {
            const hasTreeChild = r.classList.contains('tree-child');
            const childVisible = r.classList.contains('child-visible');
            if (!hasTreeChild || childVisible) {
              const owner = r.getAttribute('row-owner');
              if (owner) visibleIdSet.add(owner.trim());
            }
          });
        } catch (e) {
          console.warn('DOM visibility scan failed, fallback to collapse logic', e);
        }

        // Fallback if DOM scan empty: use collapse-based heuristic
        if (visibleIdSet.size === 0) {
          data.forEach(n => {
            if (n.level === 0 || n.collapse === true || n.hasChildren === false) {
              // We still need ancestor chain; simple heuristic:
              visibleIdSet.add((n.hasChildren === false ? (n.CustomerID || '').trim() : (n.AgentID || '').trim()));
            }
          });
        }

        // Map tableData to export rows if their AgentID OR CustomerID is in visibleIdSet
        const indexes = [];
        for (let i = 0; i < data.length; i++) {
          const node = data[i];
          const key = node.hasChildren === false ? (node.CustomerID || '').trim() : (node.AgentID || '').trim();
          if (visibleIdSet.has(key)) indexes.push(i);
        }

        const rows = [];
        const chunkSize = 1000;
        let cursor = 0;
        function processChunk() {
          let processed = 0;
          while (cursor < indexes.length && processed < chunkSize) {
            const node = data[indexes[cursor]];
            let idPrefix = '`';
            for (let j = 0; j < node.level; j++) idPrefix += ' _ ';
            const isAgent = node.hasChildren !== false;
            const rowObj = { Id: idPrefix + (isAgent ? (node.AgentID || '').trim() : (node.CustomerID || '').trim()), Level: node.level };
            for (let t = 0; t < totals.length; t++) {
              const col = totals[t].system;
              if (!isAgent) {
                rowObj[col] = (node.SystemsArray && node.SystemsArray.some(s => s.system === col)) ? 1 : '';
              } else {
                rowObj[col] = node[col] !== undefined ? node[col] : '';
              }
            }
            rows.push(rowObj);
            cursor++; processed++;
          }
          if (cursor < indexes.length) {
            setTimeout(processChunk, 0);
          } else {
            window.exportFromJSON({ data: rows, fileName: 'visible_agents', exportType: 'xls' });
            Swal.fire($scope.Translate('Data exported'), '', 'success');
          }
        }
        processChunk();
      };

      $scope.Print = function () {
        jQuery('#counterData').printThis({
          importCSS: true,
          importStyle: true,
          loadCss: appModule.Root + '/assets_core/css/core-style.css'
        });
      }

      // Listen for export triggers from parent controller
      $scope.$on('triggerExportData', function () {
        $scope.ExportData();
      });

      $scope.$on('triggerPrint', function () {
        $scope.Print();
      });

      // Listen for full chunked export trigger
      $scope.$on('triggerExportDataFullChunked', function () {
        $scope.ExportDataFullChunked();
      });

      // Listen for visible-only export trigger
      $scope.$on('triggerExportDataVisible', function () {
        $scope.ExportDataVisible();
      });

      // Listen for column visibility changes
      $scope.$on('columnVisibilityChanged', function (event, column) {
        // Angular automatically re-renders with ng-show
        // Force digest if needed
        if (!$scope.$$phase) {
          $scope.$apply();
        }
      });

      var lastRows = [];
      var lastCols = [];

      // Toggle columns settings - call parent controller function
      $scope.toggleColumnsSettings = function () {
        if ($scope.$parent.toggleColumnsSettings) {
          $scope.$parent.toggleColumnsSettings();
        }
      };

      $scope.highlightData = function (header, user) {
        lastRows.forEach(e => e.classList.remove('color-5-counter'));
        lastCols.forEach(e => e.classList.remove('color-5-counter'));
        const rows = document.querySelectorAll(`[row-owner="${user}"]`);
        const cols = document.querySelectorAll(`[col-owner="${header}"]`);
        rows.forEach(e => e.classList.add('color-5-counter'));
        cols.forEach(e => e.classList.add('color-5-counter'));
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
    templateUrl: appModule.Root + '/app/directives/customerCounter/customerCounter.html?v=' + appVersion
  };
}]);

// Combined Filters + Columns directive for unified bottom sheet
// appModule.directive('customerCounterFiltersColumns', [function () {
//   return {
//     restrict: 'E',
//     scope: false,
//     template: [
//       '<div class="cc-filters-columns-wrapper">',
//       '  <customer-counter-filters></customer-counter-filters>',
//       '  <div class="cc-divider" aria-hidden="true"></div>',
//       '  <div class="columns-section">',
//       '    <h4 class="section-title">{{Translate(\'Columns\')}}</h4>',
//       '    <div class="quick-actions-row">',
//       '      <button class="show-only-active-btn" ng-click="showOnlyActivePlayers()">',
//       '        <i class="fas fa-user-check"></i><span>{{Translate(\'Only Active\')}}</span>',
//       '      </button>',
//       '      <button class="show-all-columns-btn" ng-click="showAllColumns()">',
//       '        <i class="fas fa-eye"></i><span>{{Translate(\'Show All\')}}</span>',
//       '      </button>',
//       '    </div>',
//       '    <div class="columns-list">',
//       '      <div class="column-toggle" ng-repeat="column in totals" ng-click="toggleColumn(column)">',
//       '        <span class="column-name">{{Translate(column.system)}}</span>',
//       '        <span class="md3-checkbox" ng-class="{\'checked\': !column.hidden}">',
//       '          <svg class="checkbox-icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">',
//       '            <rect class="checkbox-background" x="1" y="1" width="16" height="16" rx="2" fill="none" />',
//       '            <path class="checkbox-checkmark" d="M4 9 L7.5 12.5 L14 5" fill="none" />',
//       '          </svg>',
//       '        </span>',
//       '      </div>',
//       '    </div>',
//       '  </div>',
//       '</div>'
//     ].join('')
//   };
// }]);

appModule.directive('customerCounterFiltersColumns', [function () {
  return {
    restrict: 'E',
    scope: false,
    template: [
      '<div class="cc-filters-columns-wrapper">',
      '  <customer-counter-filters></customer-counter-filters>',
      '</div>'
    ].join('')
  };
}]);
// Reusable filters directive for Customer Counter (desktop panel & mobile bottom sheet)
appModule.directive('customerCounterFilters', ['$timeout', function ($timeout) {
  return {
    restrict: 'E',
    scope: false, // inherit parent (controller) scope directly
    template: [
      '<div class="cc-filters-wrapper">',
      '  <div class="row">',
      '    <div class="col-sm-6">',
      '      <div class="form-inline">',
      '        <div class="form-group d-flex justify-content-between">',
      '          <label for="PeriodsInput">{{Translate(\'Reporting Period :\')}}</label>',
      '          <select id="PeriodsInput" class="form-control custom-dropdown"',
      '                  ng-model="selectedWeek"',
      '                  ng-change="onWeekChange(selectedWeek)"',
      '                  ng-options="wR as wR.DateRange for wR in WeeksRange track by wR.Index"></select>',
      '        </div>',
      '      </div>',
      '    </div>',
      '    <div class="col-sm-6" ng-if="AgentAsCustomerInfo.AgentType == \'M\'">',
      '      <div class="form-inline">',
      '        <div class="form-group d-flex justify-content-between">',
      // '          <label for="agentSearchTrigger">{{Translate(\'Choose an account:\')}}</label>',
      '           <div class="delegate-search-input-wrapper w-100 d-flex align-items-center">',
          '          <input type="text"',
          '                 id="agentSearchTrigger"',
          '                 class="form-control"',
          '                 ng-model="$root.selectedAgent.AgentBind"',
          '                 ng-click="openAgentSearchSheet()"',
          '                 readonly',
          '                 placeholder="{{Translate(\'Tap to search\')}}"',
          '                 style="cursor:pointer;">',
          '       </div>',
      '        </div>',
      '      </div>',
      '    </div>',
      '  </div>',
      '</div>',
      '<style>',
      '  .delegate-search-input-wrapper { position: relative;border-radius: 9999px;display: flex;padding: 4px 14px;background: white; }',
      '  .delegate-search-input-wrapper input { padding-right: 35px;border: none;background: none!important;box-shadow: none; }',
      '  .delegate-search-input-wrapper::after {',
      '    content: "\\f002";',
      '    font-family: "Font Awesome 5 Free";',
      '    font-weight: 900;',
      '    position: absolute;',
      '    right: 12px;',
      '    top: 50%;',
      '    transform: translateY(-50%);',
      '    pointer-events: none;',
      '    color: #999;',
      '    opacity: 0.7;',
      '  }',
      '</style>'
    ].join('')
  };
}]);

// Columns settings directive for Customer Counter
appModule.directive('customerCounterColumns', [function () {
  return {
    restrict: 'E',
    scope: false, // inherit parent (controller) scope directly
    template: [
      '<div class="cc-columns-wrapper">',
      '  <h4 style="margin-top: 0; margin-bottom: 15px; font-weight: bold;">{{Translate(\'Columns\')}}</h4>',
      '  ',
      '  <!-- Quick Action Buttons -->',
      '  <div class="quick-actions-row">',
      '    <button class="show-only-active-btn" ng-click="showOnlyActivePlayers()">',
      '      <i class="fas fa-user-check"></i>',
      '      <span>{{Translate(\'Only Active\')}}</span>',
      '    </button>',
      '    <button class="show-all-columns-btn" ng-click="showAllColumns()">',
      '      <i class="fas fa-eye"></i>',
      '      <span>{{Translate(\'Show All\')}}</span>',
      '    </button>',
      '  </div>',
      '  ',
      '  <!-- Columns List -->',
      '  <div class="columns-list">',
      '    <div class="column-toggle" ng-class="{\'active\': !column.hidden}" ng-repeat="column in totals" ng-click="toggleColumn(column)">',
      '      <div style="display: flex; align-items: center; gap: 8px; flex: 1;">',
      '        <span class="column-name">{{Translate(column.system)}}</span>',
      '        <span class="column-total-badge" ng-if="column.count > 0" style="',
      '          background: var(--md-sys-color-primary-container, #D0E4FF);',
      '          color: var(--md-sys-color-on-primary-container, #001D36);',
      '          padding: 2px 8px;',
      '          border-radius: 12px;',
      '          font-size: 11px;',
      '          font-weight: 600;',
      '          min-width: 20px;',
      '          text-align: center;',
      '        ">{{column.count}}</span>',
      '      </div>',
      '      <span class="md3-checkbox" ng-class="{\'checked\': !column.hidden}">',
      '        <svg class="checkbox-icon" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">',
      '          <rect class="checkbox-background" x="1" y="1" width="16" height="16" rx="2" />',
      '          <path class="checkbox-checkmark" d="M4 9 L7.5 12.5 L14 5" />',
      '        </svg>',
      '      </span>',
      '    </div>',
      '  </div>',
      '</div>',
      '<style>',
      '  .cc-columns-wrapper { padding: 10px 0; }',
      '  ',
      '  .quick-actions-row {',
      '    display: flex;',
      '    gap: 8px;',
      '    margin-bottom: 15px;',
      '  }',
      '  ',
      '  .show-only-active-btn,',
      '  .show-all-columns-btn {',
      '    flex: 1;',
      '    padding: 12px 16px;',
      '    border: none;',
      '    border-radius: 20px;',
      '    font-weight: 500;',
      '    font-size: 14px;',
      '    cursor: pointer;',
      '    transition: all 0.2s ease;',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '    gap: 6px;',
      '  }',
      '  ',
      '  .show-only-active-btn {',
      '    background: #fbbf24;',
      '    color: #1f2937;',
      '  }',
      '  ',
      '  .show-all-columns-btn {',
      '    background: #10b981;',
      '    color: white;',
      '  }',
      '  ',
      '  .columns-list {',
      '    display: flex;',
      '    flex-wrap: wrap;',
      '    gap: 8px;',
      '  }',
      '  ',
      '  .column-toggle {',
      '    display: inline-flex;',
      '    align-items: center;',
      '    gap: 8px;',
      '    padding: 8px 12px;',
      '    background: #1f2937;',
      '    border-radius: 20px;',
      '    cursor: pointer;',
      '    transition: all 0.2s ease;',
      '  }',
      '  ',
      '  .column-name {',
      '    font-weight: 500;',
      '    font-size: 14px;',
      '    white-space: nowrap;',
      '  }',
      '  ',
      '  .md3-checkbox {',
      '    width: 18px;',
      '    height: 18px;',
      '    flex-shrink: 0;',
      '    display: flex;',
      '    align-items: center;',
      '    justify-content: center;',
      '  }',
      '  ',
      '  .checkbox-icon {',
      '    width: 18px;',
      '    height: 18px;',
      '  }',
      '  ',
      '  .checkbox-background {',
      '    fill: transparent !important;',
      '    stroke: transparent !important;',
      '    stroke-width: 0;',
      '  }',
      '  ',
      '  .checkbox-checkmark {',
      '    stroke: transparent !important;',
      '    stroke-width: 2.5;',
      '    stroke-linecap: round;',
      '    stroke-linejoin: round;',
      '    fill: none !important;',
      '    stroke-dasharray: 16;',
      '    stroke-dashoffset: 16;',
      '    opacity: 0;',
      '    transition: all 0.2s ease;',
      '  }',
      '  ',
      '  .md3-checkbox.checked .checkbox-checkmark {',
      '    stroke: #33618D !important;',
      '    stroke-dashoffset: 0 !important;',
      '    opacity: 1;',
      '  }',
      '</style>'
    ].join('')
  };
}]);