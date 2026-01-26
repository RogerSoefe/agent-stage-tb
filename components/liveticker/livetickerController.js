appModule.controller("livetickerController", [
  '$rootScope', '$scope', '$agentService', function ($rootScope, $scope, $agentService) {


    var REFRESHEVERY = 300000; // 5 min

    $scope.ReportFilters = {
      WagerType: {},
      WagerAmount: {},
      SportType: "",
        minutesAgo: {}
      
    };
    $scope.showModal = true;
    $scope.fontSizes = [{ name: "Regular", value: "0.9em" }, { name: "Medium", value: "1.2em" }, { name: "Large", value: "1.5em" }];
    $scope.fontSize = $scope.fontSizes[0];
    $scope.WagerTypes = [];
    $scope.WagerAmounts = [];
    $scope.SportTypes = [];
    $scope.minutesAgo = [];

        $scope.inputs = [
            {
                initRange: '0',
                endRange: '',
                color: '#CCE2CB'
            }];

     $scope.Init = function () {
      $rootScope.LeftMenuVisible = false;
      $agentService.ResetSessionTimer = true;
      $scope.ServerDateTime = $agentService.GetServerDateTime();
      $scope.ClientDateTime = new Date();
      $scope.ServerClienTimeDiff = $agentService.ServerClienTimeDiff;
      if (!$scope.ServerClienTimeDiff) {
        setTimeout(function () {
          $scope.ServerDateTime = $agentService.GetServerDateTime();
          $scope.ClientDateTime = new Date();
          $scope.ServerClienTimeDiff = $agentService.ServerClienTimeDiff;
        }, 1000);
      }
	  document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
	//jQuery(".modal-dialog").show();
	 location.reload(true);
  } 
});


      $scope.InitializeFilters();
      $scope.GetLiveTickerInfo();
      if (!$rootScope.IsMobile)
        setTimeout(function () {
          jQuery('table.tablesaw').fixedHeader({
            topOffset: 65
          });
        }, 1200);
      $scope.DoCleanup();
	  $scope.updateColor();

         setTimeout(function () { location.reload(true); }, 36000000);

    };

    $scope.DoCleanup = function () {
      setTimeout(function () {
		 $scope.GetLiveTickerInfo();
        $scope.CleanOldWagers();
        $scope.DoCleanup();
		$scope.updateColor();
      }, 60000);
        };

        $scope.changeFontSize = function () {
            if ($scope.fontSize && $scope.fontSize.value && $scope.LiveTickerInfo && $scope.LiveTickerInfo.length) {
                for (var wagerItem = 0; wagerItem < $scope.LiveTickerInfo.length; wagerItem++) {
                    var id = $scope.LiveTickerInfo[wagerItem].TicketNumber + "_" + $scope.LiveTickerInfo[wagerItem].WagerNumber + "_liveTicket";
                    document.getElementById(id).style.fontSize = $scope.fontSize.value;
                }
            }
        }
        $scope.removeRange = function (index) {
            $scope.inputs.splice(index, 1);
            $scope.updateColor();
        }
        $scope.addDisabled = function () {
            let initValue = $scope.inputs[$scope.inputs.length - 1].initRange;
            let endValue = $scope.inputs[$scope.inputs.length - 1].endRange;
            return !(initValue && Number(initValue) >= 0 && endValue && Number(endValue) >= 0);
        }
        $scope.add = function () {
            let initValue = 0;
            if ($scope.inputs && $scope.inputs.length > 0) {
                initValue = Number($scope.inputs[$scope.inputs.length - 1].endRange) + 1; 
            }
            var dataObj = {
                initRange: initValue,
                endRange: '',
                color: '#CCE2CB'};
            $scope.inputs.push(dataObj);
        }

    $scope.CleanScreen = function () {
      $scope.LiveTickerInfo = [];

    }
	$scope.requestSound = function () {
		jQuery(".my_audio").trigger('play');
	}


        $scope.$on('NewWagersFound', function () {
            if (!$scope.LiveTickerInfo) return;
      var newWagersCount = $agentService.LiveTickerInfo.length - $scope.LiveTickerInfo.length;
      $scope.LiveTickerInfo = $agentService.LiveTickerInfo;
            $rootScope.safeApply();
            $scope.loadSettings();
      for (var i = 0; i < newWagersCount; i++) {
        var id = $scope.LiveTickerInfo[i].TicketNumber + "_" + $scope.LiveTickerInfo[i].WagerNumber + "_liveTicket";
        $scope.LiveTickerInfo[i].FromSocket = true;
        document.getElementById(id).classList.add('log-new');
        setDelay(id);
      }
            jQuery(".my_audio").trigger('play');
            $scope.loadSettings();
        });
        $scope.clearColor = function () {
            const fontSize = $scope.getSessionData('fontSize');
            for (var wagerItem = 0; wagerItem < $scope.LiveTickerInfo.length; wagerItem++) {
                var id = $scope.LiveTickerInfo[wagerItem].TicketNumber + "_" + $scope.LiveTickerInfo[wagerItem].WagerNumber + "_liveTicket";
                if (document.getElementById(id)  != null && document.getElementById(id).style != null) {
                    document.getElementById(id).style.backgroundColor = "";
                    //document.getElementById(id).style.fontSize = "1em";
                }

            }
            if (fontSize) {
                $scope.fontSize = fontSize;
                $scope.changeFontSize();
            }
        }
        $scope.updateColor = function () {
            setTimeout(function () {
                $scope.clearColor();
                $scope.inputs.forEach(item => {
                    if (item.initRange && item.initRange >= 0 && item.endRange && item.endRange >= 0) {
                        for (var wagerItem = 0; wagerItem < $scope.LiveTickerInfo.length; wagerItem++) {
                            var id = $scope.LiveTickerInfo[wagerItem].TicketNumber + "_" + $scope.LiveTickerInfo[wagerItem].WagerNumber + "_liveTicket";
                            let winAmount = $scope.LiveTickerInfo[wagerItem].ToWinAmount / 100;
                            if (winAmount >= item.initRange && winAmount <= item.endRange) {
                                if (document.getElementById(id) != null && document.getElementById(id).style != null) {
                                    document.getElementById(id).style.backgroundColor = item.color;
                                }
                            }
                        }
                    }
                })
            }, 2000);

        }

    var setDelay = function (id) {
      setTimeout(function () {
        document.getElementById(id).classList.remove('log-new');
      }, 15000);
    };

    $scope.GetWagerItemDescription = function (wi, wagerItemIndex) {
      var fullWagerDescription = wi.Description;
      if (wi.FromSocket) {
        var descArray = fullWagerDescription.split('\r\n');
        if (descArray.length > 1 && descArray[wagerItemIndex])
          return descArray[wagerItemIndex].replace("Credit Adjustment", '').replace("Debit Adjustment", '');
        else return fullWagerDescription.replace("Credit Adjustment", '').replace("Debit Adjustment", '');
      }
      return fullWagerDescription.replaceAll('\r\n', '</br>');
    };

        $scope.InitializeFilters = function () {
            const ReportFilters = $scope.getFilterReportsSession();
            var wagerTypeObj = { Index: 0, WagerType: $scope.Translate("All Bet Types") };
            $scope.WagerTypes.push(wagerTypeObj);
            wagerTypeObj = { Index: 1, WagerType: $scope.Translate("Straight Bets Only") };
            $scope.WagerTypes.push(wagerTypeObj);
            $scope.ReportFilters.WagerType = ReportFilters.WagerType.Index ? ReportFilters.WagerType  : $scope.WagerTypes[0];
        $scope.minutesAgo = [{ value: 5, name: "5 minutes" }, { value: 10, name: "10 minutes" }, { value: 15, name: "15 minutes" },
            { value: 30, name: "30 minutes" }, { value: 60, name: "1 Hour" }];

            $scope.ReportFilters.minutesAgo = ReportFilters.minutesAgo.value ? ReportFilters.minutesAgo : $scope.minutesAgo[0]; 

      var wagerAmountsObj = { Index: 0, WagerAmount: $scope.Translate("Show All Wager Amounts") };
      $scope.WagerAmounts.push(wagerAmountsObj);
      wagerAmountsObj = { Index: 1, WagerAmount: "$0 - $1,000" };
      $scope.WagerAmounts.push(wagerAmountsObj);
      wagerAmountsObj = { Index: 2, WagerAmount: "$1,001 - $10,000" };
      $scope.WagerAmounts.push(wagerAmountsObj);
      wagerAmountsObj = { Index: 3, WagerAmount: "$10,000 " + $scope.Translate("and up") };
      $scope.WagerAmounts.push(wagerAmountsObj);
            $scope.ReportFilters.WagerAmount = ReportFilters.WagerAmount.Index ? ReportFilters.WagerAmount : $scope.WagerAmounts[0];
            if (ReportFilters.SportType && ReportFilters.SportType.length > 0) {
                $scope.ReportFilters.SportType = ReportFilters.SportType
            }
            $scope.loadSettings();
        };

        $scope.loadSettings = function () {
			$scope.showModal = $scope.getSessionData('showModal') == undefined || $scope.getSessionData('showModal') == null ? true : $scope.getSessionData('showModal');
			if(!$scope.showModal){
				$scope.closeModal();
			}
            const fontSize = $scope.getSessionData('fontSize');
            const inputs = $scope.getSessionData('inputs');

            if (fontSize) {
                $scope.fontSize = fontSize;
                $scope.changeFontSize();
            }
            if (inputs) {
                $scope.inputs = inputs;
                $scope.updateColor()
            }
        }

        $scope.saveSettings = function () {

            $scope.addSessionData('fontSize', $scope.fontSize);
            $scope.addSessionData('inputs', $scope.inputs); 
            $scope.loadSettings();
        }

        $scope.changeFilter = function () {

            $scope.addSessionData('ReportFilters', $scope.ReportFilters);
            $scope.GetLiveTickerInfo();
        }

        $scope.getFilterReportsSession = function () {
            let ReportFilters = $scope.ReportFilters;
            if ($scope.getSessionData('ReportFilters')) {
                ReportFilters = $scope.getSessionData('ReportFilters');
            }
            return ReportFilters;
        }

        $scope.GetLiveTickerInfo = function () {
            const ReportFilters = $scope.getFilterReportsSession();
            $agentService.LiveTickerFilters.WagerType = ReportFilters.WagerType;
            $agentService.LiveTickerFilters.WagerAmount = ReportFilters.WagerAmount;
            $agentService.LiveTickerFilters.SportType = ReportFilters.SportType;
            $agentService.LiveTickerFilters.minutesAgo = ReportFilters.minutesAgo;

            if ($scope.ReportFilters.WagerType && ReportFilters.WagerType.Index >= 0 && ReportFilters.WagerAmount && ReportFilters.WagerAmount.Index >= 0) {
                $agentService.GetLiveTickerInfo(ReportFilters.WagerType.Index, ReportFilters.WagerAmount.Index, ReportFilters.SportType, ReportFilters.minutesAgo.value).then(function () {
                $scope.LiveTickerInfo = $agentService.LiveTickerInfo;
                $scope.SportTypes = $agentService.LiveTickerSportTypes;
                $scope.loadSettings();
        });

      }
    };

    $scope.DisplayWagerTypeName = function (wager) {
		      var twriter = wager.EnteredBy || wager.TicketWriter;
208	
      if (twriter) {
209	
        if (twriter.indexOf("HORSE") != -1) {
210	
          $scope.isXTransaction = true;
211	
          return $scope.Translate("Horses");
212	
        }
213	
        if (twriter.indexOf("GSLIVE") != -1) {
214	
          $scope.isXTransaction = true;
215	
          return $scope.Translate("Live Betting");
216	
        }
217	
        if (twriter.indexOf("System") != -1) {
218	
          $scope.isXTransaction = true;
219	
          return $scope.Translate("Casino");
220	
        }
221	
      }
      return $agentService.DisplayWagerTypeName(wager);
    };

    $scope.CleanOldWagers = function () {
      if (!$scope.LiveTickerInfo || $scope.LiveTickerInfo.length == 0) {
        return;
      }
      var tNow = $agentService.GetServerDateTime();
      var tmpLiveTickerInfo = [];
      for (var i = 0; i < $scope.LiveTickerInfo.length; i++) {
        if (Math.abs(tNow.getTime() - $scope.LiveTickerInfo[i].ShowedDateTime.getTime()) < REFRESHEVERY) {
          tmpLiveTickerInfo.push($scope.LiveTickerInfo[i]);
        }
      }
      $scope.LiveTickerInfo = null;
      $scope.LiveTickerInfo = tmpLiveTickerInfo;
        $rootScope.safeApply();
        $scope.loadSettings();
    };

    $scope.$on("$destroy", function () {
      $agentService.ResetSessionTimer = false;
    });
	
	$scope.closeModal = function () {
		jQuery(".modal-dialog").hide();
		$scope.addSessionData('showModal', false);
	}
	
	$scope.enableSoundModal = function () {
		$scope.requestSound();
		jQuery(".modal-dialog").hide();
	}

    $scope.Init();
  }
]);