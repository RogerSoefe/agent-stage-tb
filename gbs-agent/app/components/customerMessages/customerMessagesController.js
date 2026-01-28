appModule.controller("customerMessagesController", [
  '$scope', '$agentService', '$rootScope', '$routeParams', '$compile', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $rootScope, $routeParams, $compile, DTOptionsBuilder, DTColumnDefBuilder) {

    let vm = this;
    vm.dtInstance = {};
    vm.dtOptions = DTOptionsBuilder.newOptions()
      .withOption('createdRow', function (row) {
        // Recompiling so we can bind Angular directive to the DT
        $compile(angular.element(row).contents())($scope);
      })
      .withOption('initComplete', function (settings) {
        // Recompiling so we can bind Angular directive to the DT
        jQuery('input[name="expDate"]').datepicker();
        $compile(angular.element('#' + settings.sTableId).contents())($scope);
        jQuery('.dt-buttons').find('a').tooltip();
        jQuery('#' + settings.sTableId + ' tbody').on('click', 'tr td', function (e) {
          if (jQuery(e.target).closest('span').length == 0) {
            $compile(angular.element('#' + settings.sTableId).contents())($scope);
            jQuery('input[name="expDate"]').datepicker();
            return;
          }
          jQuery(this).click();
        });
        vm.dtInstance = jQuery('#' + settings.sTableId).DataTable();
        vm.dtInstance.on('length', function (e, settings, len) {
          $scope.addSessionData('savedLength', len);
        });
      })
      .withOption('responsive', {
        details: {
          type: 'column',
          target: 5
        }
      })
      .withDOM('Bflrtip')
      .withOption('buttons', [
        { extend: 'copy', text: 'Copy' },
        { extend: 'excel', text: 'XLS' },
        { extend: 'pdf', text: 'PDF' },
        { extend: 'print', text: 'Print' },
        {
          text: '<i class="fa fa-refresh">', titleAttr: 'Update', action: function (e, dt, node, config) {
            dt.ajax.reload(null, false);
          }
        },
      ])
      .withOption('aaSorting', [])
      .withOption('lengthMenu', [[10, 25, 50, 100], [10, 25, 50, 100]])
      .withOption('pageLength', $scope.getSessionData('savedLength') ? $scope.getSessionData('savedLength') : 50);
    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Select')).renderWith(render).notSortable(),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Account (Pw)')).renderWith(render).notSortable(),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Message')).renderWith(render).notSortable(),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Exp Date')).renderWith(render).notSortable(),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Actions')).renderWith(render).notSortable(),
      DTColumnDefBuilder.newColumnDef(5).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, cL, meta) {
      switch (meta.col) {
        case 0:
          return `<input type='checkbox' ng-model="tableData[${meta.row}].CustomerSelected">`;
        case 1:
          return `<span>${$scope.AgentAsCustomerInfo.IsAffiliate ? '***' + cL.CustomerID.trim().substring(cL.CustomerId.trim().length - 4, cL.CustomerId.trim().length) : cL.CustomerId}</span> 
              ${(cL.NameFirst != '' && cL.NameFirst) || (cL.NameLast != '' && cL.NameLast) ? '<span class="ml-1">(' + cL.NameFirst + ' ' + cL.NameLast + ')</span>' : ''}
              <span>(${cL.password})</span>`;
        case 2:
          return `<textarea id="txtAreaNotes" style="width: 200px" rows="2" class="form-control" ng-model="tableData[${meta.row}].CommentsForCustomer"></textarea>`;
        case 3:
          return `<div class="date-picker"><input type="text" class="form-control form-control-ios-fix w-lg-50" name="expDate" ng-model="tableData[${meta.row}].CommentsForCstExpDateString" /></div>`;
        case 4:
          return `<button class="btn btn-default" ng-click="submitMessage(tableData[${meta.row}])">${$scope.Translate('Save')}</button><button class="btn btn-default ml-1" ng-click="submitMessage(tableData[${meta.row}], true)">${$scope.Translate('Clear')}</button>`;
        default: return '';
      }
    }

    function getData() {
      vm.dtOptions
        .withOption('serverSide', true)
        .withOption('processing', true)
        .withOption('ajax', function (data, callback, settings) {
          let params = { weekNumber: 0, agentId: $rootScope.selectedAgent.AgentId, wageringStatus: '2', start: data.start, length: data.length, search: data.search.value };
          $agentService.GetCustomersInfoPaging(params).then(function (result) {
            if (result.data.d.Data.length > 0) {
              result.data.d.Data.forEach(function (data) {
                data.WageringActiveSwitch = data.WageringActive ? true : false;
              })
              $scope.tableData = result.data.d.Data;
            }
            else $scope.tableData = [];
            callback({
              recordsTotal: $scope.tableData[0] ? $scope.tableData[0].RecordsTotal : 0,
              recordsFiltered: $scope.tableData[0] ? $scope.tableData[0].RecordsTotal : 0,
              data: $scope.tableData[0] ? $scope.tableData : []
            });
            $compile(angular.element('#' + settings.sTableId).contents())($scope);
          });
        })
        .withDataProp('data');
    }

    jQuery('input[name="expDate"]').datepicker();
    jQuery('#modalDialog').on('hidden.bs.modal', function () {

      let dt = jQuery('#customersDT').DataTable();
      dt.ajax.reload(null, false);
      //vm.dtInstance.DataTable.ajax.reload(null, false);
    });

    $scope.globalCustomer = {
      CustomerId: 'All',
      CommentsForCstExpDateString: new Date().toLocaleDateString('en-US'),
      CommentsForCustomer: '',
      sendToAll: false
    };

    async function submitMessage(customer, clear = false) {
      let result = (await $agentService.UpdateCustomerMessage({ customerId: customer.CustomerId, agentId: $rootScope.selectedAgent.AgentId, commentsForCustomer: clear == true ? '' : customer.CommentsForCustomer, commentsForCustomerExpDate: customer.CommentsForCstExpDateString }));
      if (result.Code == 1) {
        $scope.fireSwal($scope.Translate('Error sending message.'), '', 'error');
      } else {
        $scope.fireSwal($scope.Translate('Success'), $scope.Translate(`Message ${clear == true ? 'cleared' : 'sent'}`));
      }
      $scope.reloadData();
      return result.Code;
    }

    $scope.submitMessage = submitMessage;

    $scope.Init = function () {
      if ($rootScope.selectedAgent) {
        getData();
      }
      else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          getData();
        });
      }
    };

    $scope.reloadData = function () {
      let dt = jQuery('#customersDT').DataTable();
      dt.ajax.reload(null, false);
      //vm.dtInstance.DataTable.ajax.reload(null, false);
    };

    function getSelectedCustomersToString() {
      let result = '';
      $scope.tableData.forEach(function (x) {
        if (x.CustomerSelected == true)
          result += `${x.CustomerId} | `;
      })
      return result;
    }

    $scope.sendMassiveAlert = function (customer) {
      if (customer.sendToAll == false && !$scope.tableData.some(x => x.CustomerSelected == true)) {
        Swal.fire($scope.Translate('Select at least one customer'));
        return;
      }
      let custListString = '';
      Swal.fire({
        title: $scope.Translate('Massive Message to:'),
        text: customer.sendToAll == false ? getSelectedCustomersToString() : $scope.Translate('all'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: $scope.Translate('Send')
      }).then((result) => {
        if (result.isConfirmed) {
          if (customer.sendToAll == true) {
            submitMessage({ ...customer});
            return;
          }
          for (let i = 0; $scope.tableData.length > i; i++){
            let x = $scope.tableData[i];
            if (x.CustomerSelected == true) {
              custListString += x.CustomerId + ',';
            }
          };
          submitMessage({ ...customer, CustomerId: custListString }, false);
          $scope.fireSwal($scope.Translate('Success'), $scope.Translate(`Message sent correctly`));
        }
      })
    }    

    $scope.Init();

    $scope.$on('$destroy', function () {
      document.getElementById("page-content-wrapper").classList.remove('no-printable');

    });
  }
]);