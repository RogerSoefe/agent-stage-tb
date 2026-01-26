appModule.controller("freePlayTransactionsController", ['$scope', '$rootScope', '$agentService', '$timeout', function ($scope, $rootScope, $agentService, $timeout) {
  $scope.selection = {};
  $scope.pagination = {
    currentPage: 1,
    pageSize: 50,
    totalRecords: 0,
    totalPages: 0
  };

  var searchPromise = null;

  function Init() {
    let endDate = new Date();
    let startDate = new Date();
    startDate.setDate(startDate.getDate() - 5);
    $scope.Filters = {
      SelectedAgent: null,
      startDate: (startDate.getMonth() + 1) + "/" + startDate.getDate() + "/" + startDate.getFullYear(),
      endDate: (endDate.getMonth() + 1) + "/" + endDate.getDate() + "/" + endDate.getFullYear(),
    };

    if ($rootScope.selectedAgent) {
      $scope.getData();
    }
    else {
      $rootScope.$on('AgentAsCustomerInfoReady', function () {
        if ($rootScope.selectedAgent) {
          $scope.getData();
        }
      });
    }
  }

jQuery("#endDateInput").datepicker({
  defaultDate: new Date(),
  onSelect: function(dateText) {
    $scope.$apply(function() {
      $scope.Filters.endDate = dateText;
      if ($scope.selection && $scope.selection.customer) {
        $scope.pagination.currentPage = 1;
        loadTransactions();
      }
    });
  }
});

jQuery("#startDateInput").datepicker({
  defaultDate: -7,
  onSelect: function(dateText) {
    $scope.$apply(function() {
      $scope.Filters.startDate = dateText;
      if ($scope.selection && $scope.selection.customer) {
        $scope.pagination.currentPage = 1;
        loadTransactions();
      }
    });
  }
});

  $scope.type = [
    {
      name: 'All',
      code: 'A'
    },
    {
      name: 'Wagers',
      code: 'W'
    },
    {
      name: 'Transactions',
      code: 'T'
    }
  ];

  $scope.selectedType = $scope.type[0];

  $scope.getData = function(){
    if ($rootScope.selectedAgent && $rootScope.selectedAgent.AgentId) {
      getAgentPlayers($rootScope.selectedAgent.AgentId);
    }
  }

  $scope.AgentWithTransactions = function (ag) {
    return ag.AgentId == $scope.Agents[0].AgentId || (ag.Transactions && ag.Transactions.length > 0);
  };

  $scope.GetAgentCustomerTransactions = function () {
    if (!$scope.selection || !$scope.selection.customer) {
      console.warn('No customer selected');
      return;
    }
    $scope.pagination.currentPage = 1;
    loadTransactions();
  };

  $scope.goToPage = function(page) {
    if (page >= 1 && page <= $scope.pagination.totalPages) {
      $scope.pagination.currentPage = page;
      loadTransactions();
    }
  };

  $scope.previousPage = function() {
    if ($scope.pagination.currentPage > 1) {
      $scope.pagination.currentPage--;
      loadTransactions();
    }
  };

  $scope.nextPage = function() {
    if ($scope.pagination.currentPage < $scope.pagination.totalPages) {
      $scope.pagination.currentPage++;
      loadTransactions();
    }
  };

  $scope.changePageSize = function() {
    $scope.pagination.currentPage = 1;
    loadTransactions();
  };

  function loadTransactions() {
    if (!$rootScope.selectedAgent || !$scope.selection || !$scope.selection.customer) {
      console.warn('Missing required data for loading transactions');
      return;
    }

    $scope.showLoadingGif('loadingAllTransactions');
    
    const params = {
      agentId: $rootScope.selectedAgent.AgentId,
      customerId: $scope.selection.customer.CustomerId || '',
      tranTypeFilter: $scope.selectedType.code,
      initialDate: $scope.Filters.startDate,
      finalDate: $scope.Filters.endDate,
      pageNumber: $scope.pagination.currentPage,
      pageSize: $scope.pagination.pageSize
    };

    $agentService.GetFreePlayTransactions(params).then(function (result) {
      let data = result.data || result;
      
      if (!data || data.length === 0) {
        $scope.AgentsTrans = [];
        $scope.pagination.totalRecords = 0;
        $scope.pagination.totalPages = 0;
        $scope.hideLoadingGif('loadingAllTransactions');
        return;
      }

      let groupedData = CommonFunctions.groupBy(data, 'AgentID');
      $scope.AgentsTrans = GroupTransactions(Object.keys(groupedData).map((key) => groupedData[key]));
      
      // Update pagination info
      if (data.length > 0 && data[0].TotalRecords) {
        $scope.pagination.totalRecords = data[0].TotalRecords;
        $scope.pagination.totalPages = Math.ceil($scope.pagination.totalRecords / $scope.pagination.pageSize);
      } else {
        $scope.pagination.totalRecords = 0;
        $scope.pagination.totalPages = 0;
      }
      
      $scope.hideLoadingGif('loadingAllTransactions');
    }).catch(function(error) {
      console.error('Error loading transactions:', error);
      $scope.AgentsTrans = [];
      $scope.pagination.totalRecords = 0;
      $scope.pagination.totalPages = 0;
      $scope.hideLoadingGif('loadingAllTransactions');
    });
  }

  async function getAgentPlayers(agentId, search) {
    try {
      const result = await $agentService.GetAgentPlayers(agentId, search || '', 50);
      
      $scope.$apply(function() {
        let players = result.data && result.data.d ? result.data.d.Data : null;
        
        if (players && players.length > 0) {
          $scope.AgentCustomers = players.map(function (p) {
            return { CustomerId: p, label: p }
          });
        } else {
          $scope.AgentCustomers = [];
        }
        
        $scope.selectedCustomers = [{ CustomerId: null, label: 'All' }, ...$scope.AgentCustomers];
        
        // Solo seleccionar el primero si no hay nada seleccionado
        if (!$scope.selection.customer) {
          $scope.selection.customer = $scope.selectedCustomers[0];
        }
      });
      
      // Solo cargar transacciones si no hay búsqueda activa
      if (!search) {
        $scope.GetAgentCustomerTransactions();
      }
    } catch (error) {
      console.error('Error getting agent players:', error);
      $scope.$apply(function() {
        $scope.AgentCustomers = [];
        $scope.selectedCustomers = [{ CustomerId: null, label: 'All' }];
        $scope.selection.customer = $scope.selectedCustomers[0];
      });
    }
  }

  // Función que el directive custom-select llamará cuando el usuario busque
  // El directive custom-select pasa $searchTerm a la función valuesFn
  $scope.searchAgentCustomers = function($searchTerm) {
    if (!$rootScope.selectedAgent || !$rootScope.selectedAgent.AgentId) {
      return $scope.selectedCustomers || [];
    }

    // Cancelar búsqueda anterior si existe
    if (searchPromise) {
      $timeout.cancel(searchPromise);
    }

    // Si el término de búsqueda está vacío, retornar la lista completa
    if (!$searchTerm || $searchTerm.trim() === '') {
      return $scope.selectedCustomers || [];
    }

    // Configurar nueva búsqueda con delay
    searchPromise = $timeout(function() {
      getAgentPlayers($rootScope.selectedAgent.AgentId, $searchTerm.trim());
    }, 300); // 300ms de debounce

    // Mientras tanto, retornar la lista actual
    return $scope.selectedCustomers || [];
  };

  function GroupTransactions(trans) {
    if (!trans || trans.length <= 0) return [];
    
    for (var i = 0; i < trans.length; i++) {
      let ag = trans[i];
      if (!ag || ag.length === 0) continue;
      
      ag.Transactions = ag.length;
      ag.Total = 0;
      ag.TotalD = 0;
      ag.TotalC = 0;
      
      ag.forEach(function (t) {
        if (!t) return;
        ag.Total += t.TranCode == 'D' ? (t.Amount * -1) : t.Amount;
        ag.TotalD += t.TranCode == 'D' ? t.Amount : 0;
        ag.TotalC += t.TranCode == 'C' ? t.Amount : 0;
      });
    }
    return trans;
  }

  Init();

}]);