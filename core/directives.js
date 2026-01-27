/* angular functions */

appModule.directive("keepFocus", ['$timeout', function ($timeout) {
  /*
  Intended use:
      <input keep-focus ng-model='someModel.value'></input>
  */
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function ($scope, $element, attrs, ngModel) {

      ngModel.$parsers.unshift(function (value) {
        $timeout(function () {
          $element[0].focus();
        });
        return value;
      });

    }
  };
}])

appModule.directive('autoComplete', function ($timeout) {
  return function (scope, iElement, iAttrs) {
    iElement.bind("keypress", function (e) {
      scope.showlist = true;
    })
  };
})


appModule.directive('onErrorSrc', function () {
  return {
    link: function (scope, element, attrs) {
      element.bind('error', function () {
        if (attrs.src != attrs.onErrorSrc) {
          attrs.$set('src', attrs.onErrorSrc);
        } else {
          attrs.$set('src', SETTINGS.MainSite + '/sports/assets_core/sport_types/Default.svg');
        }
      });
    }
  }
});



appModule.directive('format', ['$filter', function ($filter) {
  return {
    require: '?ngModel',
    link: function (scope, elem, attrs, ctrl) {
      if (!ctrl) return;

      ctrl.$formatters.unshift(function (a) {
        if (ctrl.$modelValue == "") return "";
        else {
          var f = $filter(attrs.format)(ctrl.$modelValue);
          var pos = f.indexOf('.');
          if (pos >= 0) f = f.substring(0, pos);
          return f;
        }
      });

      ctrl.$parsers.unshift(function (viewValue) {
        if (viewValue == "" || parseInt(viewValue) == 0) return "";
        var plainNumber = parseInt(viewValue.replace(/[^\d|\-+|\.+]/g, ''));
        elem.val($filter('number')(plainNumber));
        return plainNumber;
      });
    }
  };
}]);

appModule.directive("onFinishRender", ["$timeout", function ($timeout) {
  return {
    restrict: "A",
    link: function (scope, element, attr) {
      if (scope.$last === true) {
        $timeout(function () {
          scope.$emit("ngRepeatFinished");
        });
      }
    }
  }
}]);

appModule.directive("formatNum", function () {
  return {
    restrict: "E",
    link: function (scope, element, attrs, ctrl) {
      attrs.$observe('num', function (num) {
        var newNum;
        newNum = CommonFunctions.FormatNumber(num, typeof attrs.divide != "undefined");
        element.text(newNum);
      });

    }
  };
});

appModule.directive('myPostRepeatDirective', function () {
  return function (scope, element, attrs) {
    if (scope.$last) {
      scope.PeriodOrTeamTotalChanged(scope.sportOffering);
    }
  };
});

appModule.directive('ngRepeatEvents', function () {
  return function (scope, element, attrs) {
    if (scope.$first == true) {
      //jQuery('#spinner').show();
    }
    else if (scope.$last == true) {
      menu.HideLoading();
    }
  };
});


appModule.directive('ngBlur', function () {
  return function (scope, elem, attrs) {
    elem.bind('blur', function () {
      scope.$apply(attrs.ngBlur);
    });
  };
});

appModule.directive('ngFocus', function () {
  return function (scope, elem, attrs) {
    elem.bind('focus', function () {
      jQuery(window).scrollTop(0);
    });
  };
});

appModule.directive('dynamicPlaceholder', function () {
  return {
    restrict: 'A',
    link: function ($scope, element, attrs) {
      attrs.$observe('dynamicPlaceholder', function (value) {
        element.attr('placeholder', value);
      });
    }
  };
});

appModule.directive('formatNumber', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, element, attr, ctrl) {

      ctrl.$formatters.push(function (modelValue) {
        if (modelValue == 0) return "";
        else return modelValue;
        //return modelValue.toString().replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
      });
    }
  };
});

appModule.directive('bindOnce', function () {
  return {
    scope: true,
    link: function ($scope) {
      setTimeout(function () {
        $scope.$destroy();
      }, 0);
    }
  };
});


appModule.directive('customPopover', ['$compile', function ($compile) {
  return {
    restrict: 'A',
    link: function (scope, el) {
      jQuery(el).popover({
        html: true,
        content: function () {
          return $compile(jQuery("#casino_popover_opt_content").html())(scope);
          //return jQuery("#casino_popover_opt_content").html();
        }
      });
    }
  };
}]);


//appModule.directive('offeringButton', function () {
//    return {
//        restrict: 'A',
//        scope: {
//            wagerType: '&wagerType',
//            limitTitle: '&limit-title'
//        },
//        link: function (scope, el, attrs) {
//            if (scope.wagerType() == 'L' || scope.wagerType() == 'H') {
//                attrs.$set('tittle', scope.limitTitle());
//            }
//        }
//    };
//});


