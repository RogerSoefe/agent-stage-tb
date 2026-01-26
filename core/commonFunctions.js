//debug functions
var CommonFunctions = CommonFunctions || {};

var isMouseDown = false, isHighlighted = false, totalSelected = 0;

String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

CommonFunctions.DefaultCustProfile = ".";
CommonFunctions.CustomerTimeZone = 3;

function log(data) {
	if (!SETTINGS.ConsoleActive) return;
	var caller = arguments.callee.caller.name;
	if (!caller || caller == "") caller = arguments.callee.caller.toString();
	console.log(data);
}

CommonFunctions.sum = function (items, prop) {
	return items.reduce(function (a, b) {
		return a + b[prop];
	}, 0);
};
	

CommonFunctions.ServiceCodes = {
	success: 0,
	fail: 1,
	sessionExpired: 2,
	timeOut: 3,
	warning: 4
};

CommonFunctions.groupBy = function (xs, key) {
	return xs.reduce(function (rv, x) {
		(rv[x[key]] = rv[x[key]] || []).push(x);
		return rv;
	}, {});
};

CommonFunctions.Translate = function (text) {
	if (!CommonFunctions.TranslateFn) return text;
	return CommonFunctions.TranslateFn(text);
}

CommonFunctions.ApplyTimeZone = function (date, timeZone) {
    var offSet = 0;
    switch (timeZone) {
        case 1:
            offSet = 1;
            break;
        case 2:
            offSet = 2;
            break;
        case 3:
            offSet = 3;
            break;
    }
    return new Date(date.getTime() - (offSet * 60 * 60 * 1000));
};

//Document_Function
CommonFunctions.DeleteFromArray = function (array, posToDelete) {
	var cnt = 0;
	$.each(posToDelete, function (i, el) {
		array.splice(el - cnt, 1);
		cnt++;
	});
};

//Document_Function
CommonFunctions.DynamicSort = function (property) {
	var sortOrder = 1;

	if (property[0] === "-") {
		sortOrder = -1;
		property = property.substr(1);
	}
	return function (a, b) {
		var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
		return result * sortOrder;
	};
};

