appModule.controller("customerCounterController", [
  '$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {

    $scope.Filter = {
      startDate: (moment().subtract(7, "days")).format('MM/DD/YYYY'),
      endDate: moment().format('MM/DD/YYYY')
    }

    async function Init() {
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
        $scope.WeeksRange = $agentService.GetWeeksRange();
        $scope.selectedWeek = $scope.WeeksRange[0];

        $scope.getData();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.selectedAgent = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.selectedWeek = $scope.WeeksRange[0];

          $scope.getData();
        });
      }
    };

    $scope.tableTab = {
      selected: 1
    }

    $scope.getData = function () {
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

    Init();

  }]);