appModule.directive('offeringButton', function () {
  return {
    restrict: 'E',
    scope: {
      limitType: '=limitType',
      limitTitle: '=limitTitle',
      customClass: '@customClass',
      changed: '=changed',
      active: '=active',
      bind: '=bind',
      subType: '@subType',
      position: '@position',
      maxWager: '=maxWager',
      isGameLineDisabled: '&',
      line: '=line',
      disabled: '=',
      typeId: '='
    },
    transclude: true,
    link: function (scope, el, attrs) {
      scope.typeId = scope.subType + scope.position;
      scope.disabled = scope.isGameLineDisabled(
        {
          gameLine: scope.line,
          subWagerType: scope.subType,
          teamPos: scope.position
        });
      scope.limitType = (!scope.disabled ? scope.limitType : "");
      scope.maxWager = (!scope.disabled && scope.line.Status == 'I' && (scope.limitType == 'L' || scope.limitType == 'H') ? scope.maxWager : "");
    },
    templateUrl: appModule.Root + "/app/components/betOffering/betOfferingButton.html"
  };
});

var cancelClick = false;
appModule.directive('ngClick', function () {
  return {
    restrict: 'A',
    replace: false,
    priority: -1,
    link: function (scope, el, attrs) {
      el.bind('click', function (e) {

        if (cancelClick) {
          cancelClick = false;
          e.preventDefault();
          e.stopImmediatePropagation();
          return;
        }
        cancelClick = true;
        setTimeout(function () {
          if (cancelClick) {
            cancelClick = false;
            return;
          }

          //clean up
          cancelClick = false;
        }, 500);
        return;
      });
    }
  };
});

/*
appModule.directive('repeatReady', function () {
  return function (scope, element, attrs) {
    if (scope.$last && element.length > 0) {
      setTimeout(function () {
        var el = jQuery(element[0]);
        el = GetTableParent(el);
        el.trigger("enhance.tablesaw");
      }, 1200);
    }
  };
});
*/

appModule.directive("tableSaw", ['$timeout', function ($timeout) {
  return {
    restrict: 'A',
    link: function ($scope, element, attr) {
      if ($scope.$last) {
        var el = jQuery(element.parent().parent()[0]);
        if (!el) return;

        if (el.data("tablesaw")) {

          $timeout(function () {
            el.data("tablesaw").refresh();
          }, 10);
        }

        $timeout(function () {
          var el = GetTableParent(jQuery(element[0]));
          el.trigger("enhance.tablesaw");
        }, 10);
      }

    } // end link
  };
}]);

appModule.directive('eval', function () {
  return {
    link: function (scope, elm) {
      setTimeout(function () {
        var val = parseFloat(elm[0].innerHTML.replace(',', ''));
        if (val < 0)
          elm.addClass('num_neg');

      }, 1000);
    }
  };
});

appModule.directive('onlyDigits', function () {
    return {
        require: 'ngModel',
        restrict: 'A',
        link: function (scope, element, attr, ctrl) {
            function inputValue(val) {
                if (val) {
          var digits = val.replace(/[^0-9.-]/g, '');

                    if (digits.split('.').length > 2) {
                        digits = digits.substring(0, digits.length - 1);
                    }

                    if (digits !== val) {
                        ctrl.$setViewValue(digits);
                        ctrl.$render();
                    }
                    return parseFloat(digits);
                }
                return undefined;
            }
            ctrl.$parsers.push(inputValue);
        }
    };
});

appModule.directive('onlyNumbers', function () {
  return {
    restrict: 'A',
    link: function (scope, elm, attrs, ctrl) {
      elm.on('keydown', function (event) {
        if (event.shiftKey) { event.preventDefault(); return false; }
        if ([8, 13, 27, 37, 38, 39, 40, 48].indexOf(event.which) > -1) {
          return true;
        } else if (event.which >= 49 && event.which <= 57) {
          return true;
        } else if (event.which >= 96 && event.which <= 105) {
          return true;
        } else if ([110, 190, 107, 109].indexOf(event.which) > -1) {
          return true;
        }
        else {
          event.preventDefault();
          return false;
        }
      });
    }
  }
});

appModule.directive('inputPriceFormat', ['$filter', function ($filter) {
  return {
    require: '?ngModel',
    link: function (scope, elem, attrs, ctrl) {

      if (!ctrl) return;

      var formatLine = function (val) {
        if (val == '-' || val == '+') return val;
        if (isNaN(val) || !val) return '';
        val = (val + '').replace('+', '');
        if (parseInt(val) > 0) return '+' + val;
        return val;
      }

      ctrl.$formatters.unshift(function (a) {
        return formatLine(ctrl.$modelValue);
      });

      ctrl.$parsers.push(function (viewValue) {
        var val = formatLine(viewValue);
        elem.val(val);
        return val;
      });
    }
  }
}]);

