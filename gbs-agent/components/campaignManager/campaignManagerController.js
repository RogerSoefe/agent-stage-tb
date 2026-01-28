appModule.controller("campaignManagerController", [
  '$scope', '$agentService', '$compile', '$rootScope', 'DTOptionsBuilder', 'DTColumnDefBuilder', function ($scope, $agentService, $compile, $rootScope, DTOptionsBuilder, DTColumnDefBuilder) {
    $scope.selection = {};
    $scope.newCampaign = { isPayoutPercentage: true, isPayoutBoth: false, IsCPA: true, IsRevShare: false }
    let vm = this;
    let tableData = [];
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
      })
      .withOption('responsive', {
        details: {
          type: 'column',
          target: 8
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
      .withOption('lengthMenu', [[20, 35, 50, 100], [20, 35, 50, 100]])
      .withOption('pageLength', 100)
      .withOption('lengthChange', false)
      .withOption('bInfo', false)
      .withOption('paging', false)

    vm.dtColumnDefs = [
      DTColumnDefBuilder.newColumnDef(0).withTitle($scope.Translate('Campaign ID')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(1).withTitle($scope.Translate('Description')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(2).withTitle($scope.Translate('Clicks')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(3).withTitle($scope.Translate('Payout Plan')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(4).withTitle($scope.Translate('Commission Variable')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(5).withTitle($scope.Translate('Commission Perc.')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(6).withTitle($scope.Translate('Commission Amount.')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(7).withTitle($scope.Translate('Status')).renderWith(render),
      DTColumnDefBuilder.newColumnDef(8).withTitle('').renderWith(render).notSortable().withClass('control').withOption('responsivePriority', 1)
    ];

    function render(data, type, full, meta) {
      switch (meta.col) {
        case 0:
          return `<span class="cursor-pointer" ng-click="selectCampaign('${full.CampaignId}')">${full.CampaignId}</span>`;
        case 1:
          return full.Description;
        case 2:
          return full.Clicks || 0;
        case 3:
          return full.CommissionType == 'C'? 'CPA' : 'RevShare';
        case 4:
          return full.CommissionVariable.trim() == 'PRC' ? 'Percentage' : full.CommissionVariable.trim() == 'PNF' ? 'Perc. + Fixed' : full.CommissionVariable;
        case 5:
          return full.CommissionPercent;
        case 6:
          return full.PayoutAmount;
        case 7:
          return full.Status == false ? $scope.Translate('Inactive') : $scope.Translate('Active');
        default:
          return '';
      }
    }

    $scope.selectCampaign = function (campaignId) {
      $scope.newCampaign = tableData.find(x => x.CampaignId == campaignId);
      $scope.newCampaign.description = $scope.newCampaign.Description;
      $scope.newCampaign.payoutAmount = $scope.newCampaign.PayoutAmount;
      $scope.newCampaign.payoutPercentage = $scope.newCampaign.CommissionPercent;
      $scope.newCampaign.IsCPA = $scope.newCampaign.CommissionType == 'C';
      $scope.newCampaign.IsRevShare = $scope.newCampaign.CommissionType != 'C';
      $scope.newCampaign.FTD = $scope.newCampaign.CommissionVariable.trim() == 'FTD';
      $scope.newCampaign.NGR = $scope.newCampaign.CommissionVariable.trim() == 'NGR';
      $scope.newCampaign.isPayoutPercentage = $scope.newCampaign.CommissionVariable.trim() == 'PRC';
      $scope.newCampaign.isPayoutBoth = $scope.newCampaign.CommissionVariable.trim() == 'PNF';
      $scope.affiliateUrl = (SETTINGS.AffiliateUrl || 'https://affiliateclient.com') + '?affId=' + $scope.AgentAsCustomerInfo.CustomerID.trim() + '&campaign=' + $scope.newCampaign.CampaignId;
    }

    let startDate = new Date();
    let endDate = new Date();

    startDate.setDate(startDate.getDate() - 7);
    $scope.Filters = {
      startDate: startDate.toLocaleDateString('en-US'),
      endDate: endDate.toLocaleDateString('en-US'),
    };

    $scope.performance_type = 'agent';

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
        startDate: moment().subtract(90, 'day'),
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
    async function agentChanged() {
      $scope.getData();
    }
    $scope.agentChanged = agentChanged;

    $scope.getData = function () {
      let params = {
        agentId: $rootScope.selectedAgent.AgentId
      }
      $agentService.GetAgentCampaigns(params).then(function (response) {
        if (response.length == 0) {
          vm.dtOptions.withOption('aaData', {});
          return;
        }
        tableData = response;
        vm.dtOptions.withOption('aaData', response);
      });
    }

    $scope.insertCampaign = function () {
      if(validateInputs() == false) return;
      let params = {
        commissionType: ($scope.newCampaign.IsCPA || false) ? 'C' : 'R', commissionPercent: $scope.newCampaign.payoutPercentage || 0,
        payoutAmount: $scope.newCampaign.payoutAmount || 0, description: $scope.newCampaign.description,
        commissionVariable: ($scope.newCampaign.NGR || false) ? 'NGR' : (($scope.newCampaign.FTD || false) ? 'FTD' : (($scope.newCampaign.isPayoutPercentage || false) ? 'PRC' : 'PNF'))
      }
      $agentService.InsertCampaign(params).then(function (response) {
        $scope.newCampaign = response;
        $scope.newCampaign.completed = true;
        $scope.affiliateUrl = (SETTINGS.AffiliateUrl || 'https://affiliateclient.com') + '?affId=' + $scope.AgentAsCustomerInfo.CustomerID.trim() + '&campaign=' + $scope.newCampaign.CampaignId;
        $scope.getData();
      })

    }

    $scope.updateCampaign = function () {
      if (validateInputs() == false) return;
      let params = {
        campaignId: $scope.newCampaign.CampaignId, commissionType: $scope.newCampaign.IsCPA ? 'C' : 'R', commissionPercent: $scope.newCampaign.payoutPercentage || 0,
        payoutAmount: $scope.newCampaign.payoutAmount || 0, description: $scope.newCampaign.description, status: $scope.newCampaign.Status,
        commissionVariable: $scope.newCampaign.NGR ? 'NGR' : ($scope.newCampaign.FTD ? 'FTD' : ($scope.newCampaign.isPayoutPercentage ? 'PRC' : 'PNF'))
      }
      $agentService.UpdateCampaign(params).then(function (response) {
        $scope.newCampaign.completed = true;
        $scope.affiliateUrl = (SETTINGS.AffiliateUrl || 'https://affiliateclient.com') + '?affId=' + $scope.AgentAsCustomerInfo.CustomerID.trim() + '&campaign=' + $scope.newCampaign.CampaignId;
        $scope.getData();
      })

    }

    function validateInputs() {
      $scope.newCampaign.showErrorMsg1 = ($scope.newCampaign.payoutPercentage > 100 || $scope.newCampaign.payoutPercentage < 0);
      $scope.newCampaign.showErrorMsg2 = ($scope.newCampaign.payoutAmount > 100000 || $scope.newCampaign.payoutAmount < 0);
      return !$scope.newCampaign.showErrorMsg1 && !$scope.newCampaign.showErrorMsg2;
    }

    $scope.clearCampaign = function () {
      $scope.newCampaign = { isPayoutPercentage: true, isPayoutBoth: false, IsCPA: true, IsRevShare: false }
    }

    $scope.copyUrl = function () {
      const copyText = document.getElementById("urlText");
      // Select the text field
      copyText.select();
      copyText.setSelectionRange(0, 99999); // For mobile devices

      // Copy the text inside the text field
      navigator.clipboard.writeText(copyText.value);
      $scope.copyUrlText = $scope.Translate('Link copied');
    }

    Init();
  }
]);

