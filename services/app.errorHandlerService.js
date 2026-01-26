appModule.factory('$errorHandler', ['$rootScope', '$http', function ($rootScope, $http) {

    var caller = new ServiceCaller($http, null, 'ErrorService');

    var errorHandler = {};

    errorHandler.stackLinesToReport = 4;
    errorHandler.output = "service"; // console, service or screen
    errorHandler.active = true;
    errorHandler.appName = "SIDWeb";

    errorHandler.GetStackLines = function (stack) {
        var strRet = "";
        var stackArray = stack.split("\n");
        this.stackLinesToReport = 4;
        for (var i = 0; i < this.stackLinesToReport; i++) {
            strRet += stackArray[i];
            if (i < this.stackLinesToReport - 1) strRet += "\n";
        }
        return strRet;
    };

    errorHandler.SubmitError = function (data) {
        var stackTrace = data.Message + "\n" + data.StackLines;
        caller.POST({ 'appName': errorHandler.appName, 'stackTrace': stackTrace }, 'Error').then();
    };

    errorHandler.Error = function (data, method) {
        if (typeof method === "undefined") method = "Undefined";
        if (errorHandler.active) {
            var stackLines = "";
            var msg = "Method: " + method + ". ";
            if (typeof data == 'string') {
                msg += "str: " + data;
            } else if (data.type != null && data.target != null && data.type == "error") msg += JSON.stringify(data);
            else if (typeof data == 'object') {
                if (data.stack) stackLines = errorHandler.GetStackLines(data.stack);
                try {
                    msg += data.toString();
                } catch (ex) {
                }
            }
            var obj = { StackLines: stackLines, Message: msg };
            if (errorHandler.output == "console") log(data);
            else if (errorHandler.output == "screen") alert(data);
            else errorHandler.SubmitError(obj);
        }
    };

    return errorHandler;

}]);