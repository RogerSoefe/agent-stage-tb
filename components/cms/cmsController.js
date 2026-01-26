appModule.controller('cmsController', ['$scope', '$route', '$agentService', '$sce', '$rootScope', '$routeParams', '$location', '$anchorScroll',
  function ($scope, $route, $agentService, $sce, $rootScope, $routeParams, $location, $anchorScroll) {

  function init() {
    $location.hash($routeParams.anchor);
    $anchorScroll();
    loadPageContent();
  }

    $scope.gotoAnchor = function(anchor) {
      var elmnt = document.getElementById(anchor);
      elmnt.scrollIntoView({ behavior: 'smooth', block: 'center'});
    };

  function loadPageContent() {
    const container = document.querySelector('.page-content-wrapper');
    if(container){
      container.scrollTop = 0;
    }

    var pageId = $route.current.$$route.cmsPageId;
    $agentService.LoadPage(pageId).then(function (result) {
      if (!result) return;
      renderHtml(result.content.rendered);
    });
  }


  function renderHtml (htmlCode) {
    if (!htmlCode) return "";
    $scope.CmsContent = $sce.trustAsHtml(htmlCode);
  }


  init();

}]);