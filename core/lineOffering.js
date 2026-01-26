var LineOffering = LineOffering || {};

LineOffering.DisabledLineLabel = "  N/A";
LineOffering.OverLabel = " O ";
LineOffering.UnderLabel = " U ";
LineOffering.WTIfWinPush = 3;
LineOffering.WTIfWin = 4;

//Should be the same as SIDLibraries.BusinessLayer.WagerType
/*
LineOffering.WTStraightBet = 0;
LineOffering.WTParlay = 1;
LineOffering.WTTeaser = 2;
LineOffering.WTActionReverse = 5;
LineOffering.WTProps = 6;
*/

LineOffering.WagerTypes = {
    Items: [
        {
            Name: "Contest",
            Code: "C"
        }, {
            Name: "Spread",
            Code: "S"
        }, {
            Name: "Money Line",
            Code: "M"
        }, {
            Name: "Total Points",
            Code: "L"
        }, {
            Name: "Team Totals",
            Code: "E"
        }, {
            Name: "Parlay",
            Code: "P"
        }, {
            Name: "Teaser",
            Code: "T"
        }, {
            Name: "If Bet",
            Code: "I"
        }, {
            Name: "Casino",
            Code: "G"
        }
    ],
    GetByCode : function(code, teaserName) {
        for (var i = 0; i < this.Items.length; i++) {
            if (code === this.Items[i].Code) return this.Items[i].Name + ' ' + (code == 'T' && teaserName ? teaserName : '');
        }
        return null;
    },

    GetByName : function(name) {
    for (var i = 0; i < this.Items.length; i++) {
        if (name === this.Items[i].Name) return this.Items[i].Code;
    }
    return null;
}

};

//Document_Function
LineOffering.ConvertToHalfSymbol = function (num, showPlus = true) {
    var x = num;
    var returnStr = "";
    if (num > 0 && showPlus) returnStr += "+";
    if (Math.floor(x) != num) {
        var intPortion = 0;
        var halfPortion = "";
        if (x > 0) {
            intPortion = Math.floor(x);
            halfPortion = "½";
        }
        if (x < 0) {
            intPortion = Math.floor(x) + 1;
            halfPortion = "-½";
        }
        if (intPortion != 0) {
            returnStr += intPortion;
            returnStr += "½";
        } else {
            returnStr = halfPortion;
        }
    } else if (num == 0) returnStr = 'pk';
    else returnStr += num + "";

    return returnStr;
};

//Document_Function
LineOffering.FormatAhSpread = function(spread, ahSeparetor, useWebHalfSymbol, pointsbought, pointsSoldBought) {
    var str = "";
    var regExp = "/\s+/g";

    if (!pointsbought) pointsbought = 0;
    if (!pointsSoldBought) pointsSoldBought = 0;

    if (spread != null) {
        var spreadVal = spread;

        if ((spreadVal * 2) == Math.floor(spreadVal * 2)) {
            if (spread == 0) str += "pk";
            else {
                if (spreadVal > 0) str += "+";
                str += LineOffering.ConvertToHalfSymbol(spreadVal);
            }
        } else {
            if (spreadVal < 0) {
                if (spreadVal + 0.25 == 0) str += "pk";
                else str += LineOffering.ConvertToHalfSymbol(spreadVal + 0.25);
                str += ahSeparetor + " ";
                if (spreadVal - 0.25 == 0) str += "pk";
                else str += LineOffering.ConvertToHalfSymbol(spreadVal - 0.25);
            } else {
                if (spreadVal - 0.25 == 0) str += "pk";
                else {
                    str += "+";
                    str += LineOffering.ConvertToHalfSymbol(spreadVal - 0.25);
                }
                str += ahSeparetor + " ";
                if (spreadVal + 0.25 == 0) str += "pk";
                else {
                    str += "+";
                    str += LineOffering.ConvertToHalfSymbol(spreadVal + 0.25);
                }
            }
        }

        var str2 = "";
        if (useWebHalfSymbol == true) str2 = str.replace("/½/g", "&#189;");
        else str2 = str;
        pointsbought = pointsbought.toString().replace(regExp, "");

        if (Number(pointsbought) != 0) {
            pointsbought = pointsbought.toString().replace("/0.5/g", "½");
            pointsbought = pointsbought.toString().replace("/1.5/g", "1½");
            if (pointsSoldBought != "") {
                if (pointsSoldBought == "B") str2 += " " + CommonFunctions.Translate("Buying") + " " + LineOffering.ConvertToHalfSymbol(pointsbought) + " " + CommonFunctions.Translate("PTS") + " ";
                else str2 += " " + CommonFunctions.Translate("Selling") + " " + LineOffering.ConvertToHalfSymbol(pointsbought) + " " + CommonFunctions.Translate("PTS") + " ";
            } else str2 += " " + CommonFunctions.Translate("Buying") + " " + LineOffering.ConvertToHalfSymbol(pointsbought) + " " + CommonFunctions.Translate("PTS") + " ";
        }
        return str2;
    } else return "";
};

LineOffering.PointsBought = function (pointsbought, pointsSoldBought) {
    var str2 = "";
    var regExp = "/\s+/g";
    if (!pointsSoldBought) pointsSoldBought = 0;
    pointsbought = pointsbought.toString().replace(regExp, "");
    if (Number(pointsbought) != 0) {
        pointsbought = pointsbought.toString().replace("/0.5/g", "½");
        pointsbought = pointsbought.toString().replace("/1.5/g", "1½");
        if (pointsSoldBought != "") {
            if (pointsSoldBought == "B") str2 += " " + CommonFunctions.Translate("Buying") + " " + LineOffering.ConvertToHalfSymbol(pointsbought) + " " + CommonFunctions.Translate("PTS") + " ";
            else str2 += " " + CommonFunctions.Translate("Selling") + " " + LineOffering.ConvertToHalfSymbol(pointsbought) + " " + CommonFunctions.Translate("PTS") + " ";
        } else str2 += " " + CommonFunctions.Translate("Buying") + " " + LineOffering.ConvertToHalfSymbol(pointsbought) + " " + CommonFunctions.Translate("PTS") + " ";
    }
    return str2;
};

//Document_Function
LineOffering.FormatSpreadOffer = function(gameOffering, teamPos, showSpread, showAsianHandicap, showPrice, sessionPriceType, finalWi, wagerType, pointsBought) {
    var retStr = "";

    if (!gameOffering) return "";
    if (gameOffering.SpreadAdj != null && gameOffering.SpreadAdj > 0) spreadAdj = gameOffering.SpreadAdj;
    var spread = gameOffering.Spread1;
    var spreadAdj = gameOffering.SpreadAdj1;
    var spreadDecimal = gameOffering.SpreadDecimal1;
    var spreadNumerator = gameOffering.SpreadNumerator1;
    var spreadDenominator = gameOffering.SpreadDenominator1;

    if (finalWi != null) {
        if (wagerType && wagerType.code == LineOffering.WTTeaser) spread = finalWi.Line;
        else spread = finalWi.FinalLine + (isNaN(finalWi.HalfPointValue) ? 0 : finalWi.HalfPointValue);
        spreadAdj = finalWi.FinalPrice;
        spreadDecimal = finalWi.FinalDecimal;
        spreadNumerator = gameOffering.FinalNumerator;
        spreadDenominator = gameOffering.FinalDenominator;
    } else if (parseInt(teamPos) == 2) {
        spread = gameOffering.Spread2;
        spreadAdj = gameOffering.SpreadAdj2;
        spreadDecimal = gameOffering.SpreadDecimal2;
        spreadNumerator = gameOffering.SpreadNumerator2;
        spreadDenominator = gameOffering.SpreadDenominator2;
    }

    if (gameOffering.SportType != null && $.trim(gameOffering.SportType) == "Baseball") {
        if (spread != null && (showAsianHandicap == true || (spread * 2) == Math.floor(spread * 2))) {
            retStr += LineOffering.FormatAhSpread(spread, ",", true, pointsBought);
            if (showPrice) {
                retStr += "  ";
                switch (sessionPriceType) {
                case "A":
                    if (!spreadAdj || spreadAdj == 0) {
                        retStr = "";
                        break;
                    }
                    if (spreadAdj >= 0) {
                        retStr += "+";
                    }
                    retStr += spreadAdj;
                    break;
                case "D":
                    if (spreadDecimal == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += spreadDecimal;
                    if (spreadDecimal == Math.floor(spreadDecimal)) {
                        retStr += ".0";
                    }
                    break;
                case "F":
                    if (spreadNumerator == 0 || spreadDenominator == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += spreadNumerator;
                    retStr += "/";
                    retStr += spreadDenominator;
                    break;
                }
            }
        }
    } else {
        if (spread != null && showSpread) {
            if (showAsianHandicap == true || (spread * 2) == Math.floor(spread * 2)) {
                retStr += LineOffering.FormatAhSpread(spread, ",", true, pointsBought);
            }
            if (showPrice == true) {
                retStr += "  ";
                switch (sessionPriceType) {
                case "A":
                    if (spreadAdj == 0) {
                        retStr = "";
                        break;
                    }
                    if (spreadAdj >= 0) {
                        retStr += "+";
                    }
                    retStr += spreadAdj;
                    break;
                case "D":
                    if (spreadDecimal == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += spreadDecimal;
                    if (spreadDecimal == Math.floor(spreadDecimal)) {
                        retStr += ".0";
                    }
                    break;
                case "F":
                    if (spreadNumerator == 0 || spreadDenominator == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += spreadNumerator;
                    retStr += "/";
                    retStr += spreadDenominator;
                    break;
                }
            }
        }
    }
    if (retStr == "") {
        return LineOffering.DisabledLineLabel;
    } else return retStr;
};

//Document_Function
LineOffering.FormatAhTotal = function(total, ahSeparetor, useWebHalfSymbol, pointsbought, pointsSoldBought, returnPositiveSign) {
    var str = "";
    var regExp = "/\s+/g";

    if (!ahSeparetor) ahSeparetor = ",";
    if (!useWebHalfSymbol) useWebHalfSymbol = false;
    if (!pointsbought) pointsbought = 0;
    //if (!pointsSoldBought) pointsSoldBought = "";
    if (!returnPositiveSign) returnPositiveSign = false;

    if (total != null) {
        var totalValue = total;
        if (total > 0 && returnPositiveSign) str += "+";

        if ((total * 2) == Math.floor(totalValue * 2)) str += LineOffering.ConvertToHalfSymbol(totalValue);
        else {
            str += LineOffering.ConvertToHalfSymbol(totalValue - 0.25);
            str += ahSeparetor + " ";
            str += LineOffering.ConvertToHalfSymbol(totalValue + 0.25);
        }

        var str2 = "";
        if (returnPositiveSign && !str.Contains("+")) str2 += "+";

        if (useWebHalfSymbol == true) str2 += str.replace("/½/g", "&#189;");
        else str2 += str;

        pointsbought = parseFloat(pointsbought.toString().replace(regExp, ""));
        if (pointsbought != 0) {
            str2 += " " + CommonFunctions.Translate("Buying") + " " + LineOffering.ConvertToHalfSymbol(pointsbought) + " " + CommonFunctions.Translate("PTS") + " ";
        }

        return str2;
    } else return "";

};

//Document_Function
LineOffering.FormatTotalOffer = function(gameOffering, teamPos, showTotals, showAsianHandicap, showPrice, sessionPriceType, finalWi, wagerType, pointsBought) {

    var retStr = "";
    if (!gameOffering) return "";
    var totalPoints = gameOffering.TotalPoints1;
    if (gameOffering.TotalAdj != null && gameOffering.TotalAdj > 0) totalPoints += gameOffering.TotalAdj;

    var ttlPtsAdj = gameOffering.TtlPtsAdj1;
    var ttlPointsDecimal = gameOffering.TtlPointsDecimal1;
    var ttlPointsNumerator = gameOffering.TtlPointsNumerator1;
    var ttlPointsDenominator = gameOffering.TtlPointsDenominator1;

    if (finalWi != null) {
        if (wagerType && wagerType.code == LineOffering.WTTeaser) totalPoints = finalWi.Line;
        else totalPoints = finalWi.FinalLine + (isNaN(finalWi.HalfPointValue) ? 0 : finalWi.HalfPointValue);
        ttlPtsAdj = finalWi.FinalPrice;
        ttlPointsDecimal = finalWi.FinalDecimal;
        ttlPointsNumerator = finalWi.FinalNumerator;
        ttlPointsDenominator = finalWi.FinalDenominator;

    } else if (parseInt(teamPos) == 2) {
        totalPoints = gameOffering.TotalPoints2;
        ttlPtsAdj = gameOffering.TtlPtsAdj2;
        ttlPointsDecimal = gameOffering.TtlPointsDecimal2;
        ttlPointsNumerator = gameOffering.TtlPointsNumerator2;
        ttlPointsDenominator = gameOffering.TtlPointsDenominator2;
    }

    if (totalPoints != null && showTotals == true) {
        if (showAsianHandicap == true || (totalPoints * 2) == Math.floor(totalPoints * 2)) {
            retStr += LineOffering.FormatAhTotal(totalPoints, ",", true, pointsBought);
            retStr += "  ";
            if (showPrice == true) {
                switch (sessionPriceType) {
                case "A":
                    if (!ttlPtsAdj || ttlPtsAdj == 0) {
                        retStr = "";
                        break;
                    }
                    if (ttlPtsAdj >= 0) {
                        retStr += "+";
                    }
                    retStr += ttlPtsAdj;
                    break;
                case "D":
                    if (ttlPointsDecimal == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += ttlPointsDecimal;
                    if (ttlPointsDecimal == Math.floor(ttlPointsDecimal)) {
                        retStr += ".0";
                    }
                    break;
                case "F":
                    if (ttlPointsNumerator == 0 || ttlPointsDenominator == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += ttlPointsNumerator;
                    retStr += "/";
                    retStr += ttlPointsDenominator;
                    break;
                }
            }
        }
    }
    if (retStr == "") {
        return LineOffering.DisabledLineLabel;
    } else return retStr;
};

//Document_Function
LineOffering.FormatMoneyLineOffer = function (gameOffering, teamPos, showMoneyLine, showPrice, sessionPriceType, finalWi) {
    if (typeof sessionPriceType == "undefined")
        sessionPriceType = "A";
    var retStr = "";

    if (!gameOffering) return "";

    var moneyLine = gameOffering.MoneyLine1; // -125
    var moneyLineDecimal = gameOffering.MoneyLineDecimal1; // 1.8
    var moneyLineNumerator = gameOffering.MoneyLineNumerator1; // 4
    var moneyLineDenominator = gameOffering.MoneyLineDenominator1; // 5
    var easternLine = gameOffering.EasternLine1; // null

    if (finalWi != null) {
        moneyLine = finalWi.FinalPrice;
        moneyLineDecimal = finalWi.FinalDecimal;
        moneyLineNumerator = finalWi.FinalNumerator;
        moneyLineDenominator = finalWi.FinalDenominator;
    } else {

        switch (parseInt(teamPos)) {
        case 2:
            moneyLine = gameOffering.MoneyLine2;
            moneyLineDecimal = gameOffering.MoneyLineDecimal2;
            moneyLineNumerator = gameOffering.MoneyLineNumerator2;
            moneyLineDenominator = gameOffering.MoneyLineDenominator2;
            easternLine = gameOffering.EasternLine2;
            break;
        case 3:
            moneyLine = gameOffering.MoneyLineDraw;
            moneyLineDecimal = gameOffering.MoneyLineDecimalDraw;
            moneyLineNumerator = gameOffering.MoneyLineNumeratorDraw;
            moneyLineDenominator = gameOffering.MoneyLineDenominatorDraw;
            easternLine = null;
            break;
        }
    }

    if (moneyLine != null) {
        if (gameOffering.SportType != null && gameOffering.SportType == "Baseball") {
            if (showMoneyLine == true) {
                if (gameOffering.EasternLineFlag == "Y" && gameOffering.SportType != null && gameOffering.SportType == "Baseball") {
                    if (easternLine > 0) retStr += "+";
                    retStr += LineOffering.ConvertToHalfSymbol(easternLine);
                } else {
                    switch (sessionPriceType) {
                    case "A":
                        if (!moneyLine || moneyLine == 0) {
                            retStr = "";
                            break;
                        }
                        if (moneyLine >= 0) retStr += "+";
                        retStr += moneyLine;
                        break;
                    case "D":
                        if (moneyLineDecimal == 0) {
                            retStr = "";
                            break;
                        }
                        retStr += moneyLineDecimal;
                        if (moneyLineDecimal == Math.floor(moneyLineDecimal)) retStr += ".0";
                        break;
                    case "F":
                        if (moneyLineNumerator == 0 || moneyLineDenominator == 0) {
                            retStr = "";
                            break;
                        }
                        retStr += moneyLineNumerator;
                        retStr += "/";
                        retStr += moneyLineDenominator;
                        break;
                    }
                }
            }
        } else {
            if (moneyLine != null && showMoneyLine == true) {
                switch (sessionPriceType) {
                case "A":
                    if (moneyLine == 0) {
                        retStr = "";
                        break;
                    }
                    if (moneyLine >= 0) retStr += "+";
                    retStr += moneyLine;
                    break;
                case "D":
                    if (moneyLineDecimal == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += moneyLineDecimal;
                    if (moneyLineDecimal == Math.floor(moneyLineDecimal)) retStr += ".0";
                    break;
                case "F":
                    if (moneyLineNumerator == 0 || moneyLineDenominator == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += gameOffering.MoneyLineNumerator;
                    retStr += "/";
                    retStr += gameOffering.MoneyLineDenominator;
                    break;
                }
            }
        }
    }
    if (retStr == "") {
        //CommonFunctions.DisableInput("M" + teamPos + "_" + gameOffering.GameNum + "_" + gameOffering.PeriodNumber);
        return LineOffering.DisabledLineLabel;
    } else return retStr;
};

//Document_Function
LineOffering.GetTeamTotalsOffer = function(gameOffering, teamPos, showTeamTotals, showAsianHandicap, showPrice, wagerType, sessionPriceType, finalWi) {

    var retStr = "";
    var teamTotalPoints = gameOffering.Team1TotalPoints;
    var teamTtlPtsAdj = gameOffering.Team1TtlPtsAdj1;
    var teamTtlPtsDecimal = gameOffering.Team1TtlPtsDecimal1;
    var teamTtlPtsNumerator = gameOffering.Team1TtlPtsNumerator1;
    var teamTtlPtsDenominator = gameOffering.Team1TtlPtsDenominator1;

    if (finalWi != null) {
        teamTotalPoints = finalWi.FinalLine;
        teamTtlPtsAdj = finalWi.FinalPrice;
        teamTtlPtsDecimal = finalWi.FinalDecimal;
        teamTtlPtsNumerator = finalWi.FinalNumerator;
        teamTtlPtsDenominator = finalWi.FinalDenominator;
    } else {
        switch (parseInt(teamPos)) {
        case 2:
            teamTotalPoints = gameOffering.Team2TotalPoints;
            teamTtlPtsAdj = gameOffering.Team2TtlPtsAdj1;
            teamTtlPtsDecimal = gameOffering.Team2TtlPtsDecimal1;
            teamTtlPtsNumerator = gameOffering.Team2TtlPtsNumerator1;
            teamTtlPtsDenominator = gameOffering.Team2TtlPtsDenominator1;
            break;
        case 3:
            teamTotalPoints = gameOffering.Team1TotalPoints;
            teamTtlPtsAdj = gameOffering.Team1TtlPtsAdj2;
            teamTtlPtsDecimal = gameOffering.Team1TtlPtsDecimal2;
            teamTtlPtsNumerator = gameOffering.Team1TtlPtsNumerator2;
            teamTtlPtsDenominator = gameOffering.Team1TtlPtsDenominator2;
            break;
        case 4:
            teamTotalPoints = gameOffering.Team2TotalPoints;
            teamTtlPtsAdj = gameOffering.Team2TtlPtsAdj2;
            teamTtlPtsDecimal = gameOffering.Team2TtlPtsDecimal2;
            teamTtlPtsNumerator = gameOffering.Team2TtlPtsNumerator2;
            teamTtlPtsDenominator = gameOffering.Team2TtlPtsDenominator2;
            break;
        }
    }


    if (showTeamTotals && ($.trim(wagerType) == "Straight Bet" || $.trim(wagerType) == "Parlay" || wagerType == "")) {

        if (teamTotalPoints != null) {
            retStr += LineOffering.ConvertToHalfSymbol(teamTotalPoints);
            if (showPrice) {
                switch (sessionPriceType.toString()) {
                case "A":
                    if (!teamTtlPtsAdj || teamTtlPtsAdj == 0) {
                        retStr = "";
                        break;
                    }
                    if (teamTtlPtsAdj >= 0) {
                        retStr += "+";
                    }
                    retStr += teamTtlPtsAdj;
                    break;
                case "D":
                    if (teamTtlPtsDecimal == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += teamTtlPtsDecimal;
                    if (teamTtlPtsDecimal == Math.floor(teamTtlPtsDecimal)) {
                        retStr += ".0";
                    }
                    break;
                case "F":
                    if (teamTtlPtsNumerator == 0 || teamTtlPtsDenominator == 0) {
                        retStr = "";
                        break;
                    }
                    retStr += teamTtlPtsNumerator;
                    retStr += "/";
                    retStr += teamTtlPtsDenominator;
                    break;
                }
            }
        }
    }
    return retStr == "" ? LineOffering.DisabledLineLabel : retStr;
};

//Document_Function
LineOffering.CalculateRiskAmt = function (toWinAmt, priceType, americanPrice, decimalPrice, numerator, denominator) {
    var riskAmt = 0;
    switch (priceType) {
        case "A":
            var factor = 100.00 / americanPrice;
            if (factor > 0) {
                riskAmt = toWinAmt * factor;
            }
            else {
                riskAmt = toWinAmt / factor * -1;
            }
            break;
        case "D":
            riskAmt = toWinAmt / (decimalPrice - 1);
            break;
        case "F":
            riskAmt = toWinAmt / numerator * denominator;
            break;
    }
    return riskAmt;
};

//Document_Function
LineOffering.CalculateRiskAmtUsingWi = function (wi, toWinAmount, priceType, fixedPrice) {
    if (toWinAmount == null) toWinAmount = wi.ToWinAmt;
    if (priceType == null) priceType = wi.PriceType;
    var finalPrice = (fixedPrice != null) ? fixedPrice : (wi != null) ? (wi.SelectedLine != null) ? parseInt(wi.SelectedLine.cost) : wi.FinalPrice : 0;
    var decimal = (wi != null) ? wi.DecimalPrice : 0;
    var numerator = (wi != null) ? wi.FinalNumerator : 0;
    var denominator = (wi != null) ? wi.FinalDenominator : 0;
    var riskAmount = LineOffering.CalculateRiskAmt(toWinAmount, priceType, finalPrice, decimal, numerator, denominator);
    //if (wi != null) wi.RiskAmt = riskAmount;
    return riskAmount;
};

//Document_Function
LineOffering.CalculateToWinAmt = function (riskAmt, priceType, americanPrice, decimalPrice, numerator, denominator) {
    var toWinAmount = 0;
    switch (priceType) {
        case "A":
            var factor = americanPrice / 100.00;
            if (factor > 0) {
                toWinAmount = riskAmt * factor;
            }
            else {
                toWinAmount = riskAmt / factor * -1;
            }
            break;
        case "D":
            toWinAmount = riskAmt * (decimalPrice - 1);
            break;
        case "F":
            toWinAmount = riskAmt * numerator / denominator;
            break;
    }
    return toWinAmount;
};

//Document_Function
LineOffering.CalculateToWinAmtUsingWi = function (wi, riskAmt, priceType, fixedPrice) {
    if (riskAmt == null) riskAmt = wi.RiskAmt;
    if (priceType == null) priceType = wi.PriceType;
    var finalPrice = (fixedPrice != null) ? fixedPrice : (wi != null) ? (wi.SelectedLine != null) ? parseInt(wi.SelectedLine.cost) : wi.FinalPrice : 0;
    var decimal = (wi != null) ? wi.DecimalPrice : 0;
    var numerator = (wi != null) ? wi.FinalNumerator : 0;
    var denominator = (wi != null) ? wi.FinalDenominator : 0;
    var toWinAmount = LineOffering.CalculateToWinAmt(riskAmt, priceType, finalPrice, decimal, numerator, denominator);
    //if (wi != null) wi.ToWinAmt = toWinAmount;
    return toWinAmount;
};

//Document_Function
LineOffering.CalculateWiWagerAmount = function(wi) {
    if (wi.RiskAmt == 0) {
        wi.RiskAmt = CommonFunctions.RoundNumber(LineOffering.CalculateRiskAmt(wi.ToWinAmt, wi.PriceType, wi.FinalPrice, wi.FinalDecimal, wi.FinalNumerator, wi.FinalDenominator));
        return true;
    } else {
        wi.ToWinAmt = CommonFunctions.RoundNumber(LineOffering.CalculateToWinAmt(wi.RiskAmt, wi.PriceType, wi.FinalPrice, wi.FinalDecimal, wi.FinalNumerator, wi.FinalDenominator));
        return true;
    }

};

//Document_Function
LineOffering.DetermineActionReverseWagerAmount = function(wagerAmount, wiAry) {
    var retValue;
    if (wiAry != null && wiAry.length == 2) {
        var toWinAmount = 0;
        for (var i = 0; i < wiAry.length; i++) {
            if (wiAry[i].FinalPrice < 0) {
                wiAry[i].ToWinAmt = CommonFunctions.RoundNumber(wagerAmount);
                wiAry[i].RiskAmt = 0;
            } else {
                wiAry[i].ToWinAmt = 0;
                wiAry[i].RiskAmt = CommonFunctions.RoundNumber(wagerAmount);
            }
            LineOffering.CalculateWiWagerAmount(wiAry[i]);
            toWinAmount += wiAry[i].ToWinAmt * 2;
        }
        var maxRiskAmount = LineOffering.CalculateMaxRisk(false, wiAry);
        maxRiskAmount += LineOffering.CalculateMaxRisk(true, wiAry);
        retValue = { "RiskAmt": maxRiskAmount, "ToWinAmt": toWinAmount };
    } else {
        return null;
    }
    return retValue;
};

//Document_Function
LineOffering.CalculateMaxRisk = function(backwardCalc, wiAry) {
    var startIdx = 0;
    var endIdx = wiAry.length - 1;
    var inc = 1;
    if (backwardCalc == true) {
        endIdx = 0;
        startIdx = wiAry.length - 1;
        inc = -1;
    }

    var firstAdjustableIdx = startIdx;

    var accumulatedToWin = 0.0;
    var adjustedRisk;

    var maxRiskAmt = 0.0;

    for (var i = startIdx;; i += inc) {
        adjustedRisk = wiAry[i].RiskAmt;
        adjustedRisk -= accumulatedToWin;
        if (adjustedRisk > maxRiskAmt) {
            maxRiskAmt = adjustedRisk;
        }
        if (i < firstAdjustableIdx) {
            accumulatedToWin += wiAry[i].ToWinAmt;
        }
        if (i == endIdx) {
            break;
        }
    }

    return maxRiskAmt;

};