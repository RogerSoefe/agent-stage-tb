var appCtrl = appModule.controller("appController", ['$rootScope', '$scope', '$agentService', '$webSocketService', '$route', '$translatorService', function ($rootScope, $scope, $agentService, $webSocketService, $route, $translatorService) {

    let togglelList = ["Favorites"];
    $scope.TextLearningModeOn = SETTINGS.TextLearningModeOn;
	$scope.LoginSite = SETTINGS.LoginSite;
  $scope.AllAgentsList = [];
  $scope.currentAgentDashboard = {}
  $scope.ShowCashier = window.webConfig.showCashier;
  $rootScope.viewMode = '1';
	$scope.WeekArray = [{
		val: "0",
		bind: $translatorService.Translate('This Week')
	},
	{
		val: "1",
		bind: $translatorService.Translate('Last Week')
	},
	{
		val: "2",
		bind: $translatorService.Translate('Last 2 Week')
	},
	];
	$scope.Week = $scope.WeekArray[0];
  $scope.quickSearch = null;
  $rootScope.bubbleDrag = {};
  $scope.dfSetting = {
    id: true,
    password: true,
    fullName: true,
    payments: true,
    overall: true,
    prevBal: true,
    pending: true,
    thisWeek: true,
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: true
  }

 /*
 * BOOKMARKS UTILITY
 * */
  $scope.BOOKMARK_STORAGE_KEY = 'bookmarks_storage'
  $scope.bookmarsStorage = {
    fetch: function () {
			var bookmarks = JSON.parse(window.localStorage.getItem($scope.BOOKMARK_STORAGE_KEY)) || [{ title: 'Customer Daily Figures', link: '#/dailyfigures' }, { title: 'Pending Bets', link: '#/openbets' }];
      return bookmarks
    },
    save: function () {
      window.localStorage.setItem($scope.BOOKMARK_STORAGE_KEY, JSON.stringify($scope.bookmarks))
    }
  }

  $scope.bookmarks = $scope.bookmarsStorage.fetch();

	$scope.getBookmarkIndex = function (bookmark_title) {
    var indexToRemove = -1;
		for (var i = 0; i < $scope.bookmarks.length; i++) {
			if ($scope.bookmarks[i]['title'] == bookmark_title) {
        indexToRemove = i;
      }
    }
    return indexToRemove;
  }

  $scope.openChatWindow = function () {
    window.open(SETTINGS.ChatUrl, 'mywindow', 'toolbar=no, location=no, directories=no,titlebar=0, status=no, menubar=no, scrollbars=no, copyhistory=no, top=top, left=left,width=500,height=700');
  };

	$scope.toggleBookmark = function (bookmark_title, bookmark_link) {
    var indexToRemove = $scope.getBookmarkIndex(bookmark_title);
		if (indexToRemove != -1) {
			$scope.bookmarks.splice(indexToRemove, 1);
		} else {
      $scope.bookmarks.push({
				'title': bookmark_title,
				'link': bookmark_link
      })
    }

    $scope.bookmarsStorage.save();
  }
  /*
  * FIN BOOKMARKS UTILITY
  * */
     function Linkify(inputText) {
        //URLs starting with http://, https://, or ftp://
        var replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
        var replacedText = inputText.replace(replacePattern1, '<a style="color:#356FB5" href="$1" target="_blank">$1</a>');

        //URLs starting with www. (without // before it, or it'd re-link the ones done above)
        var replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
        var replacedText = replacedText.replace(replacePattern2, '$1<a style="color:#356FB5" href="http://$2" target="_blank">$2</a>');

        //Change email addresses to mailto:: links
        var replacePattern3 = /(([a-zA-Z0-9_\-\.]+)@[a-zA-Z_]+?(?:\.[a-zA-Z]{2,6}))+/gim;
        var replacedText = replacedText.replace(replacePattern3, '<a style="color:#356FB5" href="mailto:$1">$1</a>');

        return replacedText
    }
    function showCommentsForCustomer() {
        const expDate = $scope.AgentInfo.CommentsForAgentExpDateString ? new Date($scope.AgentInfo.CommentsForAgentExpDateString) : null;
        if ($scope.AgentInfo.CommentsForAgent && (!expDate || (expDate.getTime() >= (new Date).getTime()))) {
            const displayDontShowAgain = $scope.AgentInfo.DisplayDontShowAgain != null && $scope.AgentInfo.DisplayDontShowAgain == true;
            Swal.fire({
                html: $scope.AgentInfo.CommentsForAgent,
                title: '',
                input: displayDontShowAgain ? 'checkbox' : null,
                icon: 'info',
                inputValue: 0,
                inputPlaceholder: $scope.Translate(`Don't Show Again`)
            }
            ).
                then(result => {
                    if (result.value == 1 && displayDontShowAgain) {
                        $agentService.deleteNotification({ notificationType: 'agent' }).then(function (result) {
                        });
                    }
                })


        }
    }

  $scope.fireSwal = function (title, message = '', type = 'success', callback = function () { }) {
		swal.fire(
			title,
			message,
      type).then((result) => {
        if (result.isConfirmed) {
          callback();
        }
      })
	}

    $scope.showNonPosted = function (report, customer) {
        let MyDate = new Date();
        let current_date;

        MyDate.setDate(MyDate.getDate());

        current_date = ('0' + (MyDate.getMonth() + 1)).slice(-2) + '/'
            + ('0' + MyDate.getDate()).slice(-2) + '/'
            + MyDate.getFullYear() + " " + "00:00";
        let currentBalance = 0;
		
	report.reverse();
		
        if (report.length > 0)
            report.forEach((element) => {
                let date = element.TranDateTimeString.split(" ");
                let date2 = current_date.split(" ");
                if (date[0] == date2[0])
                    currentBalance = element.CurrentBalance + customer.CasinoBalance
            });

        let tranCode = customer.CasinoBalance > 0 ? "C" : "D";
        report.push({ "Amount": customer.CasinoBalance, "TranDateTimeString": current_date, "TranType": "X", "ShortDesc": "NP Balance", "TranCode": tranCode, "CurrentBalance": currentBalance });
        return report;
    };

  $scope.getSessionData = function (id) {
    try {
      return JSON.parse(window.localStorage.getItem(id));
    } catch (e) {
      return null;
    }
  };

  $scope.ChangeLanguage = function (lang) {
    $scope.selectedLanguage = lang;
    $scope.addSessionData('language', lang);
    $translatorService.ChangeLanguage(lang);
  }

  $scope.removeItem = function (id) {
    window.localStorage.removeItem(id);
  };

  $scope.addSessionData = function (id, item) {
    window.localStorage.setItem(id, JSON.stringify(item));
  };

	$scope.gridMode = $scope.getSessionData("grid-mode") ? { isGrid: $scope.getSessionData("grid-mode") == '1' } : (typeof SETTINGS.GridMode === "undefined" ? { isGrid: false } : { isGrid: SETTINGS.GridMode });
  $scope.viewportMode = $scope.getSessionData("view-mode") ? { isDesktop: $scope.getSessionData("view-mode") == 'desktop' } : (typeof SETTINGS.DesktopMode === "undefined" ? { isDesktop: false } : { isDesktop: SETTINGS.DesktopMode });

	if ($scope.gridMode.isGrid) {
		togglelList = ["Favorites", "Customer", "Wagers", "Transactions"];
	}

  $scope.dfSetting = $scope.getSessionData('dfSettigs') || $scope.dfSetting;

  $scope.safeDfSetting = function () {
    $scope.addSessionData('dfSettigs', $scope.dfSetting);
    $scope.fireSwal($scope.Translate('Setting Saved'));
  }


	$scope.toggleGridMode = function () {
		if ($scope.gridMode.isGrid) {
      getHeaderInfo();
			$scope.addSessionData("grid-mode", '1');
		} else {
			$scope.addSessionData("grid-mode", '0');
		}
	}

  $scope.toggleStyleMode = function () {
    jQuery('#smallModalDialog').modal('hide');
    if ($scope.styleMode.isDark) {
      $scope.addSessionData("style-mode", '1');
      document.getElementById("pagestyle").setAttribute("href", 'assets/css/style.css');
    } else {
      $scope.addSessionData("style-mode", '0');
      document.getElementById("pagestyle").setAttribute("href", 'assets/css/style-light.css');
    }
  }

	$scope.toggleViewportMode = function () {
		if ($scope.viewportMode.isDesktop) {
			$scope.addSessionData("view-mode", 'desktop');
      document.body.scrollIntoView(({ behavior: "smooth", block: "start", inline: "start" }));
		} else {
			$scope.addSessionData("view-mode", 'normal');
		}
		alterViewport();
    $rootScope.$broadcast('gridModeToggled');
	}

  function alterViewport() {
    var viewMode = $scope.getSessionData("view-mode") ? $scope.getSessionData("view-mode") : SETTINGS.GridMode ? SETTINGS.GridMode : 'normal';
    const viewportElement = document.querySelector('meta[name="viewport"]');
    if(!viewportElement) return;
    if (viewMode == "desktop") {
      viewportElement.setAttribute('content', 'width=1350, initial-scale=.5, maximum-scale=12.0, minimum-scale=.25, user-scalable=yes');
    } else if (viewMode == "normal") {
      viewportElement.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes');
    }
  }
  
  alterViewport();

  var getHeaderInfo = function (weekNum = 0, currentAgent = null) {
    currentAgent = currentAgent || $scope.AgentInfo;
    const params = {
      weekNumber: weekNum,
      week: weekNum - 1,
      agentId: currentAgent.AgentID,
      affiliateMode: 0
    };
    $agentService.GetAgentsDailyFiguresSummary(params).then(function (result) {
      var winLoss = result.data.d.Data;
      $scope.dashboardWeek = [];
      $scope.dashboardWeek = [
        { period: $scope.Translate('Monday'), winLoss: 0, casinoNet: 0 },
        { period: $scope.Translate('Tuesday'), winLoss: 0, casinoNet: 0 },
        { period: $scope.Translate('Wednesday'), winLoss: 0, casinoNet: 0 },
        { period: $scope.Translate('Thursday'), winLoss: 0, casinoNet: 0 },
        { period: $scope.Translate('Friday'), winLoss: 0, casinoNet: 0 },
        { period: $scope.Translate('Saturday'), winLoss: 0, casinoNet: 0 },
        { period: $scope.Translate('Sunday'), winLoss: 0, casinoNet: 0 }
      ];
      $scope.summaryStart = moment(winLoss[0].StartingDateString).format('MMMM Do');
      $scope.summaryEnd = moment(winLoss[0].EndingDateString).format('MMMM Do');
      for (var i = 0; i < 7; i++) {
        $scope.dashboardWeek[i].winLoss = $agentService.GetDayFigure(winLoss[0], (i + 1) < 7 ? i + 1 : 0, false);
        $scope.dashboardWeek[i].casinoNet = $agentService.GetCasinoFigure(winLoss[0], (i + 1) < 7 ? i + 1 : 0);
      }
      $scope.Summary = {
        DistributionAmount: 0
      }
      $agentService.GetAgentDistribution(params).then(function (response) {
        const groupedData = response.data.d.Data;
        $scope.distributionInfo = groupedData.find(x => x.AgentID.trim() == currentAgent.AgentID.trim()) || { PrevMakeup: currentAgent.CurrentMakeup };
        $scope.Summary.DistributionAmount = $scope.distributionInfo ? $scope.distributionInfo.DistributionAmount : 0;
        $agentService.GetCustDailyFigureByAgentDashboard(weekNum, currentAgent.AgentID).then(function (result) {
          var df = result.data.d.Data || {};
          $scope.AccountsClosed = df.AccountsClosed || 0;
          $scope.ThisWeekTotal = df.NetAmount || 0;
          $scope.DeletedWagers = df.DeletedWagers || 0;
          $scope.VolumeAmount = df.VolumeTotal || 0;
          $scope.PendingAmount = (df.PendingTotal / 100) || 0;
          $scope.TotalPlayers = df.HeadCount || 0;
          $scope.Signups = df.Signups || 0;
          $scope.DepositingPlayers = df.DepositingPlayers || 0;
          const preCommission = df.NetAmount < 0 ? ((df.NetAmount * -1) - ($scope.distributionInfo.PrevMakeup / 100)) : 0;
          $scope.ExpectedCommission = df.NetAmount < 0 ? (((preCommission < 0 ? 0 : preCommission) * currentAgent.CommissionPercent) / 100) : 0;
          $rootScope.safeApply();
        });
      });
		});
  }

  $scope.getHeaderInfo = getHeaderInfo;

  $scope.getAgentWinLossByWeek = function (weekNum = 0) {
		$agentService.GetWinLossByWeek(weekNum).then(function (result) {
			var winLoss = result.data.d.Data;
			var week = [];
			if (winLoss == null || winLoss.length == 0) {
				week = [
					{ period: $scope.Translate('Monday'), winLoss: 0, casinoNet: 0 },
					{ period: $scope.Translate('Tuesday'), winLoss: 0, casinoNet: 0 },
					{ period: $scope.Translate('Wednesday'), winLoss: 0, casinoNet: 0 },
					{ period: $scope.Translate('Thursday'), winLoss: 0, casinoNet: 0 },
					{ period: $scope.Translate('Friday'), winLoss: 0, casinoNet: 0 },
					{ period: $scope.Translate('Saturday'), winLoss: 0, casinoNet: 0 },
					{ period: $scope.Translate('Sunday'), winLoss: 0, casinoNet: 0 }
				];
			} else {
				week = [
          { period: CommonFunctions.FormatDateTime(winLoss[0].DailyFigureDateString, 4), winLoss: 0, casinoNet: 0 },
          { period: winLoss.length > 1 ? CommonFunctions.FormatDateTime(winLoss[1].DailyFigureDateString, 4) : $scope.Translate('Tuesday'), winLoss: 0, casinoNet: 0 },
          { period: winLoss.length > 2 ? CommonFunctions.FormatDateTime(winLoss[2].DailyFigureDateString, 4) : $scope.Translate('Wednesday'), winLoss: 0, casinoNet: 0 },
          { period: winLoss.length > 3 ? CommonFunctions.FormatDateTime(winLoss[3].DailyFigureDateString, 4) : $scope.Translate('Thursday'), winLoss: 0, casinoNet: 0 },
          { period: winLoss.length > 4 ? CommonFunctions.FormatDateTime(winLoss[4].DailyFigureDateString, 4) : $scope.Translate('Friday'), winLoss: 0, casinoNet: 0 },
          { period: winLoss.length > 5 ? CommonFunctions.FormatDateTime(winLoss[5].DailyFigureDateString, 4) : $scope.Translate('Saturday'), winLoss: 0, casinoNet: 0 },
          { period: winLoss.length > 6 ? CommonFunctions.FormatDateTime(winLoss[6].DailyFigureDateString, 4) : $scope.Translate('Sunday'), winLoss: 0, casinoNet: 0 }
				];
				for (var i = 0; i < winLoss.length; i++) {
					week[i].winLoss = CommonFunctions.RoundNumber(winLoss[i].AmountWon + winLoss[i].CreditAdjustmentAmount - winLoss[i].AmountLost - winLoss[i].DebitAdjustmentAmount);
					week[i].casinoNet = CommonFunctions.RoundNumber(winLoss[i].CasinoAmountWon - winLoss[i].CasinoAmountLost);
				}
			}
			if (morrisObj != null) {
				morrisObj.destroy();
			}
			morrisObj = NaN;
			morrisObj = new Morris.Bar({
				element: 'morris-bar-chart',
				resize: true,
				data: week,
				parseTime: false,
				barGap: 0.5,
				xkey: 'period',
				ykeys: ['winLoss', 'casinoNet'],
				labels: [$scope.Translate('Win Loss'), $scope.Translate('Casino Net')],
				barColors: ['#337ab7', '#99D199']
			});

		});
  };

	$scope.Init = function () {

    $agentService.SyncWithServerDateTime().then();

		$agentService.GetAgent().then(function () {
			$scope.AgentInfo = $agentService.AgentInfo;
      SETTINGS.chatEnabled = $agentService.AgentInfo.LiveChatEnabled == 1;
      if (typeof SETTINGS.CustomChat === "function" && SETTINGS.chatEnabled == '1') SETTINGS.CustomChat();
      else if(typeof startChat === "function" && SETTINGS.chatEnabled == '1') startChat();
			CommonFunctions.showCents = !$scope.AgentInfo.RoundDecimalsFlag || $scope.AgentInfo.RoundDecimalsFlag == 'N';
			showCommentsForCustomer();
			$scope.ImpersonatedList = $scope.getSessionData('impersonatedList') ? $scope.getSessionData('impersonatedList') : [];
    $agentService.GetAgentAsCustomer().then(function () {
      $scope.AgentAsCustomerInfo = $agentService.AgentAsCustomerInfo;
      $webSocketService.SubscribeCustomer($scope.AgentAsCustomerInfo.CustomerID.trim(), $scope.AgentAsCustomerInfo.Store.trim());
			//$scope.ReloadCustomersList();
      if ($scope.AgentAsCustomerInfo.AgentType == 'M') {
        $agentService.GetAgentHierarchy().then(function (result) {
          $scope.AllAgentsList = $scope.bindAgentHierarchy(result.data.d.Data);
            $scope.AllActiveAgentsList = $scope.AllAgentsList.filter(x => x.Active == 'Y');
					$scope.rawAgentsList = result.data.d.Data;
            $rootScope.selectedAgent = $scope.AllAgentsList ? $scope.AllAgentsList[0] : { ...$scope.AgentInfo, AgentId: $scope.AgentInfo.AgentID };
            $agentService.GetCurrencies().then(function (response) {
              $scope.Currencies = response.data.d.Data;
          $rootScope.$broadcast('AgentAsCustomerInfoReady');
            });
            if ($scope.gridMode.isGrid) getHeaderInfo();
        });
      } else {
					$scope.AllAgentsList.push({ ...$agentService.AgentInfo, AgentId: $agentService.AgentAsCustomerInfo.CustomerID.trim(), AgentBind: $agentService.AgentAsCustomerInfo.CustomerID.trim(), TimeZone: $agentService.AgentAsCustomerInfo.TimeZone });
        $rootScope.selectedAgent = $scope.AllAgentsList[0];
          $agentService.GetCurrencies().then(function (response) {
            $scope.Currencies = response.data.d.Data;
        $rootScope.$broadcast('AgentAsCustomerInfoReady');
          });
          if ($scope.gridMode.isGrid) getHeaderInfo();
      }
      $translatorService.GetLanguages().then(function (result) {
        $scope.langList = result.data.Files;
        const lang = $scope.getSessionData('language') ? $scope.getSessionData('language') : $agentService.Settings.WebLanguage;
          let index = $scope.langList.findIndex(x => x.Code == lang);
        if (index < 0) index = 0;
        if (!$scope.langList || !$scope.langList.length || index >= $scope.langList.length) return;
        $scope.selectedLanguage = $scope.langList[index].Name;
        $scope.ChangeLanguage(lang);
      });

        });
    });
  };

  $scope.getAgentPlayers = function(agentId){  
    return $agentService.GetAgentPlayersHierarchy(agentId).then(function (result) {
		$scope.rawAgentsList = $scope.rawAgentsList || [];
      $scope.agentPlayers = [...result.data.d.Data.filter(x => !x.AgentType).map(x => { return { id: x.CustomerID, label: x.CustomerID, type: 'p', password: x.Password } })];      
	});
  }

  $scope.GetAgentHierarchy = function () {
    $agentService.GetAgentHierarchy().then(function (result) {
      $scope.AllAgentsList = $scope.bindAgentHierarchy(result.data.d.Data);
      $scope.rawAgentsList = result.data.d.Data;
      $rootScope.safeApply();
    })
  }

	$scope.ImpersonateAgent = function (impAgent) {
		$scope.ImpersonatedList.push(impAgent);
		$agentService.ImpersonateLogin(impAgent).then(function (result) {
			if (result.data.d.Code == 0) {
				$scope.addSessionData('impersonatedList', $scope.ImpersonatedList);
				location.reload();
			}
		})
	};

	$scope.PreviousImpersonateAgent = function () {
		$agentService.PreviousLogin().then(function (result) {
			if (result.data.d.Code == 0) {
				$scope.ImpersonatedList.pop();
				$scope.addSessionData('impersonatedList', $scope.ImpersonatedList);
				location.reload();
			}
		})
  };

	$scope.getAgentParent = function (agentId) {
		let parentAgent = $scope.rawAgentsList.find(x => x.AgentId.trim().toUpperCase() == agentId.trim().toUpperCase());
		parentAgent = parentAgent ? $scope.rawAgentsList.find(x => x.AgentId.trim().toUpperCase() == agentId.trim().toUpperCase()).MasterAgentId : '';
		if ((typeof parentAgent === "undefined") || agentId.trim().toUpperCase() == $scope.AgentAsCustomerInfo.CustomerID.trim().toUpperCase()) return '';
		let result = $scope.getAgentParent(parentAgent);
		return `${result == '' ? result : result + ' /'} ${$scope.formatCustomer(parentAgent)}`;
	}

	$scope.formatCustomer = function (custId) {
    custId = custId.trim();
    custId = $scope.AgentAsCustomerInfo.IsAffiliate ? '***' + custId.substring(custId.length - 4, custId.length) : custId;
			if (!SETTINGS.CustomerIdSufix || SETTINGS.CustomerIdSufix == '') return custId;
			if (!custId) return '';
			let result = custId.substring(0, custId.indexOf(SETTINGS.CustomerIdSufix));
			return result ? custId.substring(0, custId.indexOf(SETTINGS.CustomerIdSufix)) : custId;
	}


	$scope.bindAgentHierarchy = function (agentList) {
		if (!agentList) return;
		for (let idx = agentList.length - 1; idx >= 0; idx--) {
			const agent = agentList[idx];
			if (agent.processed == true) continue;
      agent.AgentBind = agent.AgentBind || '';
      let masterAgentIdx = agentList.findIndex(x => x.AgentId == agent.MasterAgentId);
			for (let i = 0; i < agent.HierarchyLevel; i++) {
				agent.AgentBind += ' - ';
			}
      if (masterAgentIdx >= 0) {
        agentList.splice(idx, 1);
        agentList.splice(masterAgentIdx + 1, 0, agent);
				idx = agentList.length;
      }
      agent.AgentBind += agent.AgentId;
      agent.processed = true;
		};
    return agentList;
  }


    $scope.ReloadCustomersList = function () {
        $agentService.GetCustomersList(0).then(function () {
            $scope.AgentsList = $agentService.AgentsList;
            $scope.GetUngroupedCustomers();
        });
    }

	jQuery(document).ready(function () {
		var onSizeChanges = [{
			element: "lineDiv",
			type: "id", //id / class
			threshold: 991.98,
			lowerClass: "page-content-wrapper-mob",
			upperClass: "page-content-wrapper"
		}];

		var xDown = null;
		var yDown = null;

		function handleTouchStart(evt) {
      if (!$rootScope.IsMobile || $scope.gridMode.isGrid) return;
			xDown = evt.touches[0].clientX;
			yDown = evt.touches[0].clientY;
		};

		function handleTouchMove(evt) {
      if ($scope.IsActive('CustomerCounter') || $scope.IsActive('Maintenance') || $scope.IsActive('CustomerMapActivity') || $scope.gridMode.isGrid || ($scope.IsActive('Daily') && $rootScope.viewMode == 1)) return;
			var hasSwipe = (evt.target.offsetParent.className.toString().indexOf("tablesaw-swipe") >= 0
				|| evt.target.offsetParent.offsetParent.className.toString().indexOf("tablesaw-swipe") >= 0) && !jQuery("#wrapper").hasClass("toggled");
			if (!xDown || !yDown || !$rootScope.IsMobile || hasSwipe) {
				return;
			}
			var xUp = evt.touches[0].clientX;
			var yUp = evt.touches[0].clientY;

			var xDiff = xDown - xUp;
			var yDiff = yDown - yUp;

			if (Math.abs(xDiff) > Math.abs(yDiff)) {/*most significant*/
				if (xDiff > 0) {
					if (jQuery("#wrapper").hasClass("toggled")) $scope.ToggleMenu();
				} else {
					if (!jQuery("#wrapper").hasClass("toggled")) $scope.ToggleMenu();
				}
			}
			/* reset values */
			xDown = null;
			yDown = null;
		};

		function setTouchActions() {
			document.addEventListener('touchstart', handleTouchStart, false);
			document.addEventListener('touchmove', handleTouchMove, false);
		}

		function onSizeChange() {
			var w = jQuery(window).width();
      if (w > 1024) {
				$rootScope.IsMobile = false;
			} else {
        $rootScope.IsMobile = true;
			}
			$rootScope.safeApply();
		}

		jQuery(window).resize(onSizeChange);
		onSizeChange();
		setTouchActions();
	});

  $scope.ToggleMenu = function () {
    jQuery("#wrapper").toggleClass("toggled");
  };

  $scope.Translate = function (text) {
    CommonFunctions.TranslateFn = $translatorService.Translate;
    return $translatorService.Translate(text);
  };

  $scope.GetUngroupedCustomers = function () {
    if (!$scope.AgentsList || $scope.AgentsList.length === 0) return;
    var customers = [];
    for (var i = 0; i < $scope.AgentsList.length; i++) {
      for (var j = 0; j < $scope.AgentsList[i].CustomersList.length; j++)
        customers.push($scope.AgentsList[i].CustomersList[j]);
    }
    $scope.ActionCustomers = customers;
      $rootScope.$broadcast('ActionCustomersReady')
  };

  $scope.GetAgentRestriction = function (code) {
    if (!$agentService.Restrictions) return null;
    for (var i = 0; $agentService.Restrictions.length > i; i++) {
      if ($agentService.Restrictions[i].Code === code) return $agentService.Restrictions[i];
    }
    return null;
  };

  $scope.GroupDailyFiguresByAgent = function (rawData) {
    var returnedData = [];
    var holdAgentId = null;
    if (rawData) {
      for (var i = 0; i < rawData.length; i++) {
        if (holdAgentId !== rawData[i].AgentId) {
          var CustomersData = new Array();
          var AgentData = { AgentId: rawData[i].AgentId, StartingDate: rawData[i].StartingDate, EndingDate: rawData[i].EndingDate };
          CustomersData.push(rawData[i]);
          AgentData.CustomerDailyFigures = CustomersData;
          returnedData.push(AgentData);
        }
        else {
          returnedData[returnedData.length - 1].CustomerDailyFigures.push(rawData[i]);
        }
        holdAgentId = rawData[i].AgentId;
      }
    }
    return returnedData;
  };

  $scope.$on("$routeChangeSuccess", function (event, current, previous) {
    $scope.LeftMenuVisible = current.$$route && current.$$route.templateUrl && current.$$route.templateUrl.indexOf('livetickerView.html') < 0;
  });

  $scope.FormatDateTime = function (d, format, timeZone, showFourDigitsYear) {
    if (format == 6 && $rootScope.IsMobile) format = 16;
    const result = CommonFunctions.FormatDateTime(d, format, timeZone, showFourDigitsYear)
    return result ? result : '';
  };

  $scope.FormatMyNumber = function (num, divideByHundred, applyFloor) {
    return CommonFunctions.FormatNumber(num, divideByHundred, applyFloor);
  };

  $scope.DisplayDate = function (strDate) {
    if (strDate == null)
      return "";
    var date = new Date(parseInt(strDate.substr(6)));

		return $scope.FirstLetterUpperCase($scope.FormatDateTime(date, 6, 3, true).toString());
  };

  $scope.FirstLetterUpperCase = function (str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  $scope.DisplayTimeFromDate = function (strDate) {
		return $scope.FormatDateTime(strDate, 8, 3, true) + $scope.FormatDateTime(strDate, 14, 0, true);
  };

  $scope.DisplayMyNumber = function (num) {
    return $scope.FormatMyNumber(num, false, false);
  };

  $scope.Logout = function () {
        $scope.removeItem('impersonatedList');
    $agentService.KillTheSession();
  };

  $scope.SaveLearnedText = function () {
    $translatorService.SaveLearnedTexts();
  }

  $scope.ShowCustomerDialog = function (customerObj, option, customer) {
		if ($scope.AgentAsCustomerInfo.IsAffiliate) return;
    if (option === 3 && $rootScope.IsMobile) {
      window.location.href = '#/openbets?customerID=' + customer;
      return;
    }
    $scope.LookupCustomer = customerObj;
    option = option == 8 ? $scope.AgentInfo.EnableEditAccountsFlag == 'Y' ? 8 : 1 : option;
    $scope.CustomerOption = option;
    document.location.href = "#/customer";
    return;
		$scope.DialogTemplate = appModule.Root + "/app/components/customer/customerView.html?v=3";
    document.getElementById("page-content-wrapper").classList.add('no-printable');
    jQuery.noConflict();
    (function ($) {
      $('#modalDialog').modal({
        backdrop: 'static',
        keyboard: false
      }).removeData("modal").modal({ backdrop: 'static', keyboard: false });
    })(jQuery);
  };

	$scope.ShowAgentDialog = function (agentObj, option) {
		$scope.LookupAgent = agentObj;
		$scope.CustomerOption = option;
		$scope.DialogTemplate = appModule.Root + "/app/components/agent/agentView.html?v=3";
		document.getElementById("page-content-wrapper").classList.add('no-printable');
		jQuery.noConflict();
		(function ($) {
			$('#modalDialog').modal({
				backdrop: 'static',
				keyboard: false
			}).removeData("modal").modal({ backdrop: 'static', keyboard: false });
		})(jQuery);
	};

    $scope.ShowAddCustomerDialog = function () {
        if (!$scope.AgentAsCustomerInfo) return;
		$scope.DialogTemplate = appModule.Root + "/app/components/customer/batchCustomer.html?v=2";
        document.getElementById("page-content-wrapper").classList.add('no-printable');
        jQuery.noConflict();
        (function ($) {
            $('#modalDialog').modal({
                backdrop: 'static',
                keyboard: false
            }).removeData("modal").modal({ backdrop: 'static', keyboard: false });
        })(jQuery);
    };

  $scope.ShowCustomerImpersonateDialog = function () {
    if (!$scope.AgentAsCustomerInfo) return;
    $scope.DialogTemplate = appModule.Root + "/app/components/customer/impersonateCustomeriFrame.html";
    document.getElementById("page-content-wrapper").classList.add('no-printable');
    jQuery.noConflict();
    (function ($) {
      $('#modalDialog').modal({
        backdrop: 'static',
        keyboard: false
      }).removeData("modal").modal({ backdrop: 'static', keyboard: false });
    })(jQuery);
  };

	$scope.ShowSettingsDialog = function () {
    $scope.DialogTemplateSmall = appModule.Root + "/app/components/settings/settings.html?v=3";
    document.getElementById("page-content-wrapper").classList.add('no-printable');
    jQuery.noConflict();
    (function ($) {
      $('#smallModalDialog').modal({
        backdrop: 'static',
        keyboard: false
      }).removeData("modal").modal({ backdrop: 'static', keyboard: false });
    })(jQuery);
  };

  $scope.ShowSmallDialog = function (url) {
    $scope.DialogTemplateSmall = appModule.Root + url;
		document.getElementById("page-content-wrapper").classList.add('no-printable');
		jQuery.noConflict();
		(function ($) {
			$('#smallModalDialog').modal({
				backdrop: 'static',
				keyboard: false
			}).removeData("modal").modal({ backdrop: 'static', keyboard: false });
		})(jQuery);
	};

  $scope.CloseDialog = function () {
    (function ($) {
      $('#modalDialog').modal('hide');
      $scope.DialogTemplate = "";
      document.getElementById("page-content-wrapper").classList.remove('no-printable');
    })(jQuery);
  };

  $scope.GetChosenTeamId = function (wi, toUpper) {
    var chosenTeam = "";
    if (!wi || !wi.ItemWagerType) return '';
    switch (wi.ItemWagerType) {
      case "S":
      case "M":
      case "E":
        if (wi.ChosenTeamID === wi.Team1ID) {
          chosenTeam = wi.Team1RotNum + " " + wi.ChosenTeamID;
        } else {
          chosenTeam = wi.Team2RotNum + " " + wi.ChosenTeamID;
        }
        break;
      case "L":
      case "C":
        chosenTeam = wi.ChosenTeamID;
        break;
    }
    if (toUpper)
      return chosenTeam.toUpperCase();
    else
      return chosenTeam;
  };

  $scope.GetWagerDescription = function (wi, index) {
    if (!wi) return "";
    var itemDescription = wi.Description;
    if (!isNaN(index)) {
      var descArray = itemDescription.split('\r\n');
      if (descArray.length >= index) itemDescription = descArray[index];
    }
    var chosenTeam = $scope.GetChosenTeamId(wi, false);
    var chosenSport = (wi.SportType).trim();
    var ds = itemDescription.replace(chosenTeam, "").replace(chosenSport, "").replace("-", "").trim();
    return itemDescription.replace(chosenTeam, "").replace(chosenSport, "").replace("-", "").trim();
  };

  $scope.OpenLiveLines = function () {
    var form = document.createElement("form");
    var element1 = document.createElement("input");
    var element2 = document.createElement("input");
    var element3 = document.createElement("input");
    form.method = "POST";
    form.action = SETTINGS.MainSite;

    element1.value = $scope.AgentAsCustomerInfo.CustomerID.trim();
    element1.name = "agentID";
    element1.type = "hidden";
    form.appendChild(element1);

    element2.value = "DEMO";
    element2.name = "customerID";
    element2.type = "hidden";
    form.appendChild(element2);

    element3.value = "";
    element3.name = "password";
    element3.type = "hidden";
    form.appendChild(element3);

    document.body.appendChild(form);

    form.setAttribute("target", "_blank");
    form.submit();

  };

  $scope.IsActive = function (menu) {
    if (!$route.current) return false;
    switch (menu) {
      case 'Dashboard':
        return 'dashboardController' === $route.current.controller;
      case 'Maintenance':
        return 'customersController' === $route.current.controller;
      case 'Performance':
        return '/performance' === $route.current.originalPath;
      case 'SportPerformance':
                return '/sportPerformance' === $route.current.originalPath;
      case 'Daily':
        return 'dailyFiguresController' === $route.current.controller && !$route.current.params.ShowSettleFigure;
      case 'Settle':
        return 'dailyFiguresController' === $route.current.controller && $route.current.params.ShowSettleFigure;
      case 'Open':
        return 'openbetsController' === $route.current.controller;
      case 'Game':
        return 'agentpositionController' === $route.current.controller;
			case 'Exposure':
				return 'agentExposureController' === $route.current.controller;
      case 'ContestExposure':
        return 'contestExposureController' === $route.current.controller;
      case 'WeeklyBiling':
        return 'weeklyBillingController' === $route.current.controller && !$route.current.params.SummaryOnly;
      case 'Limits':
        return 'sportsLimitsController' === $route.current.controller;
      case 'AllTransactions':
        return 'alltransactionsController' === $route.current.controller;
      case 'Wagers':
        return '/performance' === $route.current.originalPath ||
          '/sportPerformance' === $route.current.originalPath  ||
            'agentpositionController' === $route.current.controller ||
					'agentExposureController' === $route.current.controller ||
          'contestExposureController' === $route.current.controller ||
            'openbetsController' === $route.current.controller ||
                    'scoresController' === $route.current.controller ||
					'customerPerformanceController' === $route.current.controller ||
          'customersPerformanceController' === $route.current.controller ||
					'deletedWagersController' === $route.current.controller ||
					'dailyFiguresController' === $route.current.controller && !$route.current.params.ShowSettleFigure ||
          'holdPercentageController' === $route.current.controller ||
          'customerCounterController' === $route.current.controller ||
          'gradedWagersController' === $route.current.controller ||
          'customersTotalsController' === $route.current.controller ||
          'performanceCustomerController' === $route.current.controller ||
          'posibleBotsController' === $route.current.controller;
        
      case 'Transactions':
				return 'alltransactionsController' === $route.current.controller || 'insertTransactionController' === $route.current.controller ||
          'masterSheetController' === $route.current.controller || 'distributionController' === $route.current.controller || 'sysIntegrationController' === $route.current.controller ||
          'weeklyBillingController' === $route.current.controller || 'transactionsHistoryController' === $route.current.controller || 'freePlayTransactionsController' === $route.current.controller && !$route.current.params.SummaryOnly;
      case 'Customer':
        return 'customersController' === $route.current.controller ||
          'sportsLimitsController' === $route.current.controller || 'webAccessController' === $route.current.controller ||
          'agentAccessController' === $route.current.controller || 'customerAnalyticsController' === $route.current.controller || 'beatTheLineController' === $route.current.controller || 'noActivityPlayerController' === $route.current.controller
          || 'customerMessagesController' === $route.current.controller;
      case 'LManager':
        return 'linesManagerController' === $route.current.controller;
      case 'WebAccess':
        return 'webAccessController' === $route.current.controller;
      case 'Analytics':
        return 'customerAnalyticsController' === $route.current.controller;
      case 'AgentAccess':
        return 'agentAccessController' === $route.current.controller;
            case 'Scores':
                return 'scoresController' === $route.current.controller;
			case 'CustomerPerformance':
				return 'customerPerformanceController' === $route.current.controller;
      case 'CustomersPerformance':
        return 'customersPerformanceController' === $route.current.controller;
      case 'CustomerMessages':
        return 'customerMessagesController' === $route.current.controller;
			case 'HoldPercentage':
				return 'holdPercentageController' === $route.current.controller;
			case 'MasterSheet':
				return 'masterSheetController' === $route.current.controller;
			case 'InsertTransactions':
				return 'insertTransactionController' === $route.current.controller;
			case 'CustomerCounter':
				return 'customerCounterController' === $route.current.controller;
			case 'DeletedWagers':
				return 'deletedWagersController' === $route.current.controller;
			case 'Distribution':
				return 'distributionController' === $route.current.controller;
      case 'Cashier':
        return 'sysIntegrationController' === $route.current.controller;
      case 'LiveBetTicker':
        return 'livetickerController' === $route.current.controller;
      case 'GradedWagers':
        return 'gradedWagersController' === $route.current.controller;
      case 'CustomerIPGlobalCompare':
        return 'customerIPGlobalCompareController' === $route.current.controller;
      case 'CustomerMapActivity':
        return 'customerMapController' === $route.current.controller;
      case 'Agent':
        return 'agentController' === $route.current.controller;
      case 'TicketWriter':
        return 'ticketWriterController' === $route.current.controller;
      case 'VigLimits':
        return 'vigLimitsController' === $route.current.controller;
      case 'TransactionsHistory':
        return 'transactionsHistoryController' === $route.current.controller;
      case 'BeatTheLine':
        return 'beatTheLineController' === $route.current.controller;
      case 'FreePlayTransactions':
        return 'freePlayTransactionsController' === $route.current.controller;
      case 'NoActivityPlayer':
        return 'noActivityPlayerController' === $route.current.controller;
      case 'CustomersTotals':
        return 'customersTotalsController' === $route.current.controller;
      case 'PerformanceCustomer':
        return 'performanceCustomerController' === $route.current.controller;
      case 'TrackierLogin':
        return 'sysIntegrationController' === $route.current.controller;
      case 'CampaignManager':
        return 'campaignManagerController' === $route.current.controller;
      case 'PosibleBots':
        return 'posibleBotsController' === $route.current.controller;

    }
    return false;
  };

  $scope.ToggleSideMenu = function (option) {
    let element = togglelList.findIndex(x => x == option);
    if (element >= 0)
      togglelList.splice(element, 1);
    else
      togglelList.push(option);
  };

  $scope.IsToggled = function (option) {
    return togglelList.some(x => x == option);
  };

  $scope.SwitchToClassic = function () {
    var customerId = $scope.AgentInfo.AgentID.trim();
    var customerPwd = $scope.AgentInfo.Password;
    $agentService.LogWritter("Agent " + customerId + " switched to classic", "switch site");
    $agentService.KillTheSession().then(function () {
      $('#customerID1').val(customerId);
      $('#password1').val(customerPwd);
      document.forms["loginform"].submit();
    });
  };

  $scope.OpenLiveTicker = function () {
    var form = document.createElement("form");
    var element1 = document.createElement("input");
    var element2 = document.createElement("input");
    form.setAttribute("target", "_blank");
    form.method = "POST";
    form.action = "#/liveticker";

    element1.value = $scope.AgentInfo.AgentID.trim();
    element1.name = "customerID1";
    element1.type = "hidden";
    form.appendChild(element1);

    element2.value = $scope.AgentInfo.Password;
    element2.name = "password1";
    element2.type = "hidden";
    form.appendChild(element2);

    document.body.appendChild(form);

    form.submit();

  };

  $scope.CloseMenu = function () {
    if ($rootScope.IsMobile) {
      jQuery("#wrapper").removeClass("toggled");
    }
  };

	$scope.customerTitle = function (oB) {
    if (!$scope.AgentAsCustomerInfo || !oB || (!oB.CustomerID && !oB.CustomerId)) return;
    oB.CustomerID = oB.CustomerID ? oB.CustomerID : oB.CustomerId;
	oB.Password = oB.Password || (oB.Items && oB.Items.length > 0 ? oB.Items[0].Password : '');
		return `${$scope.AgentAsCustomerInfo.IsAffiliate ?
			'***' + oB.CustomerID.trim().substring(oB.CustomerID.trim().length - 4, oB.CustomerID.trim().length) : oB.CustomerID.trim()}
			${$scope.AgentAsCustomerInfo.IsAffiliate ? '' : ' / ' + oB.Password} ${oB.FullName && oB.FullName.trim() != '' ? `${$scope.AgentAsCustomerInfo.IsAffiliate ? '' : '(' + oB.FullName + ')'}` : ''}`;
	}

	$scope.FormatDateTime = function (date, format) {
		return CommonFunctions.FormatDateTime(date, format);
	}

	$scope.transactionIsThisWeek = function (t) {
    if (t.TranType == "Z" || t.TranType == "Q") return false;
    if (t.EnteredBy == 'Main' || t.EnteredBy == 'Mobile') return false;
		let dateRangeArray = $agentService.GetFullWeeksRange()[0].DateRange.split(' to ');
		let startDate = dateRangeArray.length > 0 ? new Date(dateRangeArray[0]) : null;
		let endDate = dateRangeArray.length > 0 ? new Date(dateRangeArray[1]) : null;
		let oBDate = new Date(new Date(t.TranDateTimeString).toDateString());
		return startDate.getTime() <= oBDate.getTime() && endDate.getTime() >= oBDate.getTime();
	}

	$scope.OpenAgentManager = function (agentId, tab = '1') {
		if (!agentId || $scope.AgentAsCustomerInfo.IsAffiliate == true) return;
		let params = { agentId: agentId }
		$agentService.GetCustomerAsAgentInfo(params).then(function (response) {
			$scope.ShowAgentDialog(response.data.d.Data[0], tab == 2 && $scope.AgentInfo.EnterTransactionFlag == 'Y' ? tab : '1');
		});
  }

  $scope.isXTransaction = false;
  $scope.WagerType = function (t) {
    if (t.TranType == 'Q')
      return "Agent Distribution";
    if (t.TranType == 'C')
      return "Credit Adjustment";
    if (t.TranType == 'D')
      return "Debit Adjustment";
    return $agentService.DisplayWagerTypeName(t);
    //return LineOffering.WagerTypes.GetByCode(t.WagerType, t.TeaserName, t.ContinueOnPushFlag);
  };

  $scope.showLoadingGif = function (elementId) {
    let loadingGif = document.getElementById(elementId);
    if (!loadingGif) return;
    loadingGif.style.zIndex = 4;
    loadingGif.style.display = 'flex';
  }

  $scope.hideLoadingGif = function (elementId) {
    let loadingGif = document.getElementById(elementId);
    if (!loadingGif) return;
    loadingGif.classList.add('vanish');
    setTimeout(function () {
      loadingGif.style.zIndex = -1;
      loadingGif.style.display = 'none';
      loadingGif.classList.remove('vanish');
    }, 1001)
  }

  $scope.quickSearch = null;


  $scope.getSubDescription = function (transaction, index = 0) {
    if (!transaction.IsTransaction) return transaction.ShortDesc;
    const desc = transaction.ShortDesc.split(' - ');
    if (desc.length == 0) return desc.ShortDesc;
    else if (desc.length == 1) return desc[0];
    return desc[index];
  }

  var Scheduling = setTimeout(function tick() {
    $agentService.TrackStatus().then();
    Scheduling = setTimeout(tick, SETTINGS.TrackTime);
  }, SETTINGS.TrackTime);

  $scope.Init();

  $scope.onDragStart = function (element) {
    const id = element.currentTarget.id;
    $rootScope.bubbleDrag = { url: id.split('&')[1], iconClass: id.split('&')[0] };
  }

  $scope.topDrop = function (element) {
    const id = element.target.id;
    if (!$scope.topElementsList.some(x => x.url == $rootScope.bubbleDrag.url)) {
      $scope.topElementsList.splice(id, 1, { ...$rootScope.bubbleDrag });
      $scope.addSessionData('top-list', $scope.topElementsList);
    }

  }

  $scope.$watch('quickSearch', function (newVal, oldVal) {
    if (!newVal || newVal == "") {
      $scope.showlist = false;
      return;
    }
  });
}
]);
