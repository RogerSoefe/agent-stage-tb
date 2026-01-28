appModule.controller("customerCounterController", [
  '$rootScope', '$scope', '$agentService', '$compile', '$timeout', 'DTOptionsBuilder', 'DTColumnDefBuilder', 'fabService', 'bottomSheet', 'genericSearchService', '$location', function ($rootScope, $scope, $agentService, $compile, $timeout, DTOptionsBuilder, DTColumnDefBuilder, fabService, bottomSheet, genericSearchService, $location) {

    // Expose fabService to the scope for view binding
    $scope.fabService = fabService;

     // Initialize FAB - must be called after all functions are defined
    function initializeFAB() {
        // No crear el FAB si UseOldViews está activo
        if ($rootScope.UseOldViews) {
          return;
        }
        
        // Only show FAB if we're on the /customerCounter route
        if ($location.path() === '/customerCounter') {
          fabService.setButtons([
            { icon: 'fas fa-print', action: $scope.openExportOptions, visible: true }
          ]);
          fabService.show();
        }
      }    

    // Monitor route changes to hide FAB when leaving this view
    const routeChangeHandler = $rootScope.$on('$routeChangeStart', function (event, next, current) {
      // Hide FAB and reset filters when navigating away from /customerCounter
      if (current && current.$$route && current.$$route.originalPath === '/customerCounter') {
        fabService.reset();
        // Reset breadcrumbs and filtered agent state
        $scope.filteredByAgent = null;
        $scope.breadcrumbs = [];
        // Clear tableData and fullTreeNodes to ensure clean state
        $scope.tableData = [];
        $scope.fullTreeNodes = null;
        $scope.fullTreeNodesOriginal = null;
      }
      
      // Reset filters and reload data when entering /customerCounter
      if (next && next.$$route && next.$$route.originalPath === '/customerCounter') {
        // Ensure filters are reset when entering the route
        $timeout(function() {
          $scope.filteredByAgent = null;
          $scope.breadcrumbs = [];
          // Clear data before reload
          $scope.tableData = [];
          $scope.fullTreeNodes = null;
          // Reload data to ensure we start with full unfiltered view
          if (isInitialized && $scope.getData) {
            $scope.getData();
          }
        }, 0);
      }
    });

    // Clean up on controller destruction
    $scope.$on('$destroy', function () {
      routeChangeHandler(); // Unregister route change listener
      fabService.reset(); // Clean up FAB when scope is destroyed
      // Reset breadcrumbs and filtered agent state
      $scope.filteredByAgent = null;
      $scope.breadcrumbs = [];
      // Clear all data
      $scope.tableData = [];
      $scope.fullTreeNodes = null;
      $scope.fullTreeNodesOriginal = null;
    });

    $scope.Filter = {
      startDate: (moment().subtract(7, "days")).format('MM/DD/YYYY'),
      endDate: moment().format('MM/DD/YYYY')
    }

    let isInitialized = false; // Flag para prevenir re-inicialización

        // Debug utility function - logs RAPTOR1 test agent data for QA purposes
    function debugAgentData(rawData, agentId = 'RAPTOR1') {
      const records = rawData.filter(item =>
        (item.AgentID || '').trim().toUpperCase() === agentId ||
        (item.CustomerID || '').trim().toUpperCase() === agentId
      );
      console.log(`${agentId} records in rawData:`, records.length);
      if (records.length > 0) {
        console.log(`First ${agentId} record:`, {
          AgentID: records[0].AgentID,
          CustomerID: records[0].CustomerID,
          MasterAgentID: records[0].MasterAgentID,
          ignore: records[0].ignore
        });
      }
    }

    function Init() {
      if (isInitialized) return; // Prevenir múltiples inicializaciones

      jQuery('input[name="filterDate"]').daterangepicker({
        locale: {
          firstDay: 1
        },
        singleDatePicker: true,
        showDropdowns: true,
        opens: 'left',
        dateFormat: 'mm/dd/yyyy'
      });
      if ($agentService.AgentAsCustomerInfo) {
        $scope.selectedAgent = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
        $rootScope.selectedAgent = $scope.selectedAgent; // Sync with rootScope
        $scope.AllAgentsListOriginal = $scope.AllAgentsList ? angular.copy($scope.AllAgentsList) : [];
        $scope.WeeksRange = $agentService.GetWeeksRange();
        $scope.selectedWeek = $scope.WeeksRange[0];
        isInitialized = true;

        // Initialize FAB after all functions are ready
        initializeFAB();

        $scope.getData();
      } else {
        // Guardar el deregistrar para limpiar el listener
        const deregister = $rootScope.$on('AgentAsCustomerInfoReady', function () {
          if (isInitialized) return; // Prevenir ejecución múltiple

          $scope.selectedAgent = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
          $rootScope.selectedAgent = $scope.selectedAgent; // Sync with rootScope
          // Crear una copia inmutable de AllAgentsList para búsquedas
          $scope.AllAgentsListOriginal = $scope.AllAgentsList ? angular.copy($scope.AllAgentsList) : [];
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.selectedWeek = $scope.WeeksRange[0];
          isInitialized = true;

          // Initialize FAB after all functions are ready
          initializeFAB();

          $scope.getData();

          // Destruir el listener después de la primera ejecución
          deregister();
        });
      }

      // Initialize drag to dismiss after DOM is ready
      $timeout(function () {
        $scope.initDragToDismiss();
      }, 500);
    }

    $scope.tableTab = {
      selected: 1
    }

        // Theme mode - 'light' or 'dark'
    $scope.themeMode = 'light'; // Default to light mode

    // Breadcrumbs feature flag and state
    $scope.usarBreadcrumbs = false;
    $scope.breadcrumbs = [];
    $scope.filteredByAgent = null;

    $rootScope.UseOldViews = SETTINGS.UseOldViews || false;

    let isLoadingData = false; // Flag para prevenir llamadas simultáneas

    // Handle week change - receives the updated value as parameter
    $scope.onWeekChange = function(newWeek) {
      console.log('onWeekChange called with:', newWeek);
      console.log('Current $scope.selectedWeek:', $scope.selectedWeek);
      
      // If newWeek is passed, use it; otherwise fall back to $scope.selectedWeek
      var weekToUse = newWeek || $scope.selectedWeek;
      
      // Update $scope.selectedWeek to ensure it's in sync
      if (newWeek && newWeek !== $scope.selectedWeek) {
        $scope.selectedWeek = newWeek;
      }
      
      console.log('Updated $scope.selectedWeek:', $scope.selectedWeek);
      
      // Pass the week to getData() instead of relying on $scope.selectedWeek
      $scope.getData(weekToUse);
      
      // Close bottom sheet if it's open
      if ($scope.close) {
        $scope.close('period');
      }
    };

    $scope.getDataOld = function () {
      $scope.counterLoaded = false;
      $scope.playersTotal = 0;
      $scope.showLoadingGif('loadingCustomerCounter');
      let params = { agentId: $rootScope.selectedAgent ? $rootScope.selectedAgent.AgentId : $agentService.AgentAsCustomerInfo.AgentID, weekNumber: $scope.selectedWeek.Index };
      $scope.totals = [];
      $scope.tableData = [];
      $agentService.GetCountersByAgentIdV2(params).then(function (response) {
        if (response.data.d.Data.length == 0) {
          $scope.hideLoadingGif('loadingCustomerCounter');
          return;
        } else {
          const groupedData = CommonFunctions.groupBy(response.data.d.Data, 'CustomerID');
          let customers = Object.keys(groupedData).map((key) => groupedData[key]);
          let totalPlatform = { system: 'Total', count: 0 };
          customers.forEach(function (customer, idx) {
            const hierarchyCB = customer[0].HierarchyCurrentBalance.split(' / ');
            $scope.tableData = [...$scope.tableData, ...[{ Hierarchy: customer[0].Hierarchy, CustomerID: customer[0].CustomerID, AgentID: customer[0].AgentID.trim(), MasterAgentID: customer[0].MasterAgentID.trim(), Systems: '', SystemsArray: [], Rate: customer[0].Rate, HierarchyCurrentBalance: customer[0].HierarchyCurrentBalance, 'Current Balance': hierarchyCB[hierarchyCB.length - 1] }]];
            if (customer.length == 1 && customer[0].System == 'Virtual Casino') {
              const system = $scope.totals.find(x => x.system == 'Casino Only');
              if (system) system.count++;
              else $scope.totals.push({ system: 'Casino Only', count: 1 });              
              $scope.tableData[idx].Systems += 'Casino Only';
              $scope.tableData[idx].SystemsArray.push({ system: ('Casino Only') });
            } else {
              customer.forEach(function (data) {
                $scope.tableData[idx].SystemsArray.push({ system: (data.System || 'Other') });
                $scope.tableData[idx].Systems += (data.System || 'Other');
                const system = $scope.totals.find(x => (x.system || 'Other') == (data.System || 'Other'));
                if (system) {
                  system.count++;
                } else {
                  $scope.totals.push({ system: (data.System || 'Other'), count: 1 })
                }
                if (data.System == 'Inet' || data.System == 'Phone') {
                  totalPlatform.count++;
                }
              });
            }
          });
          $scope.playersTotal = $scope.tableData.length;
          const tempData = [...$scope.tableData];
          for (var j = 0; j < $scope.tableData.length; j++) {
            const d = $scope.tableData[j];
            const hierArray = [$rootScope.selectedAgent.AgentId.trim(), ...d.Hierarchy.split(' / ').filter(x => x.trim() != '' && x.trim() != $rootScope.selectedAgent.AgentId.trim())];
            const hierCBArray = [...d.HierarchyCurrentBalance.split(' / ')];
            for (let i = hierArray.length - 1; i >= 0; i--) {              
              const parentIndex = i - 1;
              if (parentIndex >= 0) {
                if (!tempData.some(x => x.AgentID.trim() == hierArray[i].trim()))
                  tempData.splice(1, 0,
                    {
                      AgentID: hierArray[i].trim(),
                      MasterAgentID: hierArray[parentIndex].trim(), 'Current Balance': hierCBArray[i],
                      SystemsArray: [], ignore: true, Hierarchy: hierArray.slice(0, i + 1).join(' / ')
                    })
              }
            }
          }
          $scope.tableData = tempData;
          //Note: esto es para que Inter y Phone salgan de primero
          let findInetIndx = $scope.totals.findIndex(x => x.system == 'Inet');
          let tempTotals = [];
          tempTotals.push({ system: 'Total Active Players', count: 0 });
          if (findInetIndx > -1) tempTotals.push($scope.totals.splice(findInetIndx, 1)[0]);
          let findPhoneIndx = $scope.totals.findIndex(x => x.system == 'Phone');
          if (findPhoneIndx > -1) tempTotals.push($scope.totals.splice(findPhoneIndx, 1)[0]);
          let horseIndx = $scope.totals.findIndex(x => x.system == 'Horses');
          if (horseIndx > -1) tempTotals.push($scope.totals.splice(horseIndx, 1)[0]);
          let vCasinoIndx = $scope.totals.findIndex(x => x.system == 'Virtual Casino');
          if (vCasinoIndx > -1) tempTotals.push($scope.totals.splice(vCasinoIndx, 1)[0]);
          let propsIndx = $scope.totals.findIndex(x => x.system == 'Props-Builder');
          if (propsIndx > -1) tempTotals.push($scope.totals.splice(propsIndx, 1)[0]);
          let dLiveIndx = $scope.totals.findIndex(x => x.system == 'D-Live');
          if (dLiveIndx > -1) tempTotals.push($scope.totals.splice(dLiveIndx, 1)[0]);
		   let dynamicLiveIndx = $scope.totals.findIndex(x => x.system == 'Dynamic Live');
          if (dynamicLiveIndx > -1) tempTotals.push($scope.totals.splice(dynamicLiveIndx, 1)[0]);
          let ezIndx = $scope.totals.findIndex(x => x.system == 'EZLiveBet');
          if (ezIndx > -1) tempTotals.push($scope.totals.splice(ezIndx, 1)[0]);

          let ultimateLiveIndx = $scope.totals.findIndex(x => x.system == 'Ultimate Live');
          if (ultimateLiveIndx > -1) tempTotals.push($scope.totals.splice(ultimateLiveIndx, 1)[0]);

          let btCasinoIndx = $scope.totals.findIndex(x => x.system == 'BTCasino');
          if (btCasinoIndx > -1) tempTotals.push($scope.totals.splice(btCasinoIndx, 1)[0]);
          let vipCasinoIndx = $scope.totals.findIndex(x => x.system == 'VIP Casino');
          if (vipCasinoIndx > -1) tempTotals.push($scope.totals.splice(vipCasinoIndx, 1)[0]);

          let cVigCasinoIndx = $scope.totals.findIndex(x => x.system == 'VIG Casino');
          if (cVigCasinoIndx > -1) tempTotals.push($scope.totals.splice(cVigCasinoIndx, 1)[0]);

          let goldenGamingIndx = $scope.totals.findIndex(x => x.system == 'Golden Gaming');
          if (goldenGamingIndx > -1) tempTotals.push($scope.totals.splice(goldenGamingIndx , 1)[0]);

          let dragonGamingIndx = $scope.totals.findIndex(x => x.system == 'Dragon Gaming');
          if (dragonGamingIndx > -1) tempTotals.push($scope.totals.splice(dragonGamingIndx , 1)[0]);
          

          let liveDealerIndx = $scope.totals.findIndex(x => x.system == 'VIP LiveDealer');
          if (liveDealerIndx > -1) tempTotals.push($scope.totals.splice(liveDealerIndx, 1)[0]);
          let liveCasinoIndx = $scope.totals.findIndex(x => x.system == 'Live Casino');
          if (liveCasinoIndx > -1) tempTotals.push($scope.totals.splice(liveCasinoIndx, 1)[0]);
          let evoCasinoIndx = $scope.totals.findIndex(x => x.system == 'EvoCasino');
          if (evoCasinoIndx > -1) tempTotals.push($scope.totals.splice(evoCasinoIndx, 1)[0]);
          let wMLiveDealerIndx = $scope.totals.findIndex(x => x.system == 'WMLiveDealer');
          if (wMLiveDealerIndx > -1) tempTotals.push($scope.totals.splice(wMLiveDealerIndx, 1)[0]);

          let casinoOnlyIndx = $scope.totals.findIndex(x => x.system == 'Casino Only');
          if (casinoOnlyIndx > -1) tempTotals.push($scope.totals.splice(casinoOnlyIndx, 1)[0]);

          let wmCasinoIndx = $scope.totals.findIndex(x => x.system == 'WM Casino');
          if (wmCasinoIndx > -1) tempTotals.push($scope.totals.splice(wmCasinoIndx, 1)[0]);

          let bingoIndx = $scope.totals.findIndex(x => x.system == 'Bingo');
          if (bingoIndx > -1) tempTotals.push($scope.totals.splice(bingoIndx, 1)[0]);
          let euroPrimeIndx = $scope.totals.findIndex(x => x.system == 'EuroPrime');
          if (euroPrimeIndx > -1) tempTotals.push($scope.totals.splice(euroPrimeIndx, 1)[0]);

          let pokerIndx = $scope.totals.findIndex(x => x.system == 'Poker');
          if (pokerIndx > -1) tempTotals.push($scope.totals.splice(pokerIndx, 1)[0]);
          let cFightIndx = $scope.totals.findIndex(x => x.system == 'CockFight');
          if (cFightIndx > -1) tempTotals.push($scope.totals.splice(cFightIndx, 1)[0]);

          $scope.totals = [...tempTotals, ...$scope.totals];

          $scope.totals.push({ system: 'Current Balance', count: 0 });
        }

        function buildAgentTree(data) {
          const agentMap = new Map();

          // Create a map where AgentID is the key
          for (const agent of data) {
            agentMap.set(agent.AgentID.trim(), { ...agent, children: [] });
          }

          const rootAgents = [];

          function countSystems(system, agent) {
            agent.children.forEach(c => {
              if (c.children && c.children.length > 0) {
                countSystems(system, c);
                agent[`${system}`] = agent[`${system}`] ? agent[`${system}`] + (c[`${system}`] || 0) : (c[`${system}`] || 0);
              }
              else {
                if (c.SystemsArray.some(s => s.system == system)) {
                  c[`${system}`] = 1;
                  agent[`${system}`] = agent[`${system}`] ? agent[`${system}`] + 1 : 1;
                }
              }
              
            })
          }

          function prepareSystems() {
            for (const node of rootAgents) {
              $scope.totals.filter(t => t.system != 'Total' && t.system != 'Total Active Players' && t.system != 'Current Balance').forEach((t, i) => {
                countSystems(t.system, node);
              })
            }
          }

          function insertInOrder(list, item) {
            // Encuentra la posición correcta
            let index = list.findIndex(currentItem => currentItem.AgentID.trim().localeCompare(item.AgentID.trim()) > 0);

            // Si no se encontró una posición más grande, inserta al final
            if (index === -1) index = list.length;

            // Inserta el elemento en la posición encontrada
            list.splice(index, 0, item);

            return list;
          }
          // Build the tree by iterating through the agents
          for (const agent of data) {
            const parentAgent = agentMap.get(agent.AgentID);
            const masterAgentID = agentMap.get(agent.MasterAgentID) ? agentMap.get(agent.MasterAgentID).AgentID : null;
            if (!masterAgentID) {
              // If it's a root agent, add it to the rootAgents array
              if (!parentAgent.ignore)
                parentAgent.children = parentAgent.children && parentAgent.children.length > 0 ? parentAgent.children : [{ ...agent }];
              agentMap.set(agent.MasterAgentID, { AgentID: agent.MasterAgentID, CustomerID: agent.CustomerID, children: [parentAgent], poison: true });
              const parentParent = agentMap.get(agent.MasterAgentID);
              insertInOrder(rootAgents, parentParent);
            } else {
              // If it's not a root agent, find its parent and add it as a child              
              const parentParent = agentMap.get(agent.MasterAgentID);
              if (!agent.ignore)
                insertInOrder(parentAgent.children, { ...agent, CustomerID: agent.CustomerID, children: [] });
              if (!parentParent.children.some(x => x.AgentID == parentAgent.AgentID)) {
                insertInOrder(parentParent.children, parentAgent);
              }
            }
          }

          function flattenTree(tree, level = 0) {
            let flatList = [];
            for (const node of tree) {
              const flattenedNode = {
                ...node,
                level: level,
                hasChildren: Array.isArray(node.children) && node.children.length > 0
              };

              flatList.push(flattenedNode);

              if (flattenedNode.hasChildren) {
                flatList = flatList.concat(flattenTree(flattenedNode.children, level + 1));
              }
            }

            return flatList;
          }

          function addLeafCount(tree) {
            function countLeaves(node) {
              // Si el nodo es una hoja, retorna 1
              if (!node.children || node.children.length === 0) {
                return 1;
              }

              // Cuenta las hojas de todos los hijos
              let leafCount = 0;
              for (const child of node.children) {
                leafCount += countLeaves(child);
              }
              return leafCount;
            }

            for (const node of tree) {
              if (node.children && node.children.length > 0) {
                // Si el nodo tiene hijos, cuenta las hojas entre sus descendientes
                node['Total Active Players'] = countLeaves(node);
              }

              // Procesa recursivamente los hijos del nodo
              if (node.children) {
                addLeafCount(node.children);
              }
            }
          }
          prepareSystems();
          addLeafCount(rootAgents);
          const result = flattenTree(rootAgents);
          return result;
        }
        $scope.tableData = buildAgentTree([...$scope.tableData]);
        $scope.counterLoaded = true;
        $scope.hideLoadingGif('loadingCustomerCounter');
      });

        

    }

        $scope.getData = function (weekOverride) {
      // Prevenir múltiples llamadas simultáneas
      if (isLoadingData) {
        return;
      }
      
      // Reset breadcrumbs and filtered agent state when loading fresh data
      $scope.filteredByAgent = null;
      $scope.breadcrumbs = [];

      // CRITICAL: Capture selectedAgent ONCE at the start to avoid accessing $rootScope later
      const selectedAgentId = ($rootScope.selectedAgent && $rootScope.selectedAgent.AgentId)
        ? $rootScope.selectedAgent.AgentId.trim()
        : null;

      isLoadingData = true;
      $scope.counterLoaded = false;
      $scope.playersTotal = 0;
      $scope.showLoadingGif('loadingCustomerCounter');
      
      // Use weekOverride if provided, otherwise fall back to $scope.selectedWeek
      var weekToUse = weekOverride || $scope.selectedWeek;
      
      console.log('getData() - selectedWeek:', $scope.selectedWeek);
      console.log('getData() - weekOverride:', weekOverride);
      console.log('getData() - weekToUse:', weekToUse);
      console.log('getData() - weekToUse.Index:', weekToUse ? weekToUse.Index : 'undefined');
      
      let params = { agentId: $rootScope.selectedAgent ? $rootScope.selectedAgent.AgentId : $agentService.AgentAsCustomerInfo.AgentID, weekNumber: weekToUse.Index };
      console.log('getData() - params:', params);
      $scope.totals = [];
      $scope.tableData = [];

      $agentService.GetCountersByAgentIdV2(params).then(function (response) {
        if (!response || !response.data || !response.data.d || !response.data.d.Data) {
          console.error('Invalid response structure from GetCountersByAgentIdV2');
          $scope.hideLoadingGif('loadingCustomerCounter');
          $scope.counterLoaded = true;
          isLoadingData = false;
          return;
        }

        const dataSize = JSON.stringify(response.data.d.Data).length;
        const dataSizeMB = (dataSize / (1024 * 1024)).toFixed(2);

        if (response.data.d.Data.length == 0) {
          $scope.hideLoadingGif('loadingCustomerCounter');
          $scope.counterLoaded = true;
          isLoadingData = false; // Liberar el flag
          return;
        } else {
          // Store raw data for agent tree building
          const rawData = response.data.d.Data;

          // Debug: Check if RAPTOR1 exists in rawData
          debugAgentData(rawData);

          const groupedData = CommonFunctions.groupBy(rawData, 'CustomerID');
          let customers = Object.keys(groupedData).map((key) => groupedData[key]);

          // buildAgentTree - ORIGINAL RECURSIVE LOGIC (optimized for large datasets)
          function buildAgentTree(data, selectedAgentId, rawData) {
            if (!data || data.length === 0) return [];

            const startTime = performance.now();

            // Group customers by AgentID for faster lookups
            const customersByAgent = new Map();
            const agentsById = new Map();

            for (let i = 0; i < data.length; i++) {
              const item = data[i];
              const agentId = (item.AgentID || '').trim();

              if (item.CustomerID && !item.ignore) {
                // Customer
                if (!customersByAgent.has(agentId)) {
                  customersByAgent.set(agentId, []);
                }
                customersByAgent.get(agentId).push(item);
              } else if (item.ignore) {
                // Agent node
                if (!agentsById.has(agentId)) {
                  agentsById.set(agentId, item);
                }
              }
            }

            // Also process rawData to find agent records that don't have CustomerID
            if (rawData) {
              let pureAgentCount = 0;
              for (let i = 0; i < rawData.length; i++) {
                const item = rawData[i];
                const agentId = (item.AgentID || '').trim();

                // Add agents that don't have CustomerID (pure agent records)
                if (!item.CustomerID && agentId && !agentsById.has(agentId)) {
                  pureAgentCount++;
                  agentsById.set(agentId, {
                    AgentID: agentId,
                    MasterAgentID: (item.MasterAgentID || '').trim(),
                    ignore: item.ignore || false,
                    Hierarchy: item.Hierarchy || '',
                    SystemsArray: item.SystemsArray || [],
                    'Current Balance': item['Current Balance'] || '0',
                    HierarchyCurrentBalance: item.HierarchyCurrentBalance || ''
                  });
                }
              }
            }

            // If selectedAgentId provided but not found in data, create it manually
            if (selectedAgentId && !agentsById.has(selectedAgentId)) {
              agentsById.set(selectedAgentId, {
                AgentID: selectedAgentId,
                MasterAgentID: '',
                ignore: false,
                Hierarchy: '',
                SystemsArray: [],
                'Current Balance': '0',
                HierarchyCurrentBalance: ''
              });
            }

            // Create implicit agent nodes for AgentIDs that have customers but no explicit agent entry
            for (const [agentId, customers] of customersByAgent) {
              if (!agentsById.has(agentId)) {
                // Infer MasterAgentID from first customer
                const firstCustomer = customers[0];
                const masterAgentId = (firstCustomer.MasterAgentID || '').trim();

                // Create implicit agent node
                agentsById.set(agentId, {
                  AgentID: agentId,
                  MasterAgentID: masterAgentId,
                  ignore: false,
                  Hierarchy: firstCustomer.Hierarchy || '',
                  SystemsArray: []
                });
              }
            }

            // Find root agents - either the selected agent or agents without master
            const rootAgents = [];

            if (selectedAgentId && agentsById.has(selectedAgentId)) {
              // Use the selected agent as the only root
              rootAgents.push(agentsById.get(selectedAgentId));
            } else {
              // Fallback: find all root agents
              for (const [agentId, agent] of agentsById) {
                const masterId = (agent.MasterAgentID || '').trim();
                if (!masterId || !agentsById.has(masterId)) {
                  rootAgents.push(agent);
                }
              }
            }

            // Recursive function to build tree with children
            // Use a single global Set to track ALL agents processed across entire tree
            const globalVisited = new Set();
            const MAX_DISPLAY_DEPTH = 1; // Only DISPLAY root + first level initially
            const MAX_CALCULATION_DEPTH = 999; // But CALCULATE totals for all levels

            function buildNode(item, level, maxDepth = MAX_CALCULATION_DEPTH, shouldFlatten = true) {
              // Stop at max depth
              if (level > maxDepth) {
                return null;
              }

              const agentId = (item.AgentID || '').trim();
              const isCustomer = item.CustomerID && !item.ignore;

              // Prevent infinite recursion - check for circular references using GLOBAL set
              if (!isCustomer && agentId) {
                if (globalVisited.has(agentId)) {
                  return null; // Return null instead of creating duplicate node
                }
                globalVisited.add(agentId);
              }

              // Create node copy
              const node = {
                ...item,
                level: level,
                children: [],
                hasChildren: false,
                collapse: false
              };

              if (!isCustomer && agentId) {
                // For agents, add their children
                const children = [];

                // Add sub-agents
                for (const [childAgentId, childAgent] of agentsById) {
                  if ((childAgent.MasterAgentID || '').trim() === agentId) {
                    children.push(childAgent);
                  }
                }

                // Add customers
                const customers = customersByAgent.get(agentId) || [];
                for (const customer of customers) {
                  children.push(customer);
                }

                // Sort children
                children.sort((a, b) => {
                  const aId = a.AgentID || a.CustomerID || '';
                  const bId = b.AgentID || b.CustomerID || '';
                  return aId.toString().localeCompare(bId.toString());
                });

                if (children.length > 0) {
                  node.hasChildren = true;
                  // Build ALL children for calculation purposes (use MAX_CALCULATION_DEPTH)
                  node.children = children.map(child => buildNode(child, level + 1, MAX_CALCULATION_DEPTH, false)).filter(c => c !== null);

                  // Calculate system counts and Total Active Players from children
                  let totalActivePlayers = 0;
                  const systemCounts = {};

                  for (const child of node.children) {
                    // Sum Total Active Players
                    if (child['Total Active Players']) {
                      totalActivePlayers += child['Total Active Players'];
                    }

                    // Sum system counts
                    for (const key in child) {
                      if (key !== 'children' &&
                        key !== 'level' &&
                        key !== 'hasChildren' &&
                        key !== 'collapse' &&
                        key !== 'Total Active Players' &&
                        key !== 'AgentID' &&
                        key !== 'MasterAgentID' &&
                        key !== 'CustomerID' &&
                        key !== 'Hierarchy' &&
                        key !== 'HierarchyCurrentBalance' &&
                        key !== 'Current Balance' &&
                        key !== 'Systems' &&
                        key !== 'SystemsArray' &&
                        key !== 'Rate' &&
                        key !== 'ignore' &&
                        typeof child[key] === 'number') {
                        systemCounts[key] = (systemCounts[key] || 0) + child[key];
                      }
                    }
                  }

                  // Assign totals to agent node
                  node['Total Active Players'] = totalActivePlayers;
                  Object.assign(node, systemCounts);
                }
              } else if (isCustomer) {
                // For customers, set Total Active Players = 1 and system counts
                node['Total Active Players'] = 1;

                // Set system counts based on SystemsArray
                if (item.SystemsArray && Array.isArray(item.SystemsArray)) {
                  for (const sysObj of item.SystemsArray) {
                    if (sysObj.system) {
                      node[sysObj.system] = 1;
                    }
                  }
                }
              }

              return node;
            }

            // Recursively flatten tree to array (depth-first)
            function flattenTree(node, result, maxDisplayDepth = MAX_DISPLAY_DEPTH) {
              // Create a flat copy WITHOUT children to avoid circular references
              const flatNode = { ...node };
              delete flatNode.children; // Remove children array to prevent cycles

              result.push(flatNode);

              // Only flatten children up to MAX_DISPLAY_DEPTH
              if (node.hasChildren && node.children && node.level < maxDisplayDepth) {
                // Recursively add children
                for (const child of node.children) {
                  flattenTree(child, result, maxDisplayDepth);
                }
              }

              return result;
            }            // Build and flatten the tree
            let result = [];
            let fullTreeNodes = []; // Store all built trees for later expansion
            rootAgents.sort((a, b) => a.AgentID.localeCompare(b.AgentID));

            for (const rootAgent of rootAgents) {
              const tree = buildNode(rootAgent, 0);
              if (tree !== null) {
                fullTreeNodes.push(tree); // Save full tree
                flattenTree(tree, result);
              }
            }

            const endTime = performance.now();

            // Store full trees in scope for dynamic expansion
            $scope.fullTreeNodes = fullTreeNodes;
            
            // Store original complete tree on first load (for agent search validation)
            if (!$scope.fullTreeNodesOriginal) {
              $scope.fullTreeNodesOriginal = fullTreeNodes;
            }

            return result;
          }

          // Procesar de forma SINCRÓNICA (sin chunks) para evitar recargas
          let totalPlatform = { system: 'Total', count: 0 };

          // Pre-allocar arrays para mejor performance
          $scope.tableData = new Array(customers.length);

          const startTime = performance.now();

          for (let idx = 0; idx < customers.length; idx++) {
            const customer = customers[idx];
            // Proteger contra null/undefined en HierarchyCurrentBalance
            const hierarchyCB = (customer[0].HierarchyCurrentBalance || '').split(' / ');
            const agentId = (customer[0].AgentID || '').trim();
            const masterAgentId = (customer[0].MasterAgentID || '').trim();

            $scope.tableData[idx] = {
              Hierarchy: customer[0].Hierarchy || '',
              CustomerID: customer[0].CustomerID,
              AgentID: agentId,
              MasterAgentID: masterAgentId,
              Systems: '',
              SystemsArray: [],
              Rate: customer[0].Rate,
              HierarchyCurrentBalance: customer[0].HierarchyCurrentBalance || '',
              'Current Balance': hierarchyCB[hierarchyCB.length - 1] || ''
            };

            if (customer.length == 1 && customer[0].System == 'Virtual Casino') {
              const system = $scope.totals.find(x => x.system == 'Casino Only');
              if (system) system.count++;
              else $scope.totals.push({ system: 'Casino Only', count: 1 });
              $scope.tableData[idx].Systems = 'Casino Only';
              $scope.tableData[idx].SystemsArray.push({ system: 'Casino Only' });
            } else {
              customer.forEach(function (data) {
                $scope.tableData[idx].SystemsArray.push({ system: (data.System || 'Other') });
                $scope.tableData[idx].Systems += (data.System || 'Other');
                const system = $scope.totals.find(x => (x.system || 'Other') == (data.System || 'Other'));
                if (system) {
                  system.count++;
                } else {
                  $scope.totals.push({ system: (data.System || 'Other'), count: 1 })
                }
                if (data.System == 'Inet' || data.System == 'Phone') {
                  totalPlatform.count++;
                }
              });
            }
          }

          const processingTime = performance.now() - startTime;

          // Add intermediate hierarchy nodes (using selectedAgentId from function start)
          $scope.playersTotal = $scope.tableData.length;

          // Debug: verify we have data
          if ($scope.tableData.length === 0) {
            console.error('No data in tableData after processing');
          }

          // Only process hierarchy if we have a selectedAgentId
          if (selectedAgentId) {
            const tempData = $scope.tableData.slice(); // Use slice() instead of spread

            for (var j = 0; j < $scope.tableData.length; j++) {
              const d = $scope.tableData[j];
              // Use selectedAgentId captured at function start (NOT $rootScope)
              const hierarchyStr = (d.Hierarchy || '').split(' / ').filter(x => x.trim() != '' && x.trim() != selectedAgentId);
              const hierArray = [selectedAgentId].concat(hierarchyStr); // Use concat instead of spread
              const hierCBArray = (d.HierarchyCurrentBalance || '').split(' / '); // Remove spread
              for (let i = hierArray.length - 1; i >= 0; i--) {
                const parentIndex = i - 1;
                if (parentIndex >= 0) {
                  if (!tempData.some(x => x.AgentID.trim() == hierArray[i].trim()))
                    tempData.splice(1, 0,
                      {
                        AgentID: hierArray[i].trim(),
                        MasterAgentID: hierArray[parentIndex].trim(), 'Current Balance': hierCBArray[i],
                        SystemsArray: [], ignore: true, Hierarchy: hierArray.slice(0, i + 1).join(' / ')
                      })
                }
              }
            }
            $scope.tableData = tempData;
          }

          //Note: esto es para que Inter y Phone salgan de primero
          let findInetIndx = $scope.totals.findIndex(x => x.system == 'Inet');
          let tempTotals = [];
          
          // Calculate Total Active Players count (total number of customers/players)
          const totalPlayersCount = $scope.tableData.filter(x => !x.hasChildren).length;
          tempTotals.push({ system: 'Total Active Players', count: totalPlayersCount });
          
          if (findInetIndx > -1) {
            const spliced = $scope.totals.splice(findInetIndx, 1);
            if (spliced.length > 0) tempTotals.push(spliced[0]);
          }
          let findPhoneIndx = $scope.totals.findIndex(x => x.system == 'Phone');
          if (findPhoneIndx > -1) {
            const spliced = $scope.totals.splice(findPhoneIndx, 1);
            if (spliced.length > 0) tempTotals.push(spliced[0]);
          }
          let horseIndx = $scope.totals.findIndex(x => x.system == 'Horses');
          if (horseIndx > -1) tempTotals.push($scope.totals.splice(horseIndx, 1)[0]);
          let vCasinoIndx = $scope.totals.findIndex(x => x.system == 'Virtual Casino');
          if (vCasinoIndx > -1) tempTotals.push($scope.totals.splice(vCasinoIndx, 1)[0]);
          let propsIndx = $scope.totals.findIndex(x => x.system == 'Props-Builder');
          if (propsIndx > -1) tempTotals.push($scope.totals.splice(propsIndx, 1)[0]);
          let dLiveIndx = $scope.totals.findIndex(x => x.system == 'D-Live');
          if (dLiveIndx > -1) tempTotals.push($scope.totals.splice(dLiveIndx, 1)[0]);
          let dynamicLiveIndx = $scope.totals.findIndex(x => x.system == 'Dynamic Live');
          if (dynamicLiveIndx > -1) tempTotals.push($scope.totals.splice(dynamicLiveIndx, 1)[0]);
          let ezIndx = $scope.totals.findIndex(x => x.system == 'EZLiveBet');
          if (ezIndx > -1) tempTotals.push($scope.totals.splice(ezIndx, 1)[0]);

          let ultimateLiveIndx = $scope.totals.findIndex(x => x.system == 'Ultimate Live');
          if (ultimateLiveIndx > -1) tempTotals.push($scope.totals.splice(ultimateLiveIndx, 1)[0]);

          let btCasinoIndx = $scope.totals.findIndex(x => x.system == 'BTCasino');
          if (btCasinoIndx > -1) tempTotals.push($scope.totals.splice(btCasinoIndx, 1)[0]);
          let vipCasinoIndx = $scope.totals.findIndex(x => x.system == 'VIP Casino');
          if (vipCasinoIndx > -1) tempTotals.push($scope.totals.splice(vipCasinoIndx, 1)[0]);

          let cVigCasinoIndx = $scope.totals.findIndex(x => x.system == 'VIG Casino');
          if (cVigCasinoIndx > -1) tempTotals.push($scope.totals.splice(cVigCasinoIndx, 1)[0]);

          let goldenGamingIndx = $scope.totals.findIndex(x => x.system == 'Golden Gaming');
          if (goldenGamingIndx > -1) tempTotals.push($scope.totals.splice(goldenGamingIndx , 1)[0]);

          let dragonGamingIndx = $scope.totals.findIndex(x => x.system == 'Dragon Gaming');
          if (dragonGamingIndx > -1) tempTotals.push($scope.totals.splice(dragonGamingIndx , 1)[0]);
          

          let liveDealerIndx = $scope.totals.findIndex(x => x.system == 'VIP LiveDealer');
          if (liveDealerIndx > -1) tempTotals.push($scope.totals.splice(liveDealerIndx, 1)[0]);
          let liveCasinoIndx = $scope.totals.findIndex(x => x.system == 'Live Casino');
          if (liveCasinoIndx > -1) tempTotals.push($scope.totals.splice(liveCasinoIndx, 1)[0]);
          let evoCasinoIndx = $scope.totals.findIndex(x => x.system == 'EvoCasino');
          if (evoCasinoIndx > -1) tempTotals.push($scope.totals.splice(evoCasinoIndx, 1)[0]);
          let wMLiveDealerIndx = $scope.totals.findIndex(x => x.system == 'WMLiveDealer');
          if (wMLiveDealerIndx > -1) tempTotals.push($scope.totals.splice(wMLiveDealerIndx, 1)[0]);

          let casinoOnlyIndx = $scope.totals.findIndex(x => x.system == 'Casino Only');
          if (casinoOnlyIndx > -1) tempTotals.push($scope.totals.splice(casinoOnlyIndx, 1)[0]);

          let wmCasinoIndx = $scope.totals.findIndex(x => x.system == 'WM Casino');
          if (wmCasinoIndx > -1) tempTotals.push($scope.totals.splice(wmCasinoIndx, 1)[0]);

          let bingoIndx = $scope.totals.findIndex(x => x.system == 'Bingo');
          if (bingoIndx > -1) tempTotals.push($scope.totals.splice(bingoIndx, 1)[0]);
          let euroPrimeIndx = $scope.totals.findIndex(x => x.system == 'EuroPrime');
          if (euroPrimeIndx > -1) tempTotals.push($scope.totals.splice(euroPrimeIndx, 1)[0]);

          let pokerIndx = $scope.totals.findIndex(x => x.system == 'Poker');
          if (pokerIndx > -1) tempTotals.push($scope.totals.splice(pokerIndx, 1)[0]);
          let cFightIndx = $scope.totals.findIndex(x => x.system == 'CockFight');
          if (cFightIndx > -1) tempTotals.push($scope.totals.splice(cFightIndx, 1)[0]);

          $scope.totals = tempTotals.concat($scope.totals); // Use concat instead of spread

          $scope.totals.push({ system: 'Current Balance', count: 0 });


          // Build agent tree with limited depth to prevent stack overflow
          const treeStartTime = performance.now();
          $scope.tableData = buildAgentTree($scope.tableData, selectedAgentId, rawData);
          const treeTime = performance.now() - treeStartTime;

          // Function to expand a node and load its children dynamically
          $scope.expandNode = function (agent) {
            if (!agent || !agent.hasChildren || agent.childrenLoaded) {
              return; // No children or already loaded
            }

            // Find the node in the full tree
            function findNodeInTree(tree, agentId) {
              if (tree.AgentID === agentId) return tree;
              if (tree.children && tree.children.length > 0) {
                for (let i = 0; i < tree.children.length; i++) {
                  const found = findNodeInTree(tree.children[i], agentId);
                  if (found) return found;
                }
              }
              return null;
            }

            let fullNode = null;
            for (let i = 0; i < $scope.fullTreeNodes.length; i++) {
              fullNode = findNodeInTree($scope.fullTreeNodes[i], agent.AgentID);
              if (fullNode) break;
            }

            if (!fullNode || !fullNode.children || fullNode.children.length === 0) {
              return; // No children found in full tree
            }

            // Find the position of this agent in tableData
            let parentIndex = -1;
            for (let i = 0; i < $scope.tableData.length; i++) {
              if ($scope.tableData[i].AgentID === agent.AgentID) {
                parentIndex = i;
                break;
              }
            }

            if (parentIndex === -1) return;

            // Flatten children to insert
            const childrenToInsert = [];
            function flattenChildren(node, result) {
              if (!node.children || node.children.length === 0) return;

              for (let i = 0; i < node.children.length; i++) {
                const child = node.children[i];
                // Create a shallow copy with all properties
                const flatChild = {};
                for (const key in child) {
                  if (child.hasOwnProperty(key) && key !== 'children') {
                    flatChild[key] = child[key];
                  }
                }
                result.push(flatChild);
              }
            }

            flattenChildren(fullNode, childrenToInsert);

            if (childrenToInsert.length === 0) return;

            // Insert children right after parent in tableData
            const insertArgs = [parentIndex + 1, 0].concat(childrenToInsert);
            Array.prototype.splice.apply($scope.tableData, insertArgs);

            // Mark as loaded
            agent.childrenLoaded = true;

            // Force Angular to detect changes and update both ng-repeats
            if (!$scope.$$phase && !$scope.$root.$$phase) {
              $scope.$apply();
            }
          };

          // Function to build breadcrumb hierarchy
          $scope.buildBreadcrumbs = function (agent) {
            if (!$scope.usarBreadcrumbs) return;

            const breadcrumbs = [];

            // Function to find agent path in tree
            function findAgentPath(tree, targetAgentId, path) {
              path = path || [];

              if (tree.AgentID === targetAgentId) {
                path.push({ AgentID: tree.AgentID, level: tree.level });
                return path;
              }

              if (tree.children && tree.children.length > 0) {
                path.push({ AgentID: tree.AgentID, level: tree.level });
                for (let i = 0; i < tree.children.length; i++) {
                  const result = findAgentPath(tree.children[i], targetAgentId, path.slice());
                  if (result) return result;
                }
              }

              return null;
            }

            // Find path to selected agent
            let path = null;
            for (let i = 0; i < $scope.fullTreeNodes.length; i++) {
              path = findAgentPath($scope.fullTreeNodes[i], agent.AgentID);
              if (path) break;
            }

            $scope.breadcrumbs = path || [];
          };

          // Function to filter data by agent (like selecting account)
          $scope.filterByAgent = function (agent) {
            if (!$scope.usarBreadcrumbs) return;

            console.log('filterByAgent called with:', agent.AgentID);
            $scope.filteredByAgent = agent.AgentID;
            console.log('filteredByAgent set to:', $scope.filteredByAgent);
            $scope.buildBreadcrumbs(agent);

            // Force Angular to detect changes for the chip immediately with $timeout
            $timeout(function() {
              // This ensures the view updates
            }, 0);

            // Filter tableData to show only this agent and its descendants
            const filteredData = [];

            function findNodeAndDescendants(agentId) {
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
              for (let i = 0; i < $scope.fullTreeNodes.length; i++) {
                targetNode = findNode($scope.fullTreeNodes[i], agentId);
                if (targetNode) break;
              }

              if (!targetNode) return [];

              // Flatten the node and all its descendants
              const result = [];
              function flattenNode(node) {
                const flatNode = {};
                for (const key in node) {
                  if (node.hasOwnProperty(key) && key !== 'children') {
                    flatNode[key] = node[key];
                  }
                }
                // ALWAYS push the node first (parent before children)
                result.push(flatNode);

                // Then push all children
                if (node.children && node.children.length > 0) {
                  for (let i = 0; i < node.children.length; i++) {
                    flattenNode(node.children[i]);
                  }
                }
              }

              flattenNode(targetNode);
              console.log('Filtered data:', result.length, 'items. First item:', result[0]);
              return result;
            }

            const newData = findNodeAndDescendants(agent.AgentID);

            console.log('Before reset - newData length:', newData.length);
            console.log('First item AgentID:', newData[0] ? newData[0].AgentID : 'undefined');
            console.log('First item hasChildren:', newData[0] ? newData[0].hasChildren : 'undefined');
            console.log('First item level:', newData[0] ? newData[0].level : 'undefined');

            // Log first 3 items to see the structure
            for (let i = 0; i < Math.min(3, newData.length); i++) {
              console.log(`Item ${i}: AgentID=${newData[i].AgentID}, level=${newData[i].level}, hasChildren=${newData[i].hasChildren}`);
            }

            // Reset collapse state for all nodes
            newData.forEach(function (node) {
              node.collapse = false;
              node.childrenLoaded = true;
            });

            $scope.tableData = newData;

            console.log('After assignment - tableData length:', $scope.tableData.length);
            console.log('tableData first item:', $scope.tableData[0] ? $scope.tableData[0].AgentID : 'undefined');

            // Force Angular to detect changes immediately for both columns
            if (!$scope.$$phase && !$scope.$root.$$phase) {
              $scope.$apply();
            }

            // Wait for DOM to render, then remove any expanded/child-visible classes
            $timeout(function () {
              // Remove all expanded and child-visible classes from previous state
              const allExpandedRows = document.querySelectorAll('.expanded');
              allExpandedRows.forEach(function (row) {
                row.classList.remove('expanded');
              });

              const allChildVisibleRows = document.querySelectorAll('.child-visible');
              allChildVisibleRows.forEach(function (row) {
                row.classList.remove('child-visible');
              });

              // Add tree-child class to all children (collapsed state)
              const allDataRows = document.querySelectorAll('.data-row');
              allDataRows.forEach(function (row) {
                const level = parseInt(row.getAttribute('level'));
                if (level > 1) {
                  row.classList.add('tree-child');
                }
              });
            }, 50);

            // Set the root node as expanded (only if it has children)
            if ($scope.tableData.length > 0) {
              const rootAgent = $scope.tableData[0];
              if (rootAgent && rootAgent.hasChildren) {
                rootAgent.collapse = true; // Mark as expanded
                rootAgent.childrenLoaded = true; // Mark children as loaded since they're in the filtered data
              }
            }

            // Wait for Angular to digest and DOM to update
            $timeout(function () {
              // Force another digest cycle to ensure both ng-repeats are updated
              if (!$scope.$$phase && !$scope.$root.$$phase) {
                $scope.$apply();
              }

              if ($scope.tableData.length > 0) {
                const rootAgent = $scope.tableData[0];

                // Only expand if it has children
                if (rootAgent && rootAgent.hasChildren) {
                  // Add expanded class to parent row
                  const parentRow = document.querySelector(`[row-owner="${rootAgent.AgentID.trim().RemoveSpecials()}"]`);
                  if (parentRow) {
                    parentRow.classList.add('expanded');
                  }

                  // Show child rows
                  $timeout(function () {
                    const childElements = document.querySelectorAll(`.row-${rootAgent.AgentID.RemoveSpecials()}-child`);
                    childElements.forEach(function (element) {
                      element.classList.remove('tree-child');
                      element.classList.add('child-visible');
                    });
                  }, 50);
                }
              }
            }, 100);

            // Scroll to top
            const scrollBox = document.getElementById('scrollBox');
            if (scrollBox) {
              scrollBox.scrollTop = 0;
            }
          };

          // (toggleFilters defined globally after getData)

          // Function to navigate breadcrumb
          $scope.navigateToBreadcrumb = function (index) {
            if (index >= $scope.breadcrumbs.length - 1) {
              // Clicking on current item, do nothing
              return;
            }

            const targetBreadcrumb = $scope.breadcrumbs[index];

            // Filter by the selected agent (even if it's the first one)
            const agent = {
              AgentID: targetBreadcrumb.AgentID,
              hasChildren: true,
              level: targetBreadcrumb.level
            };
            $scope.filterByAgent(agent);
          };

          $scope.counterLoaded = true;
          $scope.hideLoadingGif('loadingCustomerCounter');
          isLoadingData = false; // Liberar el flag al completar exitosamente

          // Pre-calculate agent search cache in background after data is loaded
          $timeout(function() {
            preCalculateAgentSearchCache();
          }, 100);
        }
      }).catch(function (error) {
        console.error('Error in GetCountersByAgentIdV2:', error);
        $scope.counterLoaded = true;
        $scope.hideLoadingGif('loadingCustomerCounter');
        $scope.tableData = [];
        $scope.totals = [];
        isLoadingData = false; // Liberar el flag en caso de error
        // Opcional: mostrar mensaje de error al usuario
        // alert('Error loading data. Please try again.');
      });
    }; // End of $scope.getData

    // Toggle columns settings panel for mobile
    $scope.toggleColumnsSettings = function () {
      var isMobile = window.innerWidth <= 767;
      
      if (isMobile) {
        // Open bottom sheet with columns settings
        bottomSheet.open({
          parentScope: $scope,
          template: '<customer-counter-columns></customer-counter-columns>',
          size: 'auto',
          onBeforeClose: function (sheetScope, reason) { }
        });
        return;
      }

      // Desktop behavior (toggle panel)
      const settingsPanel = document.getElementById('columnsSettingsPanel');
      const columnsBackdrop = document.getElementById('columnsBackdrop');
      const fabCheckbox = document.getElementById('fabCheckboxGlobal');

      if (settingsPanel) {
        settingsPanel.classList.toggle('show');
      }

      if (columnsBackdrop) {
        columnsBackdrop.classList.toggle('show');
      }

      // Close FAB menu
      if (fabCheckbox) {
        fabCheckbox.checked = false;
      }
    };

    // Drag to dismiss functionality for modals
    $scope.initDragToDismiss = function () {
      const modals = [
        { panel: 'dataFiltersPanel', backdrop: 'filtersBackdrop' },
        { panel: 'columnsSettingsPanel', backdrop: 'columnsBackdrop' }
      ];

      modals.forEach(function (modal) {
        const panel = document.getElementById(modal.panel);
        if (!panel) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        let initialTransform = 0;

        const onTouchStart = function (e) {
          const touch = e.touches[0];
          startY = touch.clientY;
          isDragging = true;

          // Get current transform value
          const transform = window.getComputedStyle(panel).transform;
          if (transform !== 'none') {
            const matrix = new DOMMatrix(transform);
            initialTransform = matrix.m42; // translateY value
          } else {
            initialTransform = 0;
          }

          panel.style.transition = 'none';
        };

        const onTouchMove = function (e) {
          if (!isDragging) return;

          const touch = e.touches[0];
          currentY = touch.clientY;
          const deltaY = currentY - startY;

          // Only allow dragging down
          if (deltaY > 0) {
            panel.style.transform = 'translateY(' + deltaY + 'px)';
          }
        };

        const onTouchEnd = function (e) {
          if (!isDragging) return;
          isDragging = false;

          const deltaY = currentY - startY;
          const threshold = 100; // pixels to drag before dismissing

          panel.style.transition = '';

          if (deltaY > threshold) {
            // Close the modal
            panel.classList.remove('show');
            const backdrop = document.getElementById(modal.backdrop);
            if (backdrop) {
              backdrop.classList.remove('show');
            }
            panel.style.transform = '';
          } else {
            // Snap back to original position
            panel.style.transform = '';
          }
        };

        // Add event listeners
        panel.addEventListener('touchstart', onTouchStart, { passive: true });
        panel.addEventListener('touchmove', onTouchMove, { passive: true });
        panel.addEventListener('touchend', onTouchEnd, { passive: true });
      });
    };

    // Initialize drag to dismiss after a short delay to ensure DOM is ready
    $timeout(function () {
      $scope.initDragToDismiss();
    }, 500);

    // Show only Total Active Players column
    $scope.showOnlyActivePlayers = function () {
      $scope.totals.forEach(function (column) {
        if (column.system === 'Total Active Players') {
          column.hidden = false;
        } else {
          column.hidden = true;
        }
        $scope.$broadcast('columnVisibilityChanged', column);
      });
    };

    // Show all columns
    $scope.showAllColumns = function () {
      $scope.totals.forEach(function (column) {
        column.hidden = false;
        $scope.$broadcast('columnVisibilityChanged', column);
      });
    };

    // Toggle individual column visibility
    $scope.toggleColumn = function (column) {
      column.hidden = !column.hidden;
      // Broadcast event to directive to update columns
      $scope.$broadcast('columnVisibilityChanged', column);
    };

    // Export functions for FAB buttons
    $scope.exportData = function () {
      const fabCheckbox = document.getElementById('fabCheckboxGlobal');
      if (fabCheckbox) {
        fabCheckbox.checked = false;
      }

      // Trigger the directive's ExportData function
      $scope.$broadcast('triggerExportData');
    };

    // New FAB action: full tree chunked export
    $scope.exportDataFullChunked = function () {
      const fabCheckbox = document.getElementById('fabCheckboxGlobal');
      if (fabCheckbox) {
        fabCheckbox.checked = false;
      }
      $scope.$broadcast('triggerExportDataFullChunked');
    };

    // Visible-only export (current expanded subset)
    $scope.exportDataVisible = function () {
      const fabCheckbox = document.getElementById('fabCheckboxGlobal');
      if (fabCheckbox) {
        fabCheckbox.checked = false;
      }
      $scope.$broadcast('triggerExportDataVisible');
    };

    // Open export options bottom sheet
    $scope.openExportOptions = function () {
      const fabCheckbox = document.getElementById('fabCheckboxGlobal');
      if (fabCheckbox) {
        fabCheckbox.checked = false;
      }

      bottomSheet.open({
        parentScope: $scope,
        template: `
          <div style="padding: 20px;">
            <h3 style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Export Options</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <button 
                ng-click="exportDataFullChunked(); closeBottomSheet();"
                style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;">
                <i class="fas fa-sitemap" style="font-size: 24px; color: #1976d2;"></i>
                <div style="text-align: left; flex: 1;">
                  <div style="font-weight: 600; margin-bottom: 4px;">Export Full Tree</div>
                  <div style="font-size: 13px; color: #666;">Export complete hierarchy regardless of expand/collapse state</div>
                </div>
              </button>
              <button 
                ng-click="exportDataVisible(); closeBottomSheet();"
                style="display: flex; align-items: center; gap: 12px; padding: 16px; background: #fff; border: 1px solid #e0e0e0; border-radius: 8px; cursor: pointer; font-size: 16px; transition: all 0.2s;">
                <i class="fas fa-eye" style="font-size: 24px; color: #1976d2;"></i>
                <div style="text-align: left; flex: 1;">
                  <div style="font-weight: 600; margin-bottom: 4px;">Export Visible Only</div>
                  <div style="font-size: 13px; color: #666;">Export only currently visible (expanded) rows</div>
                </div>
              </button>
            </div>
          </div>
        `,
        size: 'auto',
        onBeforeClose: function (sheetScope, reason) { }
      });
    };

    // Helper to close bottom sheet
    $scope.closeBottomSheet = function () {
      const backdrop = document.querySelector('.bottom-sheet-backdrop');
      if (backdrop) {
        backdrop.click();
      }
    };

    $scope.exportPDF = function () {
      const fabCheckbox = document.getElementById('fabCheckboxGlobal');
      if (fabCheckbox) {
        fabCheckbox.checked = false;
      }

      // Trigger the directive's Print function
      $scope.$broadcast('triggerPrint');
    };

    Init();

    // Helper function to get week display text
    $scope.getWeekDisplayText = function(week) {
      if (!week) return '';
      
      if (week.Index === 0) {
        return 'This Week (' + week.DateRange + ')';
      } else if (week.Index === 1) {
        return 'Last Week (' + week.DateRange + ')';
      } else {
        return week.DateRange;
      }
    };

    // Toggle filters panel (desktop) OR open bottom sheet (mobile)
    $scope.toggleFilters = function () {
      var isMobile = window.innerWidth <= 767;
      const fabCheckbox = document.getElementById('fabCheckboxGlobal');
      if (isMobile) {
        // Inicializar totals como array vacío si no existe
        if (!$scope.totals) {
          $scope.totals = [];
        }
        
        // Forzar recompilación del template para evitar caché
        var timestamp = Date.now();
        bottomSheet.open({
          parentScope: $scope,
          template: '<customer-counter-filters data-reload="' + timestamp + '"></customer-counter-filters>',
          size: 'auto',
          onBeforeClose: function (sheetScope, reason) { }
        });
        if (fabCheckbox) fabCheckbox.checked = false;
        return;
      }
      const filtersPanel = document.getElementById('dataFiltersPanel');
      const filtersBackdrop = document.getElementById('filtersBackdrop');
      if (filtersPanel) filtersPanel.classList.toggle('show');
      if (filtersBackdrop) filtersBackdrop.classList.toggle('show');
      if (fabCheckbox) fabCheckbox.checked = false;
    };

    // Helper function to check if agent has data (with cache for performance)
    var agentHasDataCache = {}; // Cache to avoid repeated tree searches
    var agentSearchCachePreCalculated = false; // Flag to track if cache is pre-calculated
    
    // Pre-calculate agent search cache in background
    function preCalculateAgentSearchCache() {
      if (agentSearchCachePreCalculated) return; // Already calculated
      
      console.log('Pre-calculating agent search cache...');
      const startTime = performance.now();
      
      if ($scope.AllAgentsListOriginal && $scope.AllAgentsListOriginal.length > 0) {
        for (var i = 0; i < $scope.AllAgentsListOriginal.length; i++) {
          var agent = $scope.AllAgentsListOriginal[i];
          if (agent && agent.AgentId) {
            // This will populate the cache
            $scope.agentHasData(agent.AgentId);
          }
        }
      }
      
      agentSearchCachePreCalculated = true;
      const endTime = performance.now();
      console.log('Agent search cache pre-calculated in ' + (endTime - startTime).toFixed(2) + 'ms');
    }
    
    $scope.agentHasData = function(agentId) {
      if (!agentId) return false;
      
      // Check cache first
      if (agentHasDataCache.hasOwnProperty(agentId)) {
        return agentHasDataCache[agentId];
      }
      
      // Search in fullTreeNodesOriginal (complete tree from first load) instead of fullTreeNodes (which may be filtered)
      if (!$scope.fullTreeNodesOriginal || $scope.fullTreeNodesOriginal.length === 0) {
        // Fallback to fullTreeNodes if original not available yet
        if (!$scope.fullTreeNodes || $scope.fullTreeNodes.length === 0) {
          return false;
        }
        var treesToSearch = $scope.fullTreeNodes;
      } else {
        var treesToSearch = $scope.fullTreeNodesOriginal;
      }
      
      // Recursive function to find agent in tree
      function findAgentInTree(node, targetAgentId) {
        if (node.AgentID && node.AgentID.trim() === targetAgentId.trim()) {
          return true;
        }
        if (node.children && node.children.length > 0) {
          for (let i = 0; i < node.children.length; i++) {
            if (findAgentInTree(node.children[i], targetAgentId)) {
              return true;
            }
          }
        }
        return false;
      }
      
      // Search in all root trees
      var result = false;
      for (let i = 0; i < treesToSearch.length; i++) {
        if (findAgentInTree(treesToSearch[i], agentId)) {
          result = true;
          break;
        }
      }
      
      // Cache the result
      agentHasDataCache[agentId] = result;
      
      return result;
    };

    // Helper function to select agent (used in search sheet)
    $scope.selectAgentFromSearch = function(agent) {
      if (!$scope.agentHasData(agent.AgentId)) {
        return; // Do nothing if agent has no data
      }
      $rootScope.selectedAgent = agent;
      $scope.selectedAgent = agent; // Sync with local scope
      // Reset filter when selecting a new agent from search
      $scope.filteredByAgent = null;
      $scope.breadcrumbs = [];
      $scope.getData();
    };

    // Filter function for agent search - only show agents with data
    $scope.filterWithData = function(agent) {
      return $scope.agentHasData(agent.AgentId);
    };

    // Open agent search using generic search service
    $scope.openAgentSearchSheet = function () {
      // If cache not pre-calculated yet, do it now (synchronously) before opening
      if (!agentSearchCachePreCalculated) {
        preCalculateAgentSearchCache();
      }
      
      genericSearchService.open({
        items: $scope.AllAgentsListOriginal || [],
        displayField: 'AgentBind',
        title: $scope.Translate('Select Agent'),
        placeholder: $scope.Translate('Search agents by name or ID...'),
        filterFn: $scope.filterWithData,
        badge: function(agent) {
          return agent.AgentId;
        },
        onSelect: $scope.selectAgentFromSearch,
        parentScope: $scope
        // preCalculate removed - cache is already pre-calculated in background
      });
    };

   

    // Initialize FAB immediately if AgentAsCustomerInfo is ready
    if ($agentService.AgentAsCustomerInfo && isInitialized) {
      initializeFAB();
    }
  }]);
// Helper to open filters bottom sheet (used when returning from search)
// $scope.openFiltersBottomSheet = function () {
//   // Unificar comportamiento: siempre abrir full-height y expansión automática
//   bottomSheet.open({
//     parentScope: $scope,
//     template: '<customer-counter-filters-columns></customer-counter-filters-columns>',
//     size: 'full',
//     autoExpandFull: true,
//     disableHandle: true
//   });
// };