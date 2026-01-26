appModule.directive('compactOpenBetsTable', function () {
    return {
        restrict: 'E',
        scope: false, // Usa el scope del padre
        templateUrl: 'directives/compactOpenBetsTable/compactOpenBetsTableView.html'
    };
});
