appModule.controller("performanceCustomerController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    let vm = this;
    vm.dtInstance = {};
    vm.dtOptions = DTOptionsBuilder.newOptions()
      //.withOption('stateSave', true)
      .withOption('aaData', {})
      .withOption('createdRow', function (row) {
        // Recompiling so we can bind Angular directive to the DT
        $compile(angular.element(row).contents())($scope);
      })
      .withOption('initComplete', function (settings) {
        // Recompiling so we can bind Angular directive to the DT
        $compile(angular.element('#' + settings.sTableId).contents())($scope);
        jQuery('.dt-buttons').find('a').tooltip();
        jQuery('#' + settings.sTableId + ' tbody').on('click', 'tr td', function (e) {
          if (jQuery(e.target).closest('span').length == 0) {
            $compile(angular.element('#' + settings.sTableId).contents())($scope);
            return;
          }
          jQuery(this).click();
        });
        
        jQuery.fn.dataTable.ext.type.order['custom-asc'] = function(a, b) {
          console.log('trggr asc');
          const tempElement = document.createElement('div');
          tempElement.innerHTML = a;
          // Acceder a los atributos del elemento
          let miDiv = tempElement.querySelector('span');
          const dateA = new Date(miDiv.getAttribute('date'));
          tempElement.innerHTML = b;
          // Acceder a los atributos del elemento
          miDiv = tempElement.querySelector('span');
          const dateB = new Date(miDiv.getAttribute('date'));
          tempElement.remove();
          if(dateA >= dateB) return -1;
          return 1;
          // Eliminar el elemento del DOM
        }

        jQuery.fn.dataTable.ext.type.order['custom-desc'] = function(a, b) {
          console.log('trggr des');

          const tempElement = document.createElement('div');
          tempElement.innerHTML = a;
          // Acceder a los atributos del elemento
          let miDiv = tempElement.querySelector('span');
          const dateA = new Date(miDiv.getAttribute('date'));
          tempElement.innerHTML = b;
          // Acceder a los atributos del elemento
          miDiv = tempElement.querySelector('span');
          const dateB = new Date(miDiv.getAttribute('date'));
          tempElement.remove();
          if(dateA >= dateB) return 1;
          return -1;
          // Eliminar el elemento del DOM
        }
      })
      .withOption('responsive', {
        details: {
          type: 'column',
          target: 6
        }
      })
      .withDOM('Bflrtip')
      .withOption('buttons', [
        { extend: 'copy', text: 'Copy' },
        { extend: 'excel', text: 'XLS' },
        { extend: 'pdf', text: 'PDF' },
        { extend: 'print', text: 'Print' }
      ])
      .withOption('aaSorting', [])
      .withOption('lengthMenu', [[100, 500, 800, 1000], [100, 500, 800, 1000]])
      .withOption('pageLength', 1000)
      .withOption('lengthChange', true)
      .withOption('bInfo', true)
      .withOption('paging', true)

    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Period')).renderWith(render).withOption('type', 'custom').withOption('order', [[0, 'asc']]),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('AgentId')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('CustomerId')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Won')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Lost')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Net')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(6).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<span date="${full.DailyFigureDateString}">${full.period}`;
        case 1:
          return full.AgentId;
        case 2:
          return full.CustomerId;
        case 3:
          return CommonFunctions.FormatNumber(full.Won, false);
        case 4:
          return CommonFunctions.FormatNumber(full.Lost, false);
        case 5:
          return CommonFunctions.FormatNumber(full.Net, false);
        case 6:
          return CommonFunctions.FormatNumber(full.Volume, false);
        case 7:
          return full.WagerCount;
        case 8:
          return CommonFunctions.FormatNumber(full.AverageBet, false);
        default:
          return '';
      }
    }

    let startDate = new Date();
    let endDate = new Date();

    //startDate.setDate(startDate.getDate() - 7);
    $scope.Filters = {
      startDate: startDate.toLocaleDateString('en-US'),
      endDate: endDate.toLocaleDateString('en-US'),
    };

    async function Init() {
      $scope.PeriodRange = 'W';
      jQuery("#startDateInput").daterangepicker({
        locale: {
          firstDay: 1
        },
        singleDatePicker: true,
        showDropdowns: true,
        opens: 'left',
        dateFormat: 'mm/dd/yyyy',
        startDate: moment().subtract(0, 'day'),
      }).on('apply.daterangepicker', function () {
        $scope.getData();
      });
      jQuery("#endDateInput").daterangepicker({
        locale: {
          firstDay: 1
        },
        singleDatePicker: true,
        showDropdowns: true,
        opens: 'left',
        dateFormat: 'mm/dd/yyyy'
      }).on('apply.daterangepicker', function () {
        $scope.getData();
      });
      await getSports();
      if ($rootScope.selectedAgent) {
        $scope.WeeksRange = $agentService.GetWeeksRange();
        $scope.SelectedWeekNumber = $scope.WeeksRange[0];
        $scope.getData();
      } else {
        $rootScope.$on('AgentAsCustomerInfoReady', function () {
          $scope.WeeksRange = $agentService.GetWeeksRange();
          $scope.SelectedWeekNumber = $scope.WeeksRange[0];
          $scope.getData();
        });
      }
    };

    $scope.getData = function () {
      params = { customerId: $rootScope.selectedAgent.AgentId, period: $scope.PeriodRange, customRangeStartingDate: $scope.Filters.startDate || null, customRangeEndingDate: $scope.Filters.endDate || null }
      $agentService.GetCustomerPerformanceByPeriod(params).then(function (response) {
				if (response.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        vm.dtOptions.withOption('aaData', response);
      });
    }

    async function getSports() {
      $scope.Sports = [];
      let sports = (await $agentService.GetSports());
      $scope.Sports = sports;
      $scope.SelectedSport = $scope.Sports[0];
      await getSubSports();

    }

    const getSubSports = async function () {
      $scope.subSports = (await $agentService.GetSubSportTypesBySportType($scope.SelectedSport.SportType)).data.d.Data;
      $scope.selectedSubSport = $scope.subSports[$scope.subSports.findIndex(x => x.SportSubType == 'All')];
    }

    const sportChanged = async function () {
      await getSubSports();
      $scope.getData();
    }

    $scope.getSubSports = getSubSports;
    $scope.sportChanged = sportChanged;


    Init();
  }
]);