//Document_Function
CommonFunctions.FormatDateTime = function (dateTime, formatCode, timeZone, showFourDigitsYear) {
    var ret = null;
    var retDate = null;
    if (dateTime == null || formatCode == null)
        return null;
    if (timeZone == null || typeof timeZone == "undefined") timeZone = CommonFunctions.CustomerTimeZone;
    if (dateTime.toString().indexOf("Date(") >= 0) {
        var ticks = parseFloat(dateTime.replace("/Date(", "").replace(")/", ""));
        dateTime = new Date(ticks);
        dateTime = CommonFunctions.ApplyTimeZone(dateTime, timeZone);
    }
    else {
        dateTime = CommonFunctions.SysDate(dateTime);
        if (formatCode != 11) {
            dateTime = CommonFunctions.ApplyTimeZone(dateTime, timeZone);
        }
    }
    var dd, mm, yyyy, hh, mi, ampm, weekday, month, seconds;
    switch (formatCode) {
        case 1:
            return dateTime.toLocaleDateString("en-US");
        case 2:
            return dateTime.format("shortTime", false) + CommonFunctions.GetTimeZoneDesc(timeZone);
        case 3:
            dd = dateTime.getDate();
            mm = dateTime.getMonth() + 1;
            yyyy = dateTime.getFullYear();

            if (showFourDigitsYear != null && showFourDigitsYear == "true") {
                if (dd < 10)
                    dd = '0' + dd;
                if (mm < 10)
                    mm = '0' + mm;
                retDate = mm + '/' + dd + '/' + yyyy.toString();
            } else {
                if (dd < 10)
                    dd = '0' + dd;
                if (mm < 10)
                    mm = '0' + mm;
                retDate = mm + '/' + dd + '/' + yyyy.toString().substr(2, 2);
            }
            hh = dateTime.getHours();
            mi = dateTime.getMinutes();
            ampm = hh >= 12 ? "PM" : "AM";

            if (hh > 12)
                hh = hh - 12;
            if (mi < 10)
                mi = '0' + mi;
            retDate += " / " + hh + ":" + mi + " " + ampm;

            return retDate;
        case 4:
            dd = dateTime.getDate();
            mm = dateTime.getMonth() + 1;
            yyyy = dateTime.getFullYear();

            retDate = null;
            if (dd < 10)
                dd = '0' + dd;
            if (mm < 10)
                mm = '0' + mm;
            return mm + '/' + dd + '/' + yyyy.toString();
        case 5:
            dd = dateTime.getDate();
            mm = dateTime.getMonth() + 1;
            yyyy = dateTime.getFullYear();

            if (dd < 10)
                dd = '0' + dd;
            if (mm < 10)
                mm = '0' + mm;
            return yyyy.toString() + '-' + mm + '-' + dd;
        case 6:
            dd = dateTime.getDate();
            mm = dateTime.getMonth() + 1;

            weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

            return weekday[dateTime.getDay()] + " " + mm + '/' + dd;
        case 7:
            dd = dateTime.getDate();
            mm = dateTime.getMonth() + 1;

            weekday = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

            return weekday[dateTime.getDay()] + " " + mm + '/' + dd;
        case 8:
             hh = dateTime.getHours();
             mi = dateTime.getMinutes();
             seg = dateTime.getSeconds();
             ampm = hh >= 12 ? "PM" : "AM";

            if (hh > 12)
             hh = hh - 12;
            if (mi < 10)
             mi = '0' + mi;
            seg = seg.toString().padStart(2, '0');
            return hh + ":" + mi + ":" + seg + " "  + ampm;

        case 9:
            dd = dateTime.getDate();
            mm = dateTime.getMonth() + 1;
            yyyy = dateTime.getFullYear();
            return yyyy + mm + dd;

        case 10:
            return dateTime;


        case 11:
            dd = dateTime.getDate();
            mm = dateTime.getMonth();
            weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return weekday[dateTime.getDay()] + " " + month[dateTime.getMonth()] + " " + dd;

        case 12:
            hh = dateTime.getHours();
            mi = dateTime.getMinutes();
            ampm = hh >= 12 ? "PM" : "AM";

            if (hh > 12)
                hh = hh - 12;
            if (mi < 10)
                mi = '0' + mi;
            dd = dateTime.getDate();
            mm = dateTime.getMonth();
            weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return weekday[dateTime.getDay()] + " " + dd + " " + month[dateTime.getMonth()] + " " + hh + ":" + mi + " " + ampm;

        case 13:
            return dateTime.format("shortTime", false);
        case 14:
            return CommonFunctions.GetTimeZoneDesc(timeZone);
        case 15:
            var parts = dateTime.toLocaleDateString("en-US").split("/");
            return new Date(parts[2], parts[0] - 1, parts[1]);
        case 16:
            dd = dateTime.getDate();
            mm = dateTime.getMonth() + 1;
            return mm + '/' + dd;
        case 17:
            hh = dateTime.getHours();
            mi = dateTime.getMinutes();
            seconds = dateTime.getSeconds();
            ampm = hh >= 12 ? "PM" : "AM";

            if (hh > 12)
                hh = hh - 12;
            if (mi < 10)
                mi = '0' + mi;
            if (seconds < 10)
                seconds = '0' + seconds;

            dd = dateTime.getDate();
            mm = dateTime.getMonth();
            weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return weekday[dateTime.getDay()] + " " + dd + " " + month[dateTime.getMonth()] + " " + hh + ":" + mi + ":" + seconds + " " + ampm;
    }
    return ret;
};

//Document_Function
CommonFunctions.GetTimeZoneDesc = function (timeZone) {
	var desc = "";
	switch (timeZone) {
		case 0:
			desc = " (EST)";
			break;
		case 2:
			desc = " (MST)";
			break;
		case 1:
			desc = " (CST)";
			break;
		case 3:
			desc = " (PST)";
			break;
	}
	return desc;
};


//function getDateString(jsonDate) {
//    return toPstTime(jsonDate);
//}

//Document_Function
CommonFunctions.JSONToDate = function (dateTime, removeTime) {
	if (typeof dateTime == "undefined" || dateTime == null)
		return null;
	try {
		//getDateString(dateTime);
		if (removeTime == null) removeTime = false;
		var ticks = parseInt(dateTime.replace("/Date(", "").replace(")/", ""));
		var dt = moment.utc(ticks)._d;

		if (removeTime) dt.setHours(0, 0, 0, 0);
		return dt;
	} catch (e) {
		log(e);
	}
	return null;
};