appModule.directive('inputSpreadFormat', ['$filter', function ($filter) {
  return {
    require: '?ngModel',
    template:
      '<input type="text" input-spread-format class="form-control" ng-model="gf.Spread1" ng-change="OnLineChange(gf, "S", "Pts", 1)" /> < input type = "text" input - spread - format class="form-control" ng - model="gf.Spread2" ng - change="OnLineChange(gf, "S", "Pts", 1)" /> ',
    link: function (scope, elem, attrs, ctrl) {

      if (!ctrl) return;

      var formatLine = function (val) {
        if (isNaN(val) || val == 0) return '';
        if (parseInt(val) > 0) return '-' + val;
        return val;
      }

      ctrl.$formatters.unshift(function (a) {
        return formatLine(ctrl.$modelValue);
      });

        ctrl.$parsers.push(function (viewValue) {
        var val = formatLine(viewValue);
        elem.val(val);
        return val;
        });
    }
  }
}]);


appModule.directive('compile', ['$compile', function ($compile) {
    return function (scope, element, attrs) {
        scope.$watch(
            function (scope) {
                return scope.$eval(attrs.compile);
            },
            function (value) {
                element.html(value);
                $compile(element.contents())(scope);
            }
        )
    };
}]);

function GetTableParent(el) {
  if (el.is("tr")) return GetTableParent(el.parent());
  if (el.is("tbody")) return GetTableParent(el.parent());
  if (el.is("table")) return GetTableParent(el.parent());
  return el;
}

// FAB Service - Global Floating Action Button State Management
appModule.factory('fabService', function () {
  var service = {
    buttons: [],
    isVisible: false,

    // Set the buttons array for the FAB
    setButtons: function (buttons) {
      service.buttons = buttons;
    },

    // Show the FAB
    show: function () {
      service.isVisible = true;
    },

    // Hide the FAB
    hide: function () {
      service.isVisible = false;
    },

    // Reset the FAB state (call on $destroy)
    reset: function () {
      service.buttons = [];
      service.isVisible = false;
    },

    // Add a single button
    addButton: function (button) {
      service.buttons.push(button);
    },

    // Remove button by index
    removeButton: function (index) {
      service.buttons.splice(index, 1);
    },

    // Clear all buttons
    clearButtons: function () {
      service.buttons = [];
    }
  };

  return service;
});

// FAB Button - Global Floating Action Button Directive
appModule.directive('fabButton', ['$timeout', function ($timeout) {
  return {
    restrict: 'E',
    templateUrl: appModule.Root + '/app/components/directives/fabButton.html',
    scope: {
      isLoaded: '=',
      buttons: '=' // Array of button objects: [{ icon: 'fa-sync-alt', action: function, visible: true }]
    },
    link: function (scope, element, attrs) {
      // Initialize buttons array if not provided
      if (!scope.buttons || !Array.isArray(scope.buttons)) {
        scope.buttons = [];
      }

      // FAB expanded state
      scope.fabExpanded = false;

      // Toggle FAB function
      scope.toggleFAB = function () {
        // Si solo hay un botón, ejecutar su acción directamente
        if (scope.buttons && scope.buttons.length === 1 && scope.buttons[0].visible !== false) {
          scope.executeAction(scope.buttons[0].action);
          return;
        }

        // Si hay múltiples botones, expandir/contraer normalmente
        scope.fabExpanded = !scope.fabExpanded;
        console.log('FAB toggled:', scope.fabExpanded ? 'EXPANDED' : 'COLLAPSED');

        // Broadcast FAB state change
        if (scope.fabExpanded) {
          scope.$root.$broadcast('fab:expanded');
        } else {
          scope.$root.$broadcast('fab:collapsed');
        }
      };

      // Execute action and collapse FAB
      scope.executeAction = function (action) {
        if (action && typeof action === 'function') {
          action();
        }
        scope.fabExpanded = false;
        console.log('Action executed - FAB COLLAPSED');
        scope.$root.$broadcast('fab:collapsed');
      };

      // Watch for backdrop clicks
      scope.$watch('isLoaded', function (newValue) {
        if (newValue === true) {
          $timeout(function () {
            var fabBackdrop = element[0].querySelector('.fab-backdrop');
            if (fabBackdrop) {
              fabBackdrop.addEventListener('click', function () {
                scope.fabExpanded = false;
                scope.$apply();
                console.log('Backdrop clicked - FAB COLLAPSED');
                scope.$root.$broadcast('fab:collapsed');
              });
            }
          }, 100);
        }
      });

      // Load the FAB CSS with cache busting
      if (!document.getElementById('fab-button-styles')) {
        var link = document.createElement('link');
        link.id = 'fab-button-styles';
        link.rel = 'stylesheet';
        link.href = appModule.Root + '/app/components/directives/fabButton.css?v=' + Date.now();
        document.head.appendChild(link);
      }
    }
  };
}]);


// 1. La directiva (una sola vez en toda la app)
appModule.directive('clienteSearchSheet', function () {
  return {
    restrict: 'E',
    // Agregamos cache busting para evitar que se cargue una versión vieja del template en primer carga
    templateUrl: appModule.Root + '/app/components/directives/cliente-search-sheet.html?v=' + (window.appVersion || Date.now()),
    transclude: true,
    scope: false // hereda directamente del padre
  };
});