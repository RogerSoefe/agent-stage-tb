appModule.factory('$integrationService', ['$http', '$rootScope', '$translatorService', function ($http, $rootScope, $translatorService) {
    var caller = new ServiceCaller($http, null, 'IntegrationsService');
    var integrationsService = {};

    integrationsService.GetVigLimits = function (customerId) {
        return caller.POST({ customerId: customerId }, 'GetVigLimitsByPlayer', null, true).then(function (result) {

            return result.data.d;
        });
    };

    integrationsService.SetVigLimits = function (custLimits) {
        return caller.POST({ custLimits: custLimits }, 'SetVigLimitsByPlayer', null, true).then(function (result) {
            return result.data.d;
        });
    };
	integrationsService.GetMobitazLimitByPlayer = function (customerID) {
		return caller.POST({ customerId: customerID }, 'GetMobitazLimitByPlayer', null, true).then(function (result) {
			return result.data.d;
		});
	};

	integrationsService.OverrideMobitazPlayerLimit = function (mtOverridePlayerLimitRequest) {
		return caller.POST({ mtOverridePlayerLimitRequest: mtOverridePlayerLimitRequest }, 'OverrideMobitazPlayerLimit', null, true).then(function (result) {
			return result.data.d;
		});
	};

    return integrationsService;
}]);