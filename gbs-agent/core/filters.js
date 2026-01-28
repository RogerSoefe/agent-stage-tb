//Document_Filter
appModule.filter("formatGameDate", function () {
    return function (dateTime) {
        dateTime = CommonFunctions.FormatDateTime(dateTime, 11);
        return dateTime;
    };
});

//Document_Filter
appModule.filter("formatGameTime", function () {
    return function (dateTime) {
        //dateTime = CommonFunctions.FormatDateTime(CommonFunctions.JSONToDate(dateTime, false), 2);
        dateTime = CommonFunctions.FormatDateTime(dateTime, 13);
        return dateTime;
    };
});

//Document_Filter
appModule.filter("formatGameZone", function () {
    return function (dateTime) {
        //dateTime = CommonFunctions.FormatDateTime(CommonFunctions.JSONToDate(dateTime, false), 2);
        dateTime = CommonFunctions.FormatDateTime(dateTime, 14);
        return dateTime;
    };
});

//Document_Filter
appModule.filter("formatLine", ['$customerService', '$wagerTypesService', function ($customerService, $wagerTypesService) {
    return function (value, scope, game, wagerType) {
        var teamPos = parseInt(wagerType.substring(1, 2));
        var priceType = $customerService.Info ? $customerService.Info.PriceType : "A";
        switch (wagerType.substring(0, 1)) {
            case "S":
                value = LineOffering.FormatSpreadOffer(game, teamPos, true, true, true, priceType);
                break;
            case "M":
                value = LineOffering.FormatMoneyLineOffer(game, teamPos, true, true, priceType);
                break;
            case "L":
                value = LineOffering.FormatTotalOffer(game, teamPos, true, true, true, priceType);
                if (value != LineOffering.DisabledLineLabel) {
                    if (teamPos == 1) value = LineOffering.OverLabel + " " + value;
                    else value = LineOffering.UnderLabel + " " + value;
                }
                break;
            case "E":
                var wt = $wagerTypesService.Selected.name;
                value = LineOffering.GetTeamTotalsOffer(game, teamPos, true, true, true, wt, priceType);
                if (value != LineOffering.DisabledLineLabel) {
                    if (teamPos == 1 || teamPos == 2) value = LineOffering.OverLabel + " " + value;
                    else value = LineOffering.UnderLabel + " " + value;
                }
                break;

        }
        return value;
    };
}]);

appModule.filter('dollar', function () {
  return function (value, divide = true) {
    return value ? ('$' + CommonFunctions.FormatNumber(value, divide)) : '$0.00';
    };
});

appModule.filter('formatNumber', function () {
    return function (value, divide, applyFloor, showCents) {
        if (typeof divide === "undefined") divide = true;
        if (typeof applyFloor === "undefined") applyFloor = false;
        if (typeof showCents === "undefined") showCents = true;
        return CommonFunctions.FormatNumber(value, divide, applyFloor, showCents);
    };
});

appModule.filter('reverse', function () {
    return function (items) {
        return items.slice().reverse();
    };
});

appModule.filter('groupBy', function () {
    return function (list, group_by) {

        var filtered = [];
        var prev_item = null;
        var group_changed = false;
        // this is a new field which is added to each item where we append "_CHANGED"
        // to indicate a field change in the list
        var new_field = group_by + '_CHANGED';

        // loop through each item in the list
        angular.forEach(list, function (item) {

            group_changed = false;

            // if not the first item
            if (prev_item !== null) {

                // check if the group by field changed
                if (prev_item[group_by] !== item[group_by]) {
                    group_changed = true;
                }

                // otherwise we have the first item in the list which is new
            } else {
                group_changed = true;
            }

            // if the group changed, then add a new field to the item
            // to indicate this
            if (group_changed) {
                item[new_field] = true;
            } else {
                item[new_field] = false;
            }

            filtered.push(item);
            prev_item = item;

        });
        return filtered;
    };
});

appModule.filter('FormatCustomer', function () {
  return function (custId) {
    if (!SETTINGS.CustomerIdSufix || SETTINGS.CustomerIdSufix == '') return custId;
    if (!custId) return '';
    let result = custId.substring(0, custId.indexOf(SETTINGS.CustomerIdSufix));
    return result ? custId.substring(0, custId.indexOf(SETTINGS.CustomerIdSufix)) : custId;
  };
});


appModule.filter('Translate', ['$translatorService', function ($translatorService) {
  return function (text) {
    return $translatorService.Translate(text);
  }
}]);

appModule.filter('unsafe', function ($sce) { return $sce.trustAsHtml; });

appModule.filter("isEmpty", function () {
  return function (input) {
    return !input || input.length === 0;
  };
});