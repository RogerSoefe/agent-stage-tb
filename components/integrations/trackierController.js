appModule.controller('trackierController', ['$scope', '$agentService', '$sce', function ($scope, $agentService, $sce) {

  //Route for multilpe links for CoreData Agent Access

  const urlLink = window.sessionStorage.getItem('loginUrl');
  if (urlLink) $scope.coreDataUrl = $sce.trustAsResourceUrl(urlLink);
  else {
    $agentService.GetTrackierUrlLink().then(r => {
      window.sessionStorage.setItem(r, 'loginUrl');
      window.open(r, '_blank');
    })

  }


}]);
