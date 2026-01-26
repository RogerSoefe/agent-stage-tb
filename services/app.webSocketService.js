appModule.factory('$webSocketService', ['$agentService', '$rootScope', function ($agentService, $rootScope) {
  var _webSocketService = {
    connectionSate: 0,
    lastMessage: ""
  };
  var _connectionSate = 0;
  var _servers = SETTINGS.SocketServers;
  var _selectedServer;
  var _customerSubscribed = false;
  var _errorAttempts = 0;

  function getSelectServer() {
    if (window.webConfig && window.webConfig.webSocketServerUrl) return window.webConfig.webSocketServerUrl;
    if (!_servers || _servers.length == 0) return "";
    if (_selectedServer) return _servers[_selectedServer];
    else _selectedServer = Math.floor(Math.random() * _servers.length);
    return _servers[_selectedServer];
  };

  function logLastAction(data) {
    if (!data) return;
    _webSocketService.lastMessage = data.Context ? data.Context : data;
    var d = new Date();
    _webSocketService.lastMessage += " / " + d.toLocaleTimeString();
  }

  jQuery.support.cors = true;

  var _ws = jQuery != null ? jQuery.connection : null;

  var _server = getSelectServer();
  if (_ws && _server != "") _ws.hub.url = _server;

  var _gbsHub = _ws != null ? _ws.gbsHub : null;

  var _hubReady = null;

  function hubIsActive() {
    if (_errorAttempts > 3) {
      _webSocketService.connectionSate = 3;
      _ws.hub.stop();
      return false;
    }
    return _gbsHub != null;
  };

	_ws.hub.logging = false;
  if (hubIsActive() && _ws) {
    _hubReady = _ws.hub.start(function () {
    }).fail(function (reason) {
      _webSocketService.connectionSate = 2;
      logLastAction("Connection Fail: " + reason);
    });
    _ws.hub.stateChanged(function (change) {
      _webSocketService.connectionSate = change.newState;
      logLastAction("Connection Changed");
    });

    _ws.hub.disconnected(function () {
      setTimeout(function () {
        _ws.hub.start();
      }, 5000); // Restart connection after 5 seconds.
    });

    window.onbeforeunload = function () {
      _ws.hub.stop();
      _webSocketService.connectionSate = 0;
    };
  }
  else {
    _webSocketService.connectionSate = 2;
    logLastAction("Hub is not active");
  }

  _webSocketService.SubscribeCustomer = function (agentId, store) {
    if (!hubIsActive()) return;
    _hubReady.done(function () {
      _gbsHub.server.subscribeCustomer({ CustomerId: agentId, Platform: 'WEB', Type: "Agent", Store: store });
    });
  };

  _webSocketService.Disconnect = function () {
    if (!hubIsActive()) return;
    _hubReady.done(function () {
      _gbsHub.server.DisconnectUser();
    });
  };

  _webSocketService.IsSupported = function () {
    if ("WebSocket" in window) return true;
    //_ReportError("WebSocket NOT supported by your Browser!");
    return false;
  };

  _webSocketService.IsConnected = function () {
    return _webSocketService.connectionSate != 4;
  };

  _webSocketService.GetState = function () {
    return _webSocketService.connectionSate;
  };

  if (hubIsActive()) {

    _gbsHub.client.broadcastMessage = function (message) {
      try {
        message = jQuery.parseJSON(message);
        switch (message.Context) {
          case "WagersInfoChange":
            $agentService.PrependWagersToBetTicker(message.Data);
            break;
        }
      } catch (ex) {
        console.log(ex, message);
      }
    }

    _gbsHub.client.closeSession = function () {
      $rootScope.Logout();
    };
  }

  _webSocketService.GetCurrentServer = function () {
    return _servers[_selectedServer];
  }

  return _webSocketService;

}]);