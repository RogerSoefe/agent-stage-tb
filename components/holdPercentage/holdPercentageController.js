appModule.controller("holdPercentageController", [
	'$rootScope', '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($rootScope, $scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
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
					target: 4
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
			.withOption('lengthMenu', [[100, 500, 1000, 5000], [100, 500, 1000, 5000]])
			.withOption('pageLength', 5000)
			.withOption('lengthChange', false)
			.withOption('bInfo', false)
			.withOption('paging', false)

		vm.dtColumnDefs = [
			DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Agent ID')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Risk')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Net')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Hold %')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(4).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
		];

		function render(data, type, full, meta) {
			switch (meta.col) {
				case 0:
					return full.AgentId;
				case 1:
					return CommonFunctions.FormatNumber(full.AmountWagered, false);
				case 2:
					return (full.Net > 0 ? '+' : '') + CommonFunctions.FormatNumber(full.Net, false);
				case 3:
					return CommonFunctions.FormatNumber(full.Hold, false) + '%';
				default:
					return "";
			}
		}

		$scope.Filter = {
			startDate: (moment().subtract(7, "days")).format('MM/DD/YYYY'),
			endDate: moment().format('MM/DD/YYYY')
		}

		async function Init() {
			$scope.WeeksRange = $agentService.GetWeeksRange();
			$scope.selectedWeek = $scope.WeeksRange[0];
			jQuery('input[name="filterDate"]').daterangepicker({
				locale: {
					firstDay: 1
				},
				singleDatePicker: true,
				showDropdowns: true,
				opens: 'left',
				dateFormat: 'mm/dd/yyyy'
			});
			if ($rootScope.selectedAgent) {
				$scope.getData();
			} else {
				$rootScope.$on('AgentAsCustomerInfoReady', function () {
					$scope.selectedAgent = $scope.AllAgentsList ? $scope.AllAgentsList[0] : null;
					$scope.getData();
				});
			}
		};



		$scope.getData = function () {
			let params = { agentId: $rootScope.selectedAgent ? $rootScope.selectedAgent.AgentId : $scope.AgentAsCustomerInfo.CustomerID, startDate: $scope.Filter.startDate, endDate: $scope.Filter.endDate };
			$agentService.GetHoldPercentage(params).then(function (response) {
				if (response.data.d.Data.length == 0) {
					vm.dtOptions.withOption('aaData', {});
					return;
				}
				let tableData = response.data.d.Data;
				vm.dtOptions.withOption('aaData', tableData);
			});
		}

		Init();
	}
]);