//Document_Function
CommonFunctions.SubstituteDigitByLetter = function (digit) {
	switch (digit) {
		case "0":
			return "Z";
		case "1":
			return "A";
		case "2":
			return "B";
		case "3":
			return "C";
		case "4":
			return "D";
		case "5":
			return "E";
		case "6":
			return "F";
		case "7":
			return "G";
		case "8":
			return "H";
		case "9":
			return "I";
	}
	return "";
};

//Document_Function
CommonFunctions.SubString = function (str, beg, end) {
	if (str == null) return "";
	if (beg == null) beg = 0;
	if (end == null) end = str.toString().length;

	return str.toString().substring(beg, end);

};

//Document_Function
CommonFunctions.AdjustLine = function (line, lineAdj, evForZero, showSign) {
	var x = line + lineAdj;
	if (evForZero == true && x == 0) {
		return "pk";
	}
	var returnStr = "";
	if (x > 0 && showSign == true) {
		returnStr = "+";
	}

	returnStr += LineOffering.ConvertToHalfSymbol(x);
	return returnStr;
};

//Document_Function
CommonFunctions.CalculatePriceAdj = function (line, lineAdj, buyPointsAry, wagerType, sportSubType, progressivePointBuyingFlag, progressivePointCostAry) {
	var buy = 0;
	var buyMax = 0;
	var buyOn3 = 0;
	var buyOff3 = 0;
	var buyOn7 = 0;
	var buyOff7 = 0;

	if (wagerType == "S") {
		buy = buyPointsAry.SpreadBuy;
		buyMax = buyPointsAry.SpreadBuyMax;
		buyOn3 = buyPointsAry.SpreadBuyOn3;
		buyOff3 = buyPointsAry.SpreadBuyOff3;
		buyOn7 = buyPointsAry.SpreadBuyOn7;
		buyOff7 = buyPointsAry.SpreadBuyOff7;
	}
	else {
		buy = buyPointsAry.TotalBuy;
		buyMax = buyPointsAry.TotalBuyMax;
		buyOn3 = buyPointsAry.TotalBuy;
		buyOff3 = buyPointsAry.TotalBuy;
		buyOn7 = buyPointsAry.TotalBuy;
		buyOff7 = buyPointsAry.TotalBuy;
	}

	if (progressivePointBuyingFlag == null) progressivePointBuyingFlag = "N";

	var cost = 0;
	var wrkLineAdj = lineAdj;

	if (wrkLineAdj < 0) wrkLineAdj *= -1;
	var i;
	if (progressivePointBuyingFlag == 'Y' && progressivePointCostAry != null) {
		for (i = 1; i <= parseInt(progressivePointBuyingFlag) && i <= wrkLineAdj * 2; i++) {
			if (line + (i * .5) == -3 || line + (i * .5) == 3)
				cost += Math.round((progressivePointCostAry[i - 1].pricePerHalfPoint * progressivePointCostAry[i - 1].onOff3Ratio), 0);
			else {
				if (line + (i * .5) == -2.5 || line + (i * .5) == 3.5)
					cost += Math.round((progressivePointCostAry[i - 1].pricePerHalfPoint * progressivePointCostAry[i - 1].off3Ratio), 0);
				else {
					if (line + (i * .5) == -7 || line + (i * .5) == 7)
						cost += Math.round((progressivePointCostAry[i - 1].pricePerHalfPoint * progressivePointCostAry[i - 1].onOff7Ratio), 0);
					else {
						if (line + (i * .5) == -6.5 || line + (i * .5) == 7.5)
							cost += Math.round((progressivePointCostAry[i - 1].pricePerHalfPoint * progressivePointCostAry[i - 1].off7Ratio));
						else cost += progressivePointCostAry[i - 1].pricePerHalfPoint;
					}
				}
			}
		}
	}
	else {
		for (i = 0.5; i <= wrkLineAdj; i += 0.5) {
			switch (wagerType) {
				case 'L':
					cost += buy;
					break;
				case 'S':
					if (line + i == 3 || line + i == -3) cost += buyOn3;
					else {
						if (line + i - 0.5 == 3 || line + i - 0.5 == -3) cost += buyOff3;
						else {
							if (line + i == 7 || line + i == -7) cost += buyOn7;
							else {
								if (line + i - 0.5 == 7 || line + i - 0.5 == -7) cost += buyOff7;
								else cost += buy;
							}
						}
					}
					break;
			}
		}
	}
	return cost;
};

