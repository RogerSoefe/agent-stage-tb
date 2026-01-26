appModule.directive('agentTree', ['$recursionHelper', function ($recursionHelper) {
	return {
		restrict: 'AEC',
		scope: {
			agentsList: '=',
			OpenAgentManager: '=openAgentManager'
		},
		controller: ['$scope', '$rootScope', '$translatorService', '$agentService', function ($scope, $rootScope, $translatorService, $agentService) {

		}],
		compile: function (element) {
			// Use the compile function from the RecursionHelper,
			// And return the linking function(s) which it returns
			return $recursionHelper.compile(element);
		},
		templateUrl: appModule.Root + '/app/directives/agentTree/agentTree.html'
	};
}]);