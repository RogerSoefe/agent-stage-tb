appModule.controller('sysIntegrationController', ['$scope', '$routeParams', '$agentService', function ($scope, $routeParams, $agentService) {

  //Route for multilpe links for CoreData Agent Access

  if ($routeParams.name == 'trackier') {
    const urlLink = window.localStorage.getItem('loginUrl');
    if (urlLink) $scope.coreDataUrl = urlLink;
    else {
      $agentService.GetTrackierUrlLink().then(r => {
        window.sessionStorage.setItem(r, 'loginUrl');
        $scope.coreDataUrl = r;
      })
    }
    return;
  }
  else if ($routeParams.arg1) {
    $scope.coreDataUrl = '/CoreDataAgent/?index=' + $routeParams.arg1;
  } else {
    $scope.coreDataUrl = '/CoreDataAgent/?index=' + null;
  }
  //End Route for CoreData

}]);
