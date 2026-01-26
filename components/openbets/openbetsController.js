appModule.controller("openbetsController", [
	'$scope', '$agentService', '$rootScope', function ($scope, $agentService, $rootScope) {
		$scope.dataSource = [];
		$scope.sourceLoaded = false;
		async function Init() {
						let endDate = new Date();
						let startDate = new Date();
						startDate.setDate(startDate.getDate() - 720);
						let params = { customerId: 'All', mode: 2, startDate: startDate, endDate: endDate };
			$scope.dataSource = (await $agentService.GetOpenBetsByCustomerId(params));
			$scope.sourceLoaded = true;
			$rootScope.safeApply();
			}

		$scope.sourceCaller = function (params) {
			return $agentService.GetOpenBetsByCustomerId(params);
						}
		Init();
	}]);
