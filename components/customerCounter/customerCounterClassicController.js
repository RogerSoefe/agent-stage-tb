appModule.controller("customerCounterClassicController", [
  '$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    let tableData2 = [];
    $scope.table2 = {};
    $scope.tableData = [];
    $scope.counterLoaded = false;
    $scope.table2.dtInstance = {};
    $scope.table2.dtOptions = DTOptionsBuilder.newOptions()
      //.withOption('stateSave', true)
      .withOption('aaData', {})
      .withOption('createdRow', function (row) {
        // Recompiling so we can bind Angular directive to the DT
        $compile(angular.element(row).contents())($scope);
      })
      .withOption('initComplete', function (settings) {
        // Recompiling so we can bind Angular directive to the DT
        $compile(angular.element('#' + settings.sTableId).contents())($scope);
        jQuery('.dt-buttons').find('a').tooltip();
        jQuery('#' + settings.sTableId + ' tbody').on('click', 'tr td', function (e) {
          if (jQuery(e.target).closest('span').length == 0) {
            $compile(angular.element('#' + settings.sTableId).contents())($scope);
            return;
          }
          jQuery(this).click();
        });
      })

      .withDOM('Bflrtip')
      .withOption('buttons', [
        { extend: 'copy', text: 'Copy' },
        { extend: 'excel', text: 'XLS' },
        { extend: 'pdf', text: 'PDF' },
        { extend: 'print', text: 'Print' }, {
          text: '<i class="fa fa-refresh">', titleAttr: 'Update', action: function (e, dt, node, config) {
            $scope.getData();
          }
        },
      ])
      .withOption('aaSorting', [])
      .withOption('lengthMenu', [[100, 500, 1000, 5000], [100, 500, 1000, 5000]])
      .withOption('pageLength', 100)
      .withOption('responsive', {
        details: {
          type: 'column',
          target: 2
        }
      })
      .withOption('drawCallback', function (setting) {
        if (!tableData2) return;
        let subTable = tableData2.slice(setting._iDisplayStart, tableData2.length);
        var api = this.api();
        var rows = api.rows({ page: 'current' }).nodes();
        var last = null;
        let counter = 1;
        subTable.forEach(function (group, i) {
          if (last != group.AgentID.trim()) {
            jQuery(rows).eq(i).before(
              (i > 0 ? '<tr><td colspan="3" class="p-0"><h5 class="bg-black text-white p-3">' + counter + ' ' + $scope.Translate('Players') + '</h5></td><td colspan="6"></td></tr>' : '') +
              `<tr class="bg-gray">
								<td colspan="3">							
									<div class="dropdown align-self-center mr-4">
										<div class="d-flex" role="button" aria-haspopup="true" aria-expanded="true" data-toggle="dropdown">
											<strong class="text-white">${$scope.formatCustomer(group.AgentID)}</strong>&nbsp;<span class="text-white">${$scope.Translate('Click here to see hierarchy')}</span>
										</div>
										<div class="dropdown-menu">
											<strong class="text-black p-3"> ${($scope.rawAgentsList ? $scope.getAgentParent(group.AgentID) + ' / ' + $scope.formatCustomer(group.AgentID) : $scope.formatCustomer(group.AgentID))}</strong>
										</div>
									</div>   
								</td>
							</tr>`
            );
            counter = 0;
            last = group.AgentID.trim();
          }
          counter++;
          if (i == subTable.length - 1) {
            jQuery(rows).eq(i).after(
              '<tr><td colspan="10" class="p-0"><h5 class="bg-black text-white p-3">' + counter + ' ' + $scope.Translate('Players') + '</h5></td><td colspan="6"></td></tr>'
            );
          }

        });
      })
      .withOption('aaSorting', [])
      .withOption('lengthMenu', [[100, 500, 1000, 5000], [100, 500, 1000, 5000]])
      .withOption('pageLength', 100);

    $scope.table2.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Customer ID')).renderWith(render2),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Desposit Amount')).renderWith(render2),
      DTColumnDefBuilder.newColumnDef(2).withTitle('').renderWith(render2).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render2(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<span>${$scope.AgentAsCustomerInfo.IsAffiliate ? '***' + full.CustomerID.trim().substring(full.CustomerID.trim().length - 4, full.CustomerID.trim().length) : full.CustomerID}</span>`;
        case 1:
          return CommonFunctions.FormatNumber(full.DepositAmount, true);
        default:
          return "";
      }
    }

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
          $scope.playersTotal = customers.length;
          customers.forEach(function (customer, idx) {
            $scope.tableData = [...$scope.tableData, ...[{ Hierarchy: customer[0].Hierarchy, CustomerID: customer[0].CustomerID, AgentID: customer[0].AgentID, Systems: '' }]];
            if (customer.length == 1 && customer[0].System == 'Virtual Casino') {
              const system = $scope.totals.find(x => x.system == 'Casino Only');
              if (system) system.count++;
              else {
                $scope.totals.push({ system: 'Casino Only', count: 1 });
                $scope.tableData[idx].Systems += 'Casino Only';
              }
            } else {
              customer.forEach(function (data) {
                $scope.tableData[idx].Systems += (data.System || 'Other');
                const system = $scope.totals.find(x => (x.system || 'Other') == (data.System || 'Other'));
                if (system) {
                  system.count++;
                } else {
                  $scope.totals.push({ system: (data.System || 'Other'), count: 1 })
                }

              });
            }
          });
        }
        $scope.counterLoaded = true;
        $scope.hideLoadingGif('loadingCustomerCounter');
      });

      $scope.getNewCustomersInfo = function () {
        $agentService.GetNewCustomersInfo({ weekNumber: $scope.selectedWeek.Index }).then(function (response) {
          tableData2 = response.data.d.Data;
          tableData2.forEach(function (data) {
            $scope.totals.depositsTotal += data.DepositAmount ? data.DepositAmount / 100 : 0;
          });
          $scope.table2.dtOptions.withOption('aaData', tableData2);
          $scope.totals.newCustomertotal = tableData2.length ? tableData2.length : 0;
        });
      }
    }

    Init();

  }]);
