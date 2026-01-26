appModule.controller("masterSheetController", [
	'$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
		let vm = this;
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
			})
			.withOption('responsive', {
				details: {
					type: 'column',
					target: 9
				}
			})
			.withDOM('Bflrtip')
			.withOption('buttons', [
				{ extend: 'copy', text: 'Copy' },
				{ extend: 'excel', text: 'XLS' },
				{ extend: 'pdf', text: 'PDF' },
				{ extend: 'print', text: 'Print' }
			])
			.withOption('aaSorting', [])
			.withOption('lengthMenu', [[20, 35, 50, 100], [20, 35, 50, 100]])
			.withOption('pageLength', 100)

		vm.dtColumnDefs = [
			DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Agent ID')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Deal')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Commission %')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Prev Makeup')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Last Week')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('New Makeup')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('Commission Amount')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(7).withTitle($scope.Translate('Master Payments')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(8).withTitle($scope.Translate('Master PrevBal')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(9).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
		];

		function render(data, type, full, meta) {
			switch (meta.col) {
				case 0:
					return full.AgentID;
				case 1:
					return full.Deal;
				case 2:
					return `<span class="${full.CommissionPercent < 0 ? 'text-danger' : full.CommissionPercent > 0 ? 'text-success' : ''}" ng-bind="${full.CommissionPercent ? full.CommissionPercent : 0} | formatNumber: false">$</span>`;
				case 3:
					return `<span class="${full.PrevMakeup < 0 ? 'text-danger' : full.PrevMakeup > 0 ? 'text-success' : ''}" ng-bind="${full.PrevMakeup ? full.PrevMakeup : 0} | formatNumber: false">$</span>`;
				case 4:
					return `<span class="${full.LastWeek < 0 ? 'text-danger' : full.LastWeek > 0 ? 'text-success' : ''}" ng-bind="${full.LastWeek ? full.LastWeek : 0} | formatNumber: false">$</span>`;
				case 5:
					return `<span class="${full.NewMakeup < 0 ? 'text-danger' : full.NewMakeup > 0 ? 'text-success' : ''}" ng-bind="${full.NewMakeup ? full.NewMakeup : 0} | formatNumber: false">$</span>`;
				case 6:
					return `<span class="${full.CommissionAmount < 0 ? 'text-danger' : full.CommissionAmount > 0 ? 'text-success' : ''}" ng-bind="${full.CommissionAmount ? full.CommissionAmount : 0} | formatNumber: false">$</span>`;
				case 7:
					return `<span class="${full.MasterPayments < 0 ? 'text-danger' : full.MasterPayments > 0 ? 'text-success' : ''}" ng-bind="${full.MasterPayments ? full.MasterPayments : 0} | formatNumber: false">$</span>`;
				case 8:
					return `<span class="${full.MasterPrevBalance < 0 ? 'text-danger' : full.MasterPrevBalance > 0 ? 'text-success' : ''}" ng-bind="${full.MasterPrevBalance ? full.MasterPrevBalance : 0} | formatNumber: false">$</span>`;
				default:
					return '';
			}
		}

		$scope.Init = function () {
			$scope.WeeksRange = $agentService.GetWeeksRange();
			$scope.SelectedWeekNumber = $scope.WeeksRange[0];
			if ($rootScope.selectedAgent) {
				$scope.getData();
			} else {
				$rootScope.$on('AgentAsCustomerInfoReady', function () {
					$scope.getData();
				});
			}
		};

		$scope.getData = function () {
			let params = { agentId: $rootScope.selectedAgent.AgentId, week: $scope.SelectedWeekNumber.Index }
			$agentService.GetMasterSheet(params).then(function (response) {
				if (response.data.d.Data.length == 0) {
					vm.dtOptions.withOption('aaData', {});
					return;
				}
				let data = response.data.d.Data;
				vm.dtOptions.withOption('aaData', data);
			});
		}

		$scope.Init();
	}
]);

