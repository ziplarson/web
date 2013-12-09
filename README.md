
// session object's date
new Date(JSON.parse(f.session).lastAccess)


var INTEGER_REGEXP = /^\-?\d*$/;
var FLOAT_REGEXP = /^\-?\d+((\.|\,)\d+)?$/;

var _s = null;
var _u = null;

function initall() {
    _u = db.getMongo().getDB('users').getCollection('users');
    _s = db.getMongo().getDB('session').getCollection('sessions');
}

function resetall() {
   _u.remove();
   _s.remove();
}

mongodb://localhost:21191/session?maxPoolSize=3&w=majority&readPreference=primary&slaveOk=false&fsync=true

// pwd strength
// TODO clean-up needed to remove it from old page context; also, add credits to developer or do use it as sample and do own

#scorebar {
    background-image: url(../images/bg_strength_gradient.jpg);
    background-repeat: no-repeat;
    background-position: 0 0;
    position:absolute;
    width: 100px;
    z-index: 0;
}
#scorebarBorder {
    background: #333;
    border: 1px #000 solid;
    height: 16px;
    margin-bottom: 2px;
    width: 100px;
}
    <div id="scorebarBorder">
        <div id="score">0%</div>
        <div id="scorebar" style="background-position: 0">&nbsp;</div>


    </div>

function passwordStrength(pwd) {
    var oScorebar = $("scorebar");
    var oScore = '0';
    var oComplexity = '?';
    var nScore = 0, nLength = 0, nAlphaUC = 0, nAlphaLC = 0, nNumber = 0, nSymbol = 0, nMidChar = 0, nRequirements = 0, nAlphasOnly = 0, nNumbersOnly = 0, nUnqChar = 0, nRepChar = 0, nRepInc = 0, nConsecAlphaUC = 0, nConsecAlphaLC = 0, nConsecNumber = 0, nConsecSymbol = 0, nConsecCharType = 0, nSeqAlpha = 0, nSeqNumber = 0, nSeqSymbol = 0, nSeqChar = 0, nReqChar = 0, nMultConsecCharType = 0;
    var nMultRepChar = 1, nMultConsecSymbol = 1;
    var nMultMidChar = 2, nMultRequirements = 2, nMultConsecAlphaUC = 2, nMultConsecAlphaLC = 2, nMultConsecNumber = 2;
    var nReqCharType = 3, nMultAlphaUC = 3, nMultAlphaLC = 3, nMultSeqAlpha = 3, nMultSeqNumber = 3, nMultSeqSymbol = 3;
    var nMultLength = 4, nMultNumber = 4;
    var nMultSymbol = 6;
    var nTmpAlphaUC = "", nTmpAlphaLC = "", nTmpNumber = "", nTmpSymbol = "";
    var sAlphaUC = "0", sAlphaLC = "0", sNumber = "0", sSymbol = "0", sMidChar = "0", sRequirements = "0", sAlphasOnly = "0", sNumbersOnly = "0", sRepChar = "0", sConsecAlphaUC = "0", sConsecAlphaLC = "0", sConsecNumber = "0", sSeqAlpha = "0", sSeqNumber = "0", sSeqSymbol = "0";
    var sAlphas  =  "abcdefghijklmnopqrstuvwxyz";
    var sNumerics  =  "01234567890";
    var sSymbols  =  ")!@#$%^&*()";
    var sComplexity  =  "Too Short";
    var sStandards  =  "Below";
    var nMinPwdLen  =  8;
    var nd = 1;
    var s = 0;
    if (document.all) { nd = 0; }
    if (pwd) {
        nScore = parseInt(pwd.length * nMultLength, 10);
        nLength = pwd.length;
        var arrPwd = pwd.replace(/\s+/g, "").split(/\s*/);
        var arrPwdLen = arrPwd.length;
        var a = 0;
        for (a = 0; a < arrPwdLen; a++) {
            if (arrPwd[a].match(/[A-Z]/g)) {
                if (nTmpAlphaUC !== "") { if ((nTmpAlphaUC + 1) == a) { nConsecAlphaUC++; nConsecCharType++; } }
                nTmpAlphaUC = a;
                nAlphaUC++;
            }
            else if (arrPwd[a].match(/[a-z]/g)) {
                if (nTmpAlphaLC !== "") { if ((nTmpAlphaLC + 1) == a) { nConsecAlphaLC++; nConsecCharType++; } }
                nTmpAlphaLC = a;
                nAlphaLC++;
            }
            else if (arrPwd[a].match(/[0-9]/g)) {
                if (a > 0 && a < (arrPwdLen - 1)) { nMidChar++; }
                if (nTmpNumber !== "") { if ((nTmpNumber + 1) == a) { nConsecNumber++; nConsecCharType++; } }
                nTmpNumber = a;
                nNumber++;
            }
            else if (arrPwd[a].match(/[^a-zA-Z0-9_]/g)) {
                if (a > 0 && a < (arrPwdLen - 1)) { nMidChar++; }
                if (nTmpSymbol !== "") { if ((nTmpSymbol + 1) == a) { nConsecSymbol++; nConsecCharType++; } }
                nTmpSymbol = a;
                nSymbol++;
            }
            /* Internal loop through password to check for repeat characters */
            var bCharExists = false;
            for (var b=0; b < arrPwdLen; b++) {
                if (arrPwd[a] == arrPwd[b] && a != b) { /* repeat character exists */
                    bCharExists = true;
                    /*
                     Calculate icrement deduction based on proximity to identical characters
                     Deduction is incremented each time a new match is discovered
                     Deduction amount is based on total password length divided by the
                     difference of distance between currently selected match
                     */
                    nRepInc += Math.abs(arrPwdLen/(b-a));
                }
            }
            if (bCharExists) {
                nRepChar++;
                nUnqChar = arrPwdLen-nRepChar;
                nRepInc = (nUnqChar) ? Math.ceil(nRepInc/nUnqChar) : Math.ceil(nRepInc);
            }
        }

        /* Check for sequential alpha string patterns (forward and reverse) */
        var sFwd;
        var sRev;
        for (s = 0; s < 23; s++) {
            sFwd = sAlphas.substring(s,parseInt(s+3,10));
            sRev = sFwd.strReverse();
            if (pwd.toLowerCase().indexOf(sFwd) !== -1 || pwd.toLowerCase().indexOf(sRev) !== -1) { nSeqAlpha++; nSeqChar++;}
        }

        /* Check for sequential numeric string patterns (forward and reverse) */
        for (s = 0; s < 8; s++) {
            sFwd = sNumerics.substring(s,parseInt(s+3,10));
            sRev = sFwd.strReverse();
            if (pwd.toLowerCase().indexOf(sFwd) !== -1 || pwd.toLowerCase().indexOf(sRev) !== -1) { nSeqNumber++; nSeqChar++;}
        }

        /* Check for sequential symbol string patterns (forward and reverse) */
        for (s = 0; s < 8; s++) {
            sFwd = sSymbols.substring(s,parseInt(s+3));
            sRev = sFwd.strReverse();
            if (pwd.toLowerCase().indexOf(sFwd) !== -1 || pwd.toLowerCase().indexOf(sRev) !== -1) { nSeqSymbol++; nSeqChar++;}
        }

        /* Modify overall score value based on usage vs requirements */

        /* General point assignment */
//        $("nLengthBonus").innerHTML = "+ " + nScore;
        if (nAlphaUC > 0 && nAlphaUC < nLength) {
            nScore = parseInt(nScore + ((nLength - nAlphaUC) * 2),10);
            sAlphaUC = "+ " + parseInt((nLength - nAlphaUC) * 2,10);
        }
        if (nAlphaLC > 0 && nAlphaLC < nLength) {
            nScore = parseInt(nScore + ((nLength - nAlphaLC) * 2),10);
            sAlphaLC = "+ " + parseInt((nLength - nAlphaLC) * 2,10);
        }
        if (nNumber > 0 && nNumber < nLength) {
            nScore = parseInt(nScore + (nNumber * nMultNumber),10);
            sNumber = "+ " + parseInt(nNumber * nMultNumber,10);
        }
        if (nSymbol > 0) {
            nScore = parseInt(nScore + (nSymbol * nMultSymbol),10);
            sSymbol = "+ " + parseInt(nSymbol * nMultSymbol,10);
        }
        if (nMidChar > 0) {
            nScore = parseInt(nScore + (nMidChar * nMultMidChar),10);
            sMidChar = "+ " + parseInt(nMidChar * nMultMidChar,10);
        }
//        $("nAlphaUCBonus").innerHTML = sAlphaUC;
//        $("nAlphaLCBonus").innerHTML = sAlphaLC;
//        $("nNumberBonus").innerHTML = sNumber;
//        $("nSymbolBonus").innerHTML = sSymbol;
//        $("nMidCharBonus").innerHTML = sMidChar;

        /* Point deductions for poor practices */
        if ((nAlphaLC > 0 || nAlphaUC > 0) && nSymbol === 0 && nNumber === 0) {  // Only Letters
            nScore = parseInt(nScore - nLength,10);
            nAlphasOnly = nLength;
            sAlphasOnly = "- " + nLength;
        }
        if (nAlphaLC === 0 && nAlphaUC === 0 && nSymbol === 0 && nNumber > 0) {  // Only Numbers
            nScore = parseInt(nScore - nLength,10);
            nNumbersOnly = nLength;
            sNumbersOnly = "- " + nLength;
        }
        if (nRepChar > 0) {  // Same character exists more than once
            nScore = parseInt(nScore - nRepInc,10);
            sRepChar = "- " + nRepInc;
        }
        if (nConsecAlphaUC > 0) {  // Consecutive Uppercase Letters exist
            nScore = parseInt(nScore - (nConsecAlphaUC * nMultConsecAlphaUC));
            sConsecAlphaUC = "- " + parseInt(nConsecAlphaUC * nMultConsecAlphaUC);
        }
        if (nConsecAlphaLC > 0) {  // Consecutive Lowercase Letters exist
            nScore = parseInt(nScore - (nConsecAlphaLC * nMultConsecAlphaLC));
            sConsecAlphaLC = "- " + parseInt(nConsecAlphaLC * nMultConsecAlphaLC);
        }
        if (nConsecNumber > 0) {  // Consecutive Numbers exist
            nScore = parseInt(nScore - (nConsecNumber * nMultConsecNumber));
            sConsecNumber = "- " + parseInt(nConsecNumber * nMultConsecNumber);
        }
        if (nSeqAlpha > 0) {  // Sequential alpha strings exist (3 characters or more)
            nScore = parseInt(nScore - (nSeqAlpha * nMultSeqAlpha));
            sSeqAlpha = "- " + parseInt(nSeqAlpha * nMultSeqAlpha);
        }
        if (nSeqNumber > 0) {  // Sequential numeric strings exist (3 characters or more)
            nScore = parseInt(nScore - (nSeqNumber * nMultSeqNumber));
            sSeqNumber = "- " + parseInt(nSeqNumber * nMultSeqNumber);
        }
        if (nSeqSymbol > 0) {  // Sequential symbol strings exist (3 characters or more)
            nScore = parseInt(nScore - (nSeqSymbol * nMultSeqSymbol));
            sSeqSymbol = "- " + parseInt(nSeqSymbol * nMultSeqSymbol);
        }
//        $("nAlphasOnlyBonus").innerHTML = sAlphasOnly;
//        $("nNumbersOnlyBonus").innerHTML = sNumbersOnly;
//        $("nRepCharBonus").innerHTML = sRepChar;
//        $("nConsecAlphaUCBonus").innerHTML = sConsecAlphaUC;
//        $("nConsecAlphaLCBonus").innerHTML = sConsecAlphaLC;
//        $("nConsecNumberBonus").innerHTML = sConsecNumber;
//        $("nSeqAlphaBonus").innerHTML = sSeqAlpha;
//        $("nSeqNumberBonus").innerHTML = sSeqNumber;
//        $("nSeqSymbolBonus").innerHTML = sSeqSymbol;

        /* Determine if mandatory requirements have been met and set image indicators accordingly */
        var arrChars = [nLength,nAlphaUC,nAlphaLC,nNumber,nSymbol];
        var arrCharsIds = ["nLength","nAlphaUC","nAlphaLC","nNumber","nSymbol"];
        var arrCharsLen = arrChars.length;
        for (var c=0; c < arrCharsLen; c++) {
            var oImg = $('div_' + arrCharsIds[c]);
            var oBonus = $(arrCharsIds[c] + 'Bonus');
            $(arrCharsIds[c]).innerHTML = arrChars[c];
            if (arrCharsIds[c] === "nLength") { var minVal = parseInt(nMinPwdLen - 1); } else { var minVal = 0; }
            if (arrChars[c] == parseInt(minVal + 1)) { nReqChar++; oImg.className = "pass"; oBonus.parentNode.className = "pass"; }
            else if (arrChars[c] > parseInt(minVal + 1)) { nReqChar++; oImg.className = "exceed"; oBonus.parentNode.className = "exceed"; }
            else { oImg.className = "fail"; oBonus.parentNode.className = "fail"; }
        }
        nRequirements = nReqChar;
        if (pwd.length >= nMinPwdLen) { var nMinReqChars = 3; } else { var nMinReqChars = 4; }
        if (nRequirements > nMinReqChars) {  // One or more required characters exist
            nScore = parseInt(nScore + (nRequirements * 2));
            sRequirements = "+ " + parseInt(nRequirements * 2);
        }
//        $("nRequirementsBonus").innerHTML = sRequirements;

        /* Determine if additional bonuses need to be applied and set image indicators accordingly */
        var arrChars = [nMidChar,nRequirements];
        var arrCharsIds = ["nMidChar","nRequirements"];
        var arrCharsLen = arrChars.length;
        for (var c=0; c < arrCharsLen; c++) {
            var oImg = $('div_' + arrCharsIds[c]);
            var oBonus = $(arrCharsIds[c] + 'Bonus');
//            $(arrCharsIds[c]).innerHTML = arrChars[c];
            if (arrCharsIds[c] == "nRequirements") { var minVal = nMinReqChars; } else { var minVal = 0; }
            if (arrChars[c] == parseInt(minVal + 1)) { oImg.className = "pass"; oBonus.parentNode.className = "pass"; }
            else if (arrChars[c] > parseInt(minVal + 1)) { oImg.className = "exceed"; oBonus.parentNode.className = "exceed"; }
            else { oImg.className = "fail"; oBonus.parentNode.className = "fail"; }
        }

        /* Determine if suggested requirements have been met and set image indicators accordingly */
        var arrChars = [nAlphasOnly,nNumbersOnly,nRepChar,nConsecAlphaUC,nConsecAlphaLC,nConsecNumber,nSeqAlpha,nSeqNumber,nSeqSymbol];
        var arrCharsIds = ["nAlphasOnly","nNumbersOnly","nRepChar","nConsecAlphaUC","nConsecAlphaLC","nConsecNumber","nSeqAlpha","nSeqNumber","nSeqSymbol"];
        var arrCharsLen = arrChars.length;
        for (var c=0; c < arrCharsLen; c++) {
            var oImg = $('div_' + arrCharsIds[c]);
            var oBonus = $(arrCharsIds[c] + 'Bonus');
//            $(arrCharsIds[c]).innerHTML = arrChars[c];
            if (arrChars[c] > 0) { oImg.className = "warn"; oBonus.parentNode.className = "warn"; }
            else { oImg.className = "pass"; oBonus.parentNode.className = "pass"; }
        }

        /* Determine complexity based on overall score */
        if (nScore > 100) { nScore = 100; } else if (nScore < 0) { nScore = 0; }
        if (nScore >= 0 && nScore < 20) { sComplexity = "Very Weak"; }
        else if (nScore >= 20 && nScore < 40) { sComplexity = "Weak"; }
        else if (nScore >= 40 && nScore < 60) { sComplexity = "Good"; }
        else if (nScore >= 60 && nScore < 80) { sComplexity = "Strong"; }
        else if (nScore >= 80 && nScore <= 100) { sComplexity = "Very Strong"; }

        /* Display updated score criteria to client */
        oScorebar.style.backgroundPosition = "-" + parseInt(nScore * 4) + "px";
        oScore.innerHTML = nScore + "%";
        oComplexity.innerHTML = sComplexity;
    }
    else {
        /* Display default score criteria to client */
//        initPwdChk();
        oScore.innerHTML = nScore + "%";
        oComplexity.innerHTML = sComplexity;
    }
}