//Document_Function
CommonFunctions.ConvertPriceToDecimal = function (price, precision) {

	var decimalPrice = 0.0;

	if (precision == 0) {
		if (price < 0) {
			decimalPrice = -100.0 / price;
		}
		else {
			decimalPrice = price / 100.0;
		}
		decimalPrice += 1.0;
		return decimalPrice;
	}

	var multiplier = CommonFunctions.GetPrecisionMultiplier(precision);
	if (price < 0) decimalPrice += (Math.floor(-100.0 / price * multiplier));
	else decimalPrice += (Math.floor(price / 100.0 * multiplier));

	switch (precision) {
		case 2:
			decimalPrice += 100;
			break;
		case 3:
			decimalPrice += 1000;
			break;
		case 4:
			decimalPrice += 10000;
			break;
	}

	decimalPrice /= multiplier;
	return decimalPrice;
};

//Document_Function
CommonFunctions.GetPrecisionMultiplier = function (precision) {
	var multiplier = 10000;

	switch (precision) {
		case 2:
			multiplier = 100;
			break;
		case 3:
			multiplier = 1000;
			break;
		case 4:
			multiplier = 10000;
			break;
	}
	return multiplier;
};

//Document_Function
CommonFunctions.RoundNumber = function (val) {
	var parsed = parseFloat(val, 10);
	if (parsed !== parsed) { return null; } // check for NaN
	var rounded = Math.round(parsed, (CommonFunctions.showCents ? 2 : 0));
	return rounded;
};

//Document_Function
CommonFunctions.FormatNumber = function (num, divideByHundred, applyFloor) {
	if (num == null) num = null;
	if (CommonFunctions.IsNumeric(num)) {
		var neg = num < 0;
		var f = parseFloat(Math.abs(num));

		if (typeof divideByHundred == "undefined") divideByHundred = false;

		if (divideByHundred) f = f / 100;
		if (applyFloor) f = Math.floor(f).toFixed();
		else if (!CommonFunctions.showCents) f = Math.round(f).toFixed();
		else f = f.toFixed(2);

		var p = f.split(".");
		var ret = p[0].split("").reverse().reduce(function (acc, number, i) {
			return number + (i && !(i % 3) ? "," : "") + acc;
		}, "");
		if (CommonFunctions.showCents && p[1]) ret += "." + p[1];

		if (neg && ret != "0") ret = "-" + ret;
		return ret;

	}
	else return num;
};

//Document_Function
CommonFunctions.IsNumeric = function (data) {
	return parseFloat(data) == data;
};

//Document_Function
CommonFunctions.RedirecToPage = function (page, $location, redirectToSamePage) {
	if (typeof redirectToSamePage == "undefined") redirectToSamePage = false;
	if (window.location.href.indexOf(page) == -1 || redirectToSamePage || page.length < 2) {
		if ($location != null) {
			$location.path(page);
		}
		else {
			window.location.href = page;
		}
	}
};

