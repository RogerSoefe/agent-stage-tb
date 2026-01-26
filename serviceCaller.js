
function ServiceCaller($http, loadingBar, handler, method, data) {

    this._handler = handler;
    this._data = data;
    this._method = method;
    this._$http = $http;
    this._loadingBar = loadingBar;

    this.AJAX_POST_METHOD = 'POST';
    this.AJAX_GET_METHOD = 'GET';
    this.AJAX_DATATYPE = 'json';
    this.AJAX_HEADERS = { "Content-Type": "application/json" };

    //Document_Function
    this.ValidateSession = function (response, url) {
        var valid = true;
        if (response == null) valid = false;
        else {
            var d = null;
            if (response.data != null) d = response.data;
            else if (response.d != null) d = response.d;
            if (d != null) {
                if (d.Code != null && d.Code == ServiceCaller.ResultCode.SessionExpired) valid = false;
                else if (d.d != null) {
                    if (d.d.Code != null) {
                        if (response.data.d.Code == ServiceCaller.ResultCode.SessionExpired) {
                            valid = false;
                        }
                    }
                }
            }
        }
        if (!valid) {
            // Evitar logout múltiple durante TrackStatus
            if (!window._isLoggingOut) {
                window._isLoggingOut = true;
                console.warn('Session expired detected. Logging out...', url);
            this.POST({}, 'Logout').then(function () {
                CommonFunctions.RedirecToPage(SETTINGS.LoginSite);
            });
        }
        }
        return valid; // ← CRÍTICO: Retornar el valor
    };

    //Document_Function
    this.POST = function (datap, methodp, handlerp, ignoreLoadingBar) {
      if (methodp) this._method = methodp;
      if (datap) this._data = datap;
      if (handlerp) this._handler = handlerp;
      //if (this._loadingBar) this._loadingBar.start();
      var parent = this;
      return this._$http({
        method: this.AJAX_POST_METHOD,
        dataType: this.AJAX_DATATYPE,
        headers: this.AJAX_HEADERS,
        data: this._data,
          url: appModule.Root + '/Services/' + this._handler + '.asmx/' + this._method,
        ignoreLoadingBar: ignoreLoadingBar
      }).success(function (response) {
        //if (parent._loadingBar) parent._loadingBar.complete();
          if (parent.ValidateSession(response, appModule.Root + '/Services/' + handlerp + '.asmx/' + methodp)) return response.data;
        else return null;
      });
    };

    //Document_Function
    this.GET = function (url) {
        //var parent = this;
        return $http({
            method: this.AJAX_GET_METHOD,
            url: url,
        }).success(function (response) {
            return response.data;
        });
    };

};

ServiceCaller.ResultCode = {
    Success: 0,
    Fail: 1,
    SessionExpired: 2,
    TimeOut: 3,
    Warning: 4
};