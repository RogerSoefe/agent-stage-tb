appModule.directive('customerCounterClassic', ['$agentService', function ($agentService) {
		return {
				restrict: 'AEC',
				scope: {
						tableData: '=',
						totals: '='
				},
				controller: ['$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
						Translate = $scope.$parent.Translate;
						let rawAgentsList = $scope.$parent.rawAgentsList;
						let AgentAsCustomerInfo = $scope.$parent.AgentAsCustomerInfo;
						let formatCustomer = $scope.$parent.formatCustomer;
						let getAgentParent = $scope.$parent.getAgentParent;
						$scope.table = {};
						$scope.table.dtColumnDefs = [];
						$scope.table.dtInstance = {};
						$scope.table.dtOptions = DTOptionsBuilder.newOptions()
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
												target: $scope.totals.length + 1
										}
								})
								.withOption('drawCallback', function (setting) {
										if (!$scope.tableData) return;
										let subTable = $scope.tableData.slice(setting._iDisplayStart, $scope.tableData.length);
										var api = this.api();
										var rows = api.rows({ page: 'current' }).nodes();
										var last = null;
										let counter = 1;
										subTable.forEach(function (group, i) {
												if (last != group.AgentID.trim()) {
														jQuery(rows).eq(i).before(
																(i > 0 ? `<tr><td colspan="${$scope.totals.length + 1}" class="p-0"><h5 class="bg-black text-white p-3">` + counter + ' ' + Translate('Players') + '</h5></td></tr>' : '') +
																`<tr class="bg-gray">
								<td colspan="${$scope.totals.length + 1}">
									<div class="dropdown align-self-center mr-4">
										<div class="d-flex" role="button" aria-haspopup="true" aria-expanded="true" data-toggle="dropdown">
											<strong class="text-white">${formatCustomer(group.AgentID)}</strong>&nbsp;<span class="text-white">${Translate('Click here to see hierarchy')}</span>
										</div>
										<div class="dropdown-menu">
											<strong class="text-black p-3"> ${(rawAgentsList ? getAgentParent(group.AgentID) + ' / ' + formatCustomer(group.AgentID) : formatCustomer(group.AgentID))}</strong>
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
																`<tr><td colspan="${$scope.totals.length + 1}" class="p-0"><h5 class="bg-black text-white p-3">` + counter + ' ' + Translate('Players') + '</h5></td></tr>'
														);
												}

										});
								})
						function render(data, type, full, meta) {
								if ($scope.totals.length == 0) return '';
								if (meta.col == 0) return `<span>${AgentAsCustomerInfo.IsAffiliate ? '***' + full.CustomerID.trim().substring(full.CustomerID.trim().length - 4, full.CustomerID.trim().length) : full.CustomerID}</span>`;
								if (meta.col == $scope.totals.length + 1) return '';
								return full.Systems.indexOf($scope.totals[meta.col - 1].system) >= 0 ? `<b meta="${full.Systems}">&check;</b>` : `<span meta="${full.Systems}"></span>`;
						}

						$scope.table.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef(0).withTitle(Translate('Customer ID')).renderWith(render));
						$scope.totals.forEach((column, idx) => {
								$scope.table.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef(idx + 1).withTitle(Translate(column.system)).renderWith(render));
								if (idx >= $scope.totals.length - 1)
										$scope.table.dtColumnDefs.push(DTColumnDefBuilder.newColumnDef($scope.totals.length + 1).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1));
						})
						$scope.table.dtOptions.withOption('aaData', $scope.tableData);
				}],
				templateUrl: appModule.Root + '/app/directives/customerCounter/customerCounterClassic.html'
		};
}]);