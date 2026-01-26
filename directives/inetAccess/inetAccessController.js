appModule.directive('inetAccess', ['$agentService', function () {
  return {
    restrict: 'AEC',
    scope: {
						AllAgentsList: '=allAgentsList',
      formatCustomer: '=',
      FormatDateTime: '=formatDateTime',
      DisplayTimeFromDate: '=displayTimeFromDate',
      IsMobile: '=isMobile',
						AgentAsCustomerInfo: '=agentAsCustomerInfo',
						customer: '='
    },
    controller: [
						'$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', '$translatorService', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder, $translatorService) {
								$scope.Translate = $translatorService.Translate;
								let vm = this;
								let rawData = [];
								vm.dtInstance = {};
								vm.dtOptions = DTOptionsBuilder.newOptions()
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
												vm.dtInstance = jQuery('#' + settings.sTableId).DataTable();
												vm.dtInstance.on('length', function (e, settings, len) {
														$scope.addSessionData('savedLength', len);
												});
										})
										.withOption('responsive', {
												details: {
														type: 'column',
														target: 7
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
																dt.ajax.reload();
														}
												},
										])
										.withOption('aaSorting', [])
										.withOption('lengthMenu', [[20, 35, 50, 100], [20, 35, 50, 100]])
										.withOption('pageLength', 20)

								vm.dtColumnDefs = [
										DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Access Datetime')).renderWith(render),
										DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Client Code')).renderWith(render),
										DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Login ID')).renderWith(render),
										DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Operation')).renderWith(render),
										DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Data')).renderWith(render),
										DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('IP address')).renderWith(render),
										DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('Site Code')).renderWith(render),
										DTColumnDefBuilder.newColumnDef(7).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
								];

								function render(data, type, full, meta) {
										switch (meta.col) {
												case 0:
														return full.AccessDateTimeString;
												case 1:
														return full.ClientCode;
												case 2:
														return full.LoginID;
												case 3:
														return full.Operation;
												case 4:
														return full.Data;
												case 5:
														return full.IPAddress;
												case 6:
														return full.SiteCode;
												default:
														return '';
										}
								}

								$scope.Filter = {
										loginId: '',
										operation: '',
										data: '',
										period: '7',
										mode: '1',
										access: '1',
										date: $agentService.GetServerDateTime().toLocaleDateString('en-US')
								}

								$scope.Init = function () {
										if ($scope.AgentAsCustomerInfo) {
												$scope.WeeksRange = $agentService.GetWeeksRange();
												$scope.getInetData();
										} else {
												$rootScope.$on('AgentAsCustomerInfoReady', function () {

														$scope.WeeksRange = $agentService.GetWeeksRange();
														$scope.getInetData();
												})
										}

										$scope.Filter.AgentToShow = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
										jQuery('input[name="filterDate"]').daterangepicker({
												locale: {
														firstDay: 1
												},
												singleDatePicker: true,
												showDropdowns: true,
												opens: 'left',
												dateFormat: 'mm/dd/yyyy'
										});
								};

								$scope.updateData = function () {
										let dt = jQuery('#accesLogDT').DataTable();
										dt.ajax.reload(null, false);
								}

								$scope.getInetData = function () {
										vm.dtOptions
												.withOption('serverSide', true)
												.withOption('processing', true)
												.withOption('ajax', function (data, callback, settings) {

														if ($scope.Filter.access == 1) {
																const params = { date: $scope.Filter.date, customerId: $scope.customer.CustomerId, start: data.start, length: data.length, search: data.search.value, sortBy: JSON.stringify(data.order) };
																$agentService.GetCustomerInetSessionLog(params).then(function (response) {
																		rawData = response.data.d.Data;
																		callback({
																				recordsTotal: rawData[0] ? rawData[0].Recordstotal : 0,
																				recordsFiltered: rawData[0] ? rawData[0].Recordstotal : 0,
																				data: rawData[0] ? rawData : []
																		});
																		$compile(angular.element('#' + settings.sTableId).contents())($scope);
																});
														} else {
																if ($scope.Filter.mode == 1) {

																		const params = { date: $scope.Filter.date, customerId: $scope.customer.CustomerId, start: data.start, length: data.length, search: data.search.value, sortBy: JSON.stringify(data.order) };
																		$agentService.GetInetSessionLog(params).then(function (response) {
																				rawData = response.data.d.Data;
																				callback({
																						recordsTotal: rawData[0] ? rawData[0].Recordstotal : 0,
																						recordsFiltered: rawData[0] ? rawData[0].Recordstotal : 0,
																						data: rawData[0] ? rawData : []
																				});
																				$compile(angular.element('#' + settings.sTableId).contents())($scope);
																		});

																} 
														}
												})
												.withDataProp('data');
								}

								$scope.Init();

      }],
				templateUrl: appModule.Root + '/app/directives/inetAccess/inetAccessView.html',
				controllerAs: 'vm'
  }
}]);