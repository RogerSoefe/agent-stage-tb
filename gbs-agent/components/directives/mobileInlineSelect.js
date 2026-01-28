(function () {
    'use strict';
    // Mobile inline transform for existing custom-select (no changes to original customSelect.js)
    appModule.directive('mobileInlineSelect', ['$timeout', function ($timeout) {
        return {
            restrict: 'A',
            link: function (scope, elem) {
                // Only apply on small screens
                if (window.innerWidth > 767) return;

                // Inject CSS once
                if (!document.getElementById('mobile-inline-select-styles')) {
                    var link = document.createElement('link');
                    link.id = 'mobile-inline-select-styles';
                    link.rel = 'stylesheet';
                    link.href = appModule.Root + '/app/components/directives/mobileInlineSelect.css?v=' + Date.now();
                    document.head.appendChild(link);
                }

                // Defer until customSelect finished compiling
                $timeout(function () {
                    elem.addClass('mobile-inline-select');
                    var anchor = elem.find('a.dropdown-toggle');
                    var dropdown = elem.find('.dropdown-menu');
                    var searchWrapper = dropdown.find('.custom-select-search');
                    var input = searchWrapper.find('input');
                    var resultsUl = dropdown.find('ul[role="menu"]');
                    var actionArea = dropdown.find('.custom-select-action');

                    // Hide toggle anchor, keep dropdown always visible
                    if (anchor && anchor.length) {
                        anchor.css('display', 'none');
                    }
                    if (dropdown && dropdown.length) {
                        dropdown.css({ position: 'static', display: 'block', visibility: 'visible' });
                        dropdown.addClass('md3-inline-surface');
                    }
                    if (searchWrapper && searchWrapper.length) {
                        searchWrapper.addClass('md3-search-wrapper');
                    }
                    if (input && input.length) {
                        input.addClass('md3-search-input');
                        input.attr('placeholder', (typeof scope.Translate === 'function' ? scope.Translate('Search account') : 'Search account'));
                    }
                    if (resultsUl && resultsUl.length) {
                        resultsUl.addClass('md3-results-list');
                    }
                    if (actionArea && actionArea.length) {
                        actionArea.remove(); // Remove add button area for cleaner mobile UI
                    }
                }, 0);
            }
        };
    }]);
})();
