var appModule = angular.module("mainModule", ['ngRoute', 'angular-loading-bar', 'ngAnimate']);
var appVersion = '20181119-1';

appModule.Root = "/admin";


appModule.run(['$rootScope', function ($rootScope) {
  $rootScope.safeApply = function (fn) {
    var phase = this.$root.$$phase;
    if (phase == '$apply' || phase == '$digest') {
      if (fn && (typeof (fn) === 'function')) {
        fn();
      }
    } else {
      this.$apply(fn);
    }
  };

    $rootScope.$on("$routeChangeStart", function (event, next, current) {
        if (!appModule.Root) return;
        if (next.$$route.originalPath.indexOf(appModule.Root)) return;
        $location.path(appModule.Root + next.$$route.originalPath);
    });

}]);

var appCtrl = appModule.controller("appController", ['$rootScope', '$scope', '$agentService', '$route', '$translatorService', function ($rootScope, $scope, $agentService, $route, $translatorService) {

    $scope.credentials = {
        customerId: "",
    password: "",
    mode: ""
    };


    $scope.login = function () {
        if (!$scope.submitActive()) return;
        $agentService.Login($scope.credentials).then(function (result) {
            if (result.data.d.Code != 0) {
                alert(result.data.d.Message);
                return;
            }
          window.localStorage.removeItem('impersonatedList');
      if ($scope.credentials.mode == "T")
        $scope.OpenLiveTicker($scope.credentials.customerId, $scope.credentials.password);
      else
            document.location.href = appModule.Root + "/";
        });
  };

  $scope.OpenLiveTicker = function (agentId, password) {
    var form = document.createElement("form");
    var element1 = document.createElement("input");
    var element2 = document.createElement("input");
    form.setAttribute("target", "_self");
    form.method = "POST";
    form.action = "/#/liveticker";

    element1.value = agentId;
    element1.name = "customerID1";
    element1.type = "hidden";
    form.appendChild(element1);

    element2.value = password;
    element2.name = "password1";
    element2.type = "hidden";
    form.appendChild(element2);

    document.body.appendChild(form);

    form.submit();

  };

    $scope.submitActive = function () {
        return $scope.credentials.customerId.length && $scope.credentials.password.length;
    }


}]);