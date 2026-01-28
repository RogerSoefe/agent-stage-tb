appModule.controller("customerMapController", [
  '$scope', '$agentService', '$rootScope', function ($scope, $agentService, $rootScope) {

        $scope.selection = {};

    $scope.Init = function () {
      $scope.showLoadingGif('loadingGifCustomerMap');
      $scope.SelectedWeek = '1';
      if ($rootScope.selectedAgent) {
          const weeks = $agentService.GetWeeksRange();
          $scope.WeeksRange = weeks.slice(0, 13);
          $scope.SelectedWeekNumber = $scope.WeeksRange[0];
          getAgentPlayers($rootScope.selectedAgent.AgentId);
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
            const weeks = $agentService.GetWeeksRange();
            $scope.WeeksRange = weeks.slice(0, 13);
            $scope.SelectedWeekNumber = $scope.WeeksRange[0];
            getAgentPlayers($rootScope.selectedAgent.AgentId);
        });
      }
    };
        async function getAgentPlayers(agentId) {
            const result = await ($agentService.GetAgentPlayers(agentId));
            let players = result.data.d.Data;
            if (players) {
                $scope.AgentCustomers = players.map(function (p) {
                    return { CustomerId: p, label: p }
                });
                $scope.selectedCustomers = [{ CustomerId: null, label: 'All' }, ...$scope.AgentCustomers];
                $scope.selection.customer = $scope.selectedCustomers[0];
            }
            $scope.getData();
        }

    $scope.getData = function () {
        let params = { customerId: $scope.selection.customer.CustomerId || 'All', agentId: $rootScope.selectedAgent.AgentId, week: $scope.SelectedWeekNumber.Index}
      $agentService.GetCustomerMapActivity(params).then(function (response) {
        initMap(response.map(x => { return { lat: x.Lat, lng: x.Lng, customerId: x.CustomerId } }));
      });
    }

    function initMap(locations) {
      const map = new google.maps.Map(document.getElementById("map"), {
        zoom: 2,
        center: { lat: 44.024, lng: -89.887 },
      });
      const infoWindow = new google.maps.InfoWindow({
        content: "",
        disableAutoPan: true,
      });
      // Add some markers to the map.
      const markers = locations.map((position, i) => {
        const label = position.customerId;
        const marker = new google.maps.Marker({
          position,
          label,
        });

        // markers can only be keyboard focusable when they have click listeners
        // open info window when marker is clicked
        marker.addListener("click", () => {
          infoWindow.setContent(
            `<div style='padding: 5px; min-width: 80px'>
            <h5 style='text-align: center'>${$scope.Translate('Customer ID')}</h5>
            <h4 style='text-align: center'>${label}</h4></div>`);
          infoWindow.open(map, marker);
        });
        return marker;
      });

      // Add a marker clusterer to manage the markers.
      new markerClusterer.MarkerClusterer({ map, markers });
      $scope.hideLoadingGif('loadingGifCustomerMap');
    }

    $scope.Init();


  }]);