CommonFunctions.GetWagerDescription = function (wagerInfo) {
	var twriter = wagerInfo.EnteredBy || wagerInfo.TicketWriter;
	if (twriter) {
		if (twriter.indexOf("HORSE") != -1) {
			return CommonFunctions.Translate("Horses");
		}
		if (twriter.indexOf("GSLIVE") != -1) {
			return CommonFunctions.Translate("Live Betting");
		}

		if (twriter.indexOf("System") != -1) {
			return CommonFunctions.Translate("Casino");
		}
	}
	var description = "";

	switch (wagerInfo.WagerType) {
		case "S":
			if (wagerInfo.SportType != null && wagerInfo.SportType == "Baseball")
				description = CommonFunctions.Translate("RUN_LINE");
			else
				description = CommonFunctions.Translate("SPREAD");
			break;
		case "M":
			description = CommonFunctions.Translate("MONEY LINE");
			break;
		case "L": //Total points
			description = CommonFunctions.Translate("TOTAL POINTS");
			break;
		case "E": //team Totals
			description = CommonFunctions.Translate("TEAM TOTALS");
			break;
		case "P":
			if (wagerInfo.RoundRobinLink > 0) description = wagerInfo.totalPicks + " " + CommonFunctions.Translate("TEAMS") + " " + CommonFunctions.Translate("ROUND ROBIN");
			else description = wagerInfo.totalPicks + " " + CommonFunctions.Translate("TEAMS") + " " + CommonFunctions.Translate("PARLAY");
			break;
		case "T":
			var ties = "";
			switch (wagerInfo.ties) {
				case 0:
					ties = CommonFunctions.Translate("PUSHES");
					break;
				case 1:
					ties = CommonFunctions.Translate("WINS");
					break;
				case 2:
					ties = CommonFunctions.Translate("LOSES");
					break;
			}
			var teaserName = "";
			if (wagerInfo.TeaserName != null)
				teaserName = wagerInfo.TeaserName;
			description = wagerInfo.totalPicks + " " + CommonFunctions.Translate("TEAMS") + " " + teaserName + " " + CommonFunctions.Translate("TEASER") + ", " + CommonFunctions.Translate("TIES") + " " + ties;
			break;
		case "I":
			description = "If-Bet";
			if (wagerInfo.ContinueOnPushFlag != null) {
				if (wagerInfo.ContinueOnPushFlag == "Y") {
					description += " (" + CommonFunctions.Translate("IF WIN OR PUSH") + ")";
				} else {
					description += " (" + CommonFunctions.Translate("IF WIN ONLY") + ")";
				}
			}
			break;
		case "C":
			description = CommonFunctions.Translate("PROPS TITLE");
			break;
		case "G":
			description = CommonFunctions.Translate("Horses");
			break;
	}
	return description;
};


CommonFunctions.ArrayIncludes = function (array, val) {
	if (!array || !val) return false;
	for (var idx = 0; idx < array.length; idx++) {
		if (array[idx] == val) return true;
	}
	return false;
};

CommonFunctions.GetMonthName = function (idx) {
	var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
	return month[idx];
};

CommonFunctions.GetDayOfWeekName = function (date) {
	var targetDate = new Date(date);
	var weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	return weekday[targetDate.getDay()];
};

CommonFunctions.WeekbyDatesRange = function (week, today, closeOfWeek = 2) {
	if (week == null || week == 0)
		return CommonFunctions.Translate("This Week");

	var WeekConst = 7;
	var daysAgo = week * WeekConst;
	//var today = new Date();
  if (!today) today = new Date();
  const y = today.getFullYear();
  const mo = today.getMonth();
  const d = today.getDate();
  var ThisWeekFirstDayDate = new Date(y, mo, d);
	var AllWeeksFirstDayDate;
	var LastDateOfWeek;

	var year = today.getYear();
	var monthnumber = today.getMonth() + 1;
	var monthday = today.getDate(); //The value returned by getDay() is a number between 0 and 6. Sunday is 0, Monday is 1 and so on.
	var weekday = today.getDay();

	for (var i = 0; i < 7; i++) {
		if (i == weekday) {
			if (i == 0) {
				ThisWeekFirstDayDate.setDate(today.getDate() - 6);
			} else {
				ThisWeekFirstDayDate.setDate(today.getDate() - (i - 1));
			}
			break;
		}
	}
  if (closeOfWeek > 2)
    ThisWeekFirstDayDate.setDate(ThisWeekFirstDayDate.getDate() + (closeOfWeek - 2))

	AllWeeksFirstDayDate = new Date(ThisWeekFirstDayDate);
	LastDateOfWeek = new Date(ThisWeekFirstDayDate);
	AllWeeksFirstDayDate.setDate(AllWeeksFirstDayDate.getDate() - daysAgo);
	LastDateOfWeek.setDate(LastDateOfWeek.getDate() - daysAgo + 6);

	var FirstDateMonth = AllWeeksFirstDayDate.getMonth() + 1;
	var LastDateMonth = LastDateOfWeek.getMonth() + 1;

	return ((FirstDateMonth <= 9 ? "0" + FirstDateMonth : FirstDateMonth) + "/" + (AllWeeksFirstDayDate.getDate() <= 9 ? "0" + AllWeeksFirstDayDate.getDate() :
		AllWeeksFirstDayDate.getDate()) + " to " + (LastDateMonth <= 9 ? "0" + LastDateMonth :
			LastDateMonth) + "/" + (LastDateOfWeek.getDate() <= 9 ? "0" + LastDateOfWeek.getDate() : LastDateOfWeek.getDate())) ;

};

CommonFunctions.WeekbyFullDatesRange = function (week) {
	var WeekConst = 7;
	var daysAgo = week * WeekConst;

	var today = new Date();
	var ThisWeekFirstDayDate = new Date();
	var AllWeeksFirstDayDate;
	var LastDateOfWeek;

	var year = today.getYear();
	var monthnumber = today.getMonth() + 1;
	var monthday = today.getDate(); //The value returned by getDay() is a number between 0 and 6. Sunday is 0, Monday is 1 and so on.
	var weekday = today.getDay();

	for (var i = 0; i < 7; i++) {
		if (i == weekday) {
			if (i == 0) {
				ThisWeekFirstDayDate.setDate(today.getDate() - 6);
			} else {
				ThisWeekFirstDayDate.setDate(today.getDate() - (i - 1));
			}
			break;
		}
	}

	AllWeeksFirstDayDate = new Date(ThisWeekFirstDayDate);
	LastDateOfWeek = new Date(ThisWeekFirstDayDate);
	AllWeeksFirstDayDate.setDate(AllWeeksFirstDayDate.getDate() - daysAgo);
	LastDateOfWeek.setDate(LastDateOfWeek.getDate() - daysAgo + 6);

	var FirstDateMonth = AllWeeksFirstDayDate.getMonth() + 1;
	var LastDateMonth = LastDateOfWeek.getMonth() + 1;
	var FirstDateYear = AllWeeksFirstDayDate.getFullYear();
	var LastDateYear = LastDateOfWeek.getFullYear();

	return ((FirstDateMonth <= 9 ? "0" + FirstDateMonth : FirstDateMonth) + "/" + (AllWeeksFirstDayDate.getDate() <= 9 ? "0" + AllWeeksFirstDayDate.getDate() :
		AllWeeksFirstDayDate.getDate()) + "/" + FirstDateYear + " to " + (LastDateMonth <= 9 ? "0" + LastDateMonth :
			LastDateMonth) + "/" + (LastDateOfWeek.getDate() <= 9 ? "0" + LastDateOfWeek.getDate() : LastDateOfWeek.getDate()) + "/" + LastDateYear);

};

var State = function (a, b) {
	return {
		abrev: a,
		name: b
	};
};

CommonFunctions.GetStates = function () {

	var statesList = [];
	var state = new State("AK", "Alaska");
	statesList.push(state);
	state = new State("AL", "Alabama");
	statesList.push(state);
	state = new State("AR", "Arkansas");
	statesList.push(state);
	state = new State("AZ", "Arizona");
	statesList.push(state);
	state = new State("CA", "California");
	statesList.push(state);
	state = new State("CO", "Colorado");
	statesList.push(state);
	state = new State("CT", "Connecticut");
	statesList.push(state);
	state = new State("DE", "Delaware");
	statesList.push(state);
	state = new State("FL", "Florida");
	statesList.push(state);
	state = new State("GA", "Georgia");
	statesList.push(state);
	state = new State("HI", "Hawaii");
	statesList.push(state);
	state = new State("IA", "Iowa");
	statesList.push(state);
	state = new State("ID", "Idaho");
	statesList.push(state);
	state = new State("IL", "Illinois");
	statesList.push(state);
	state = new State("IN", "Indiana");
	statesList.push(state);
	state = new State("KS", "Kansas");
	statesList.push(state);
	state = new State("KY", "Kentucky");
	statesList.push(state);
	state = new State("LA", "Louisiana");
	statesList.push(state);
	state = new State("MA", "Massachusetts");
	statesList.push(state);
	state = new State("MD", "Maryland");
	statesList.push(state);
	state = new State("ME", "Maine");
	statesList.push(state);
	state = new State("MI", "Michigan");
	statesList.push(state);
	state = new State("MN", "Minnesota");
	statesList.push(state);
	state = new State("MO", "Missouri");
	statesList.push(state);
	state = new State("MS", "Mississippi");
	statesList.push(state);
	state = new State("MT", "Montana");
	statesList.push(state);
	state = new State("NC", "North Carolina");
	statesList.push(state);
	state = new State("ND", "North Dakota");
	statesList.push(state);
	state = new State("NE", "Nebraska");
	statesList.push(state);
	state = new State("NH", "New Hampshire");
	statesList.push(state);
	state = new State("NJ", "New Jersey");
	statesList.push(state);
	state = new State("NM", "New Mexico");
	statesList.push(state);
	state = new State("NV", "Nevada");
	statesList.push(state);
	state = new State("NY", "New York");
	statesList.push(state);
	state = new State("OH", "Ohio");
	statesList.push(state);
	state = new State("OK", "Oklahoma");
	statesList.push(state);
	state = new State("OR", "Oregon");
	statesList.push(state);
	state = new State("PA", "Pennsylvania");
	statesList.push(state);
	state = new State("RI", "Rhode Island");
	statesList.push(state);
	state = new State("SC", "South Carolina");
	statesList.push(state);
	state = new State("SD", "South Dakota");
	statesList.push(state);
	state = new State("TX", "Texas");
	statesList.push(state);
	state = new State("UT", "Utah");
	statesList.push(state);
	state = new State("VA", "Virginia");
	statesList.push(state);
	state = new State("VT", "Vermont");
	statesList.push(state);
	state = new State("WA", "Washington");
	statesList.push(state);
	state = new State("WI", "Wisconsin");
	statesList.push(state);
	state = new State("WV", "West Virginia");
	statesList.push(state);
	state = new State("WY", "Wyoming");
	statesList.push(state);
	state = new State("YK", "Yukon");
	statesList.push(state);
	return statesList;
};

CommonFunctions.SysDate = function (dateTime, debug) {
	try {

		var dta, da, ta, m, d, y, h, mi, s = 0, tt;

		if (!dateTime) {
			return new Date();
		} else {
			if (typeof dateTime === "object") {
               dateTime = dateTime.toISOString();
            }
			if (dateTime.indexOf("T") >= 0) {
				dateTime = dateTime.replace("T", " ");
				dta = dateTime.split(' ');
				if (dta.length != 2) new Date();
				da = dta[0].split('-');
				ta = dta[1].split(':');

				m = parseInt(da[1]) - 1;
				d = parseInt(da[2]);
				y = parseInt(da[0]);

				h = parseInt(ta[0]);
				mi = parseInt(ta[1]);

				if (ta.length == 3) s = parseInt(ta[2]);

			}
			else {
				dta = dateTime.split(' ');
				  if (dta.length != 2) return new Date(dateTime);
                  da = dta[0].split('/');
                  ta = dta[1].split(':');

				if (da.length != 3 || ta.length != 2) return new Date(dateTime);

				m = parseInt(da[0]) - 1;
				d = parseInt(da[1]);
				y = parseInt(da[2]);

				h = parseInt(ta[0]);
				mi = parseInt(ta[1]);
				if (ta.length == 3) s = parseInt(ta[2]);

			}
			tt = new Date(Date.UTC(y, m, d, h, mi, s));
			tt.setTime(tt.getTime() + tt.getTimezoneOffset() * 60 * 1000);
		}
		if (debug) console.log(dateTime, y, m, d, h, mi, tt);
		return tt;
	}
	catch (e) {
		console.log(e);
		return new Date();
	}
};

CommonFunctions.PrepareTable = function (tableId) {
	totalSelected = 0;
	adjustTotal("0", true);
	setTimeout(function () {
		jQuery(function () {
			jQuery("#" + tableId + " td").on("mousedown", function (event) {
				if (!event.ctrlKey) {
					jQuery("#" + tableId + " td").removeClass("highlighted");
					totalSelected = 0;
				}
				var el = jQuery(this);
				var add = false;
				var addC = false;
				var addD = false;
				isMouseDown = true;
				if (el[0].id.indexOf("D") < 0) {
					isHighlighted = el[0].className.indexOf('highlighted') >= 0;
					if (isHighlighted) el.removeClass("highlighted");
					else {
						el.addClass("highlighted");
						add = true;
						addC = true;
						addD = true;
					}
					if (el[0].id.indexOf("L") >= 0) {
						adjustTotal(el[0].innerText, add, "S");
					}
					if (el[0].id.indexOf("N") >= 0) {
						adjustTotal(el[0].innerText, addC, "A");
					}
					if (el[0].id.indexOf("P") >= 0) {
						adjustTotal(el[0].innerText, addD, "A");
					}
					isHighlighted = !isHighlighted;
				}
				return false; // prevent text selection
			}).on("mouseover", function () {
				if (isMouseDown) {
					var el = jQuery(this);
					var add = false;
					var addC = false;
					var addD = false;
					if (el[0].id.indexOf("D") < 0) {
						isHighlighted = el[0].className.indexOf('highlighted') >= 0;
						//var ready = (el[0].className.indexOf('highlighted') >= 0 && isHighlighted) || (el[0].className.indexOf('highlighted') < 0 && !isHighlighted);
						//if (ready) return;
						if (isHighlighted) el.removeClass("highlighted");
						else {
							el.addClass("highlighted");
							add = true;
							addC = true;
							addD = true;
						}

						if (el[0].id.indexOf("L") >= 0) {
							adjustTotal(el[0].innerText, add, "S");
						}
						if (el[0].id.indexOf("N") >= 0) {
							adjustTotal(el[0].innerText, addC, "A");
						}
						if (el[0].id.indexOf("P") >= 0) {
							adjustTotal(el[0].innerText, addD, "A");
						}
					}
				}
			})
				.bind("selectstart", function () {
					return false;
				});

			jQuery(document).on("mouseup", function () {
				isMouseDown = false;
			});
		});
	}, 800);

	function adjustTotal(amount, add, operation) {
		var a = parseFloat(amount.replace(/[^\d\.\-]/g, ''));
		a = operation == "S" && a > 0 ? a * -1 : a;
		if (add) totalSelected += a;
		else totalSelected -= a;
		var topD = jQuery("#totalSelectedDesktop");
		var topM = jQuery("#totalSelectedMobile");
		var bottom = jQuery("#totalSelectedBottom");
		topD.val(CommonFunctions.FormatNumber(Math.round(totalSelected * 100) / 100), false, false);
		topM.val(CommonFunctions.FormatNumber(Math.round(totalSelected * 100) / 100), false, false);
		bottom.val(CommonFunctions.FormatNumber(Math.round(totalSelected * 100) / 100), false, false);
		if (totalSelected < 0) {
			topD.addClass("num_neg");
			topM.addClass("num_neg");
			bottom.addClass("num_neg");
		} else {
			topD.removeClass("num_neg");
			topM.removeClass("num_neg");
			bottom.removeClass("num_neg");
		}
	}
};

function SetTableFixedHeaderFunction($) {
	$.fn.fixMe = function () {
		return this.each(function () {
			var $this = jQuery(this),
				$t_fixed;
			function init() {
				$this.wrap('<div class="tableWrapper no-printable" />');
				$t_fixed = $this.clone();
				$t_fixed.find("tbody").remove().end().addClass("fixed").insertBefore($this);
				resizeFixed();
			}
			function resizeFixed() {
				$t_fixed.find("th").each(function (index) {
					jQuery(this).css("width", $this.find("th").eq(index).outerWidth() + "px");
				});
			}
			function scrollFixed() {
				var offset = jQuery(this).scrollTop(),
					tableOffsetTop = $this.offset().top,
					tableOffsetBottom = tableOffsetTop + $this.height() - $this.find("thead").height();
				if (offset < tableOffsetTop || offset > tableOffsetBottom)
					$t_fixed.hide();
				else if (offset >= tableOffsetTop && offset <= tableOffsetBottom && $t_fixed.is(":hidden"))
					$t_fixed.show();
			}
			jQuery(window).resize(resizeFixed);
			jQuery(window).scroll(scrollFixed);
			init();
		});
	};

}
