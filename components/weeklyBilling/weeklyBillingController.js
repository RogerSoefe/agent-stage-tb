appModule.controller("weeklyBillingController", [
	'$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
		let vm = this;
		let groupedData = null;
		vm.dtInstance = {};
		vm.dtOptions = DTOptionsBuilder.newOptions()
			.withOption('stateSave', true)
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
					target: 13
				}
			})
			.withDOM('Bflrtip')
			.withOption('drawCallback', function (setting) {
				if (!groupedData) return;
				let subTable = groupedData.slice(setting._iDisplayStart, groupedData.length);
				var api = this.api();
				var rows = api.rows({ page: 'current' }).nodes();
				var last = null;
				subTable.forEach(function (group, i) {
					if (last != group.Hierarchy.trim()) {
						jQuery(rows).eq(i).before(
              `<tr class="bg-gray"><td colspan="13">
										<strong class="text-white">${($scope.rawAgentsList ? group.Hierarchy.substring(2) : $scope.formatCustomer(group.AgentID))}</strong></td></tr>`
						);
						last = group.Hierarchy.trim();
					}
				});
			})
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
			DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Prev Bal')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('New Bal')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Per Head Amount')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Sport Net')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('InetCount ($fee)')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('CallCenter ($fee)')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(7).withTitle($scope.Translate('Live Casino ($fee)')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(8).withTitle($scope.Translate('Horses ($fee)')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(9).withTitle($scope.Translate('LB ($fee)')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(10).withTitle($scope.Translate('Other ($fee)')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(11).withTitle($scope.Translate('Prop Builder($fee)')).renderWith(render),
				DTColumnDefBuilder.newColumnDef(12).withTitle($scope.Translate('EzLive ($fee)')).renderWith(render),
			DTColumnDefBuilder.newColumnDef(13).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
		];

		function render(data, type, full, meta) {
			switch (meta.col) {
				case 0:
					return `<a href="" class="customer-table-button" ng-click="OpenAgentManager('${full.AgentID}', 2)"> ${full.AgentID}</a>`;
				case 1:
							return `<span class="${full.PrevBalance < 0 ? 'text-danger' : full.PrevBalance > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.PrevBalance, true)}</span>`;
				case 2:
							return `<span class="${full.NewBalance < 0 ? 'text-danger' : full.NewBalance > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.NewBalance ? full.NewBalance : 0, true)}</span>`;
				case 3:
							return `<span class="${full.DistributionAmountPerHead < 0 ? 'text-danger' : full.DistributionAmountPerHead > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.DistributionAmountPerHead ? full.DistributionAmountPerHead : 0, true)}</span>`;
				case 4:
							return `<span class="${full.NetAmount < 0 ? 'text-danger' : full.NetAmount > 0 ? 'text-success' : ''}">${CommonFunctions.FormatNumber(full.NetAmount, true)}</span>`;
				case 5:
					return `<span>${full.InetHeadCount ? full.InetHeadCount : 0}</span>&nbsp<span>($${CommonFunctions.FormatNumber(full.InetHeadCountFee ? full.InetHeadCountFee : 0, true)})</span>`;
				case 6:
					return `<span>${full.HeadCount ? full.HeadCount : 0}</span>&nbsp<span>($${CommonFunctions.FormatNumber(full.HeadCountFee ? full.HeadCountFee : 0, true)})</span>`;
				case 7:
					return `<span>${full.LiveCasinoHeadCount ? full.LiveCasinoHeadCount : 0}</span>&nbsp<span>($${CommonFunctions.FormatNumber(full.LiveCasinoHeadCountFee ? full.LiveCasinoHeadCountFee : 0, true)})</span>`;
				case 8:
					return `<span>${full.HorseRacingHeadCount ? full.HorseRacingHeadCount : 0}</span>&nbsp<span>($${CommonFunctions.FormatNumber(full.HorseRacingHeadCountFee ? full.HorseRacingHeadCountFee : 0, true)})</span>`;
				case 9:
					return `<span>${full.LiveBettingHeadCount ? full.LiveBettingHeadCount : 0}</span>&nbsp<span>($${CommonFunctions.FormatNumber(full.LiveBettingHeadCountFee ? full.LiveBettingHeadCountFee : 0, true)})</span>`;
				case 10:
					return `<span>${full.OtherHeadCount ? full.OtherHeadCount : 0}</span>&nbsp<span>($${CommonFunctions.FormatNumber(full.OtherHeadCountFee ? full.OtherHeadCountFee : 0, true)})</span>`;
				case 11:
							return `<span>${full.PropsBuilderHeadCount ? full.PropsBuilderHeadCount : 0}</span>&nbsp<span>($${CommonFunctions.FormatNumber(full.PropsBuilderHeadCountFee ? full.PropsBuilderHeadCountFee : 0, true)})</span>`;
				case 12:
							return `<span>${full.EZLiveBetCount ? full.EZLiveBetCount : 0}</span>&nbsp<span>($${CommonFunctions.FormatNumber(full.EZLiveBetFee ? full.EZLiveBetFee : 0, true)})</span>`;
				default:
					return '';
			}
		}

		$scope.Init = function () {
      if ($rootScope.selectedAgent) {
			$scope.WeeksRange = $agentService.GetWeeksRange();
			$scope.WeeksRange.shift();
			$scope.SelectedWeekNumber = $scope.WeeksRange[0];
				$scope.getData();
			} else {
				$rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.WeeksRange.shift();
          $scope.SelectedWeekNumber = $scope.WeeksRange[0];
					$scope.getData();
				});
			}
		};

		jQuery('#modalDialog').on('hidden.bs.modal', function () {
			$scope.getData();
		})

		$scope.getData = function () {
			let params = { agentId: $rootScope.selectedAgent.AgentId, week: $scope.SelectedWeekNumber.Index - 1 }
			$agentService.GetAgentDistribution(params).then(function (response) {
				if (response.data.d.Data.length == 0) {
					vm.dtOptions.withOption('aaData', {});
					return;
				}
				groupedData = response.data.d.Data.filter(x => x.DistributionAmountPerHead != 0);
				vm.dtOptions.withOption('aaData', groupedData);
				$scope.Summary = {
					DistributionAmountPerHead: CommonFunctions.sum(groupedData, 'DistributionAmountPerHead')
				}
			});
		}

		$scope.Init();
	}
]);

