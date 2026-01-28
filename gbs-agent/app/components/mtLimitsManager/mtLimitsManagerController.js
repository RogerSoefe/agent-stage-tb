appModule.controller("mtLimitsManagerController", [
    '$scope', '$agentService', '$rootScope', '$integrationService', function ($scope, $agentService, $rootScope, $integrationService) {

        $scope.selectedCustomers = []; $scope.mddSettings = { displayProp: 'id' }, $scope.MTLimits = {};
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
                    loadMtLimits($scope.AgentCustomers[0].id);
                }
            });
        }

        async function loadMtLimits(customerId) {
            var resp = (await $integrationService.GetMobitazLimitByPlayer(customerId));
            if (resp.Code == 0) $scope.MTLimits = resp.Data;
            $scope.selectedCustomers = []
            $scope.selectedCustomers.push($scope.AgentCustomers.find(x => x.id == customerId));
            $rootScope.safeApply();
        }

        $scope.loadMtLimits = loadMtLimits;

        $scope.OverrideMobitazPlayerLimit = async function () {
            Swal.fire({
                title: 'Please wait...',
                allowOutsideClick: false
            });
            Swal.showLoading();
            $scope.MTLimits.CustomerID = $scope.selectedCustomers[0].id;
            var resp = (await $integrationService.OverrideMobitazPlayerLimit($scope.MTLimits));
            console.log(resp.Data);
            if (!resp.Data || !resp.Data.definitions.length) {
                Swal.fire('error', 'NO DATA', 'error');
                return;
            }
            const x = resp;
            if (x.Code != 0) {
                Swal.fire(
                    x.status,
                    x.description + ' ' + x.username,
                    'warning'
                );
                return;
            }



            Swal.fire('Success');
        }


        init();

    }
]);