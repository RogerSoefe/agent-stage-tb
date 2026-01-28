function TranslatorApi($http, $rootScope) {

	var caller = new ServiceCaller($http, null, 'translatorService');
	const _gbAppVersion = '20200205';
	var dataFolder = '/lang/ag/';
	var translatorService = {
		DefaultLanguage: SETTINGS.DefaultLanguage,
		LearningMode: SETTINGS.TextLearningModeOn,
		_currentLang: SETTINGS.DefaultLanguage,
		_translations: {},
		TranslationFileSufix: SETTINGS.TranlationFileSufix
	};

	//Public Methods
	//Document_Function
	translatorService.ChangeLanguage = function (newLang) {
		if (translatorService._currentLang == newLang) return;
		translatorService._currentLang = newLang;
		_LoadLanguage();
	};

	//Document_Function
	translatorService.Translate = function (text) {
		if (!text || translatorService._translations == null) return text;
		var safeText = _MakeTextSafeToTranslate(text);
		var txt = _GetTranslation(safeText);
		if (txt && txt != "[NT]") return txt;
		else {
			if (translatorService.LearningMode && txt == "[NT]") {
				//translatorService._translations[safeText] = "[NT]";
				text = "[" + text + "]";
			}
			else if (translatorService.LearningMode) {
				_AddTextToTranslate(safeText);
				text = "[" + text + "*NEW*]";

			}
			return text.replace('_', ' ');
		}
	};

	translatorService.SaveLearnedTexts = function () {
		_SaveTranslations();
	};

	translatorService.GetLanguages = function () {
		return caller.GET('/lang/LangFiles.json?v=' + _gbAppVersion);
	};

	//Private Methods

	var _AddTextToTranslate = function (text) {
		translatorService._translations[text] = "[NT]";
	};

	var _GetTranslation = function (text) {
		var txt = translatorService._translations[text];
		if (txt || txt == "[NT]") return txt;
		txt = translatorService._translations[text.toUpperCase()];
		return txt;
	};

	//Document_Function
	var _LoadLanguage = function () {
		caller.GET(dataFolder + translatorService._currentLang + '.json').then(function (response) {
			translatorService._translations = response.data;
		});
	};

	//Document_Function
	var _MakeTextSafeToTranslate = function (text) {
		var translatedName;
		var firstChar;
		text = text.replace(/ /g, "_").replace(".5", "H").replace(/½/g, "H").replace(/-/g, "_").toUpperCase();
		firstChar = text.charAt(0);
		if (/^([0-9])$/.test(firstChar)) {
			translatedName = text.replace(firstChar, CommonFunctions.SubstituteDigitByLetter(firstChar));
		} else {
			translatedName = text;
		}
		return (translatedName || '').trim();
	};

	var _SaveTranslations = function () {
		caller.POST({ 'lang': translatorService._currentLang + translatorService.TranslationFileSufix, 'json': JSON.stringify(translatorService._translations) }, "SaveTranslations").then();
	};

	//Document_Function
	_LoadLanguage();

	return translatorService;

}

if (typeof appModule != "undefined")
	appModule.factory('$translatorService', ['$http', '$rootScope', TranslatorApi]);
else if (typeof loginModule != "undefined")
	loginModule.factory('$translatorService', ['$http', '$rootScope', TranslatorApi || {}]);