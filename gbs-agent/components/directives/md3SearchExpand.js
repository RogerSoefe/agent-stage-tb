(function () {
    'use strict';
    // Directive: md3-search-expand
    // Expands bottom sheet and hides transcluded content when search gains focus.
    appModule.directive('md3SearchExpand', ['$rootScope', function ($rootScope) {
        return {
            restrict: 'A',
            link: function (scope, elem) {
                function onFocus() {
                    scope.$apply(function () {
                        scope.inlineSearchActive = true;
                        // Broadcast request; bottomSheet factory now handles expansion internally.
                        $rootScope.$broadcast('bottomSheet:expandRequested');
                        $rootScope.$broadcast('fab:expanded');
                    });
                }
                function onBlur() {
                    scope.$apply(function () {
                        // If user clears input, restore content.
                        if (!elem.val()) { scope.inlineSearchActive = false; }
                    });
                }
                elem.on('focus', onFocus);
                elem.on('blur', onBlur);
                scope.$on('$destroy', function () {
                    elem.off('focus', onFocus);
                    elem.off('blur', onBlur);
                });
            }
        };
    }]);
})();
