appModule.controller("vigLimitsController", [
    '$scope', '$agentService', '$rootScope', '$integrationService', function ($scope, $agentService, $rootScope, $integrationService) {

        $scope.selectedCustomers = []; $scope.mddSettings = { displayProp: 'id' }, $scope.VigLimitsCust = {};
    $scope.Selection = {};
        async function init() {
            $scope.LoadingReportData = false;
            if ($scope.AllAgentsList && $scope.AllAgentsList.length > 0) {
                $scope.getAgentPlayers($scope.AllAgentsList[0].AgentId);
            } else {
                $rootScope.$on('AgentAsCustomerInfoReady', function () {
                    $scope.getAgentPlayers($scope.AllAgentsList[0].AgentId);
                });
            }
        }

        $scope.eventsCustomersApply = { onItemSelect: function (item) { getSliceCustomerArray(); }, onItemDeselect: function (item) { getSliceCustomerArray(); } };

        function getSliceCustomerArray() {
            $scope.selectedCustomersA = $scope.selectedCustomers.slice(0, Math.round($scope.selectedCustomers.length / 2));
            $scope.selectedCustomersB = $scope.selectedCustomers.slice(Math.round($scope.selectedCustomers.length / 2), $scope.selectedCustomers.length + 1);
        }

        $scope.getAgentPlayers = function (agentId) {
            $agentService.GetAgentPlayers(agentId).then(function (result) {
                let players = result.data.d.Data;
                if (players) {
                    $scope.AgentCustomers = players.map(function (p) {
                        return { id: p, label: p }
                    });
          $scope.selectedCustomers.push($scope.AgentCustomers[0]);
          $scope.Selection.Customer = $scope.AgentCustomers[0];
                    loadVigLimits($scope.AgentCustomers[0].id);
                }
            });
        }

        async function loadVigLimits(customerId) {
            var resp = (await $integrationService.GetVigLimits(customerId));
            if (resp.Code == 0) $scope.VigLimitsCust = resp.Data;
            $scope.VigLimitsCust.Currency = $scope.Currencies.find(x => $scope.VigLimitsCust.currency == 'USD') || $scope.Currencies.find(x => x.CurrencyCode == 'USD');
      $scope.selectedCustomers = []
      $scope.selectedCustomers.push($scope.AgentCustomers.find(x => x.id == customerId));
            $rootScope.safeApply();
        }

        $scope.loadVigLimits = loadVigLimits;

        $scope.SetVigLimits = async function () {
            const vigLimitsList = [];
            $scope.selectedCustomers.forEach(x => {
                vigLimitsList.push({ ...$scope.VigLimitsCust, username: x.id.trim(), Currency: $scope.VigLimitsCust.Currency.CurrencyCode });
            })
      const chunkSize = 19;
        Swal.fire({
          title: 'Please wait...',
        allowOutsideClick: false
        });
      Swal.showLoading();
      for (let i = 0; i < vigLimitsList.length; i += chunkSize) {
        const chunk = vigLimitsList.slice(i, i + chunkSize);
        var resp = (await $integrationService.SetVigLimits(chunk));        
        if (!resp.Data.BatchSetPlayerLimitsResponse || !resp.Data.BatchSetPlayerLimitsResponse.length) {
          Swal.fire('error','NO DATA','error');
          return;
        }
        for (var j = 0; j < resp.Data.BatchSetPlayerLimitsResponse.length; j++) {
          const x = resp.Data.BatchSetPlayerLimitsResponse[j];
        if (x.status != 'OK') {
                    Swal.fire(
                        x.status,
                        x.description + ' ' + x.username,
              'warning'
                    );
        return;
      }
      }
      }
      
      Swal.fire('Success');
        }


        init();

    }
]);