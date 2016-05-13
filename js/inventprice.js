// This script written by VplGhost
// Email: vplghost@gmail.com

var sGen = document.createElement('script');
sGen.src = chrome.extension.getURL('js/lang/_gen.js');
(document.head || document.documentElement).appendChild(sGen);
sGen.onload = function () {
    sGen.parentNode.removeChild(sGen);
};

var sPriceQueue = document.createElement('script');
sPriceQueue.src = chrome.extension.getURL('js/PriceQueue.js');
(document.head || document.documentElement).appendChild(sPriceQueue);
sPriceQueue.onload = function () {
    sPriceQueue.parentNode.removeChild(sPriceQueue);
};


var cssPQ = document.createElement('link');
cssPQ.href = chrome.extension.getURL('css/priceQueue.css');
cssPQ.rel = 'stylesheet';
cssPQ.type = 'text/css';
(document.head || document.documentElement).appendChild(cssPQ);

var sCommon = document.createElement('script');
sCommon.src = chrome.extension.getURL('js/inventprice.script.min.js');
(document.head || document.documentElement).appendChild(sCommon);
sCommon.onload = function () {
    sCommon.parentNode.removeChild(sCommon);
};

var sScroll = document.createElement('script');
sScroll.src = chrome.extension.getURL('js/jquery.scrollbar.min.js');
(document.head || document.documentElement).appendChild(sScroll);
sScroll.onload = function () {
    sScroll.parentNode.removeChild(sScroll);
};

var cssF = document.createElement('link');
cssF.href = chrome.extension.getURL('css/inventscript.css');
cssF.rel = 'stylesheet';
cssF.type = 'text/css';
(document.head || document.documentElement).appendChild(cssF);

var cssM = document.createElement('link');
cssM.href = window.location.protocol + '//steamcommunity-a.akamaihd.net/public/css/skin_1/economy_market.css';
cssM.rel = 'stylesheet';
cssM.type = 'text/css';
(document.head || document.documentElement).appendChild(cssM);

var cssC = document.createElement('link');
cssC.href = chrome.extension.getURL('css/jquery.scrollbar.css');
cssC.rel = 'stylesheet';
cssC.type = 'text/css';
(document.head || document.documentElement).appendChild(cssC);

chrome.storage.sync.get({
    fastdelta: -0.01,
    delaylistings: 200,
    quicksellbuttons: true,
    buysetbuttons: true,
    currency: '',
    lang: '',
    apikey: '',
    gpdelayscc: 2500,
    gpdelayerr: 5000,
    agp_hover: true,
    agp_gem: true,
    agp_sticker: true,
    usevector: false,
    simplyinvent: false,
    hidedefaultprice: false,
    extprice: true,
    extmasslisting: false,
    extbgcolor: '#0000FF',
    exttextcolor: '#FFFFFF'
}, function (items) {
    var actualCode = ['window.fastdelta = ' + items.fastdelta + ';',
        'window.delaylistings = ' + items.delaylistings + ';',
        'window.quicksellbuttons = ' + items.quicksellbuttons + ';',
        'window.buysetbuttons = ' + items.buysetbuttons + ';',
        'window.usevector = ' + items.usevector + ';',
        'window.currency = \'' + items.currency + '\';',
        'window._apikey = \'' + items.apikey + '\';',
        'window.hidedefaultprice = ' + items.hidedefaultprice + ';',
        'window.simplyinvent = \'' + items.simplyinvent + '\';',
        'window.gpdelayscc = ' + items.gpdelayscc + ';',
        'window.gpdelayerr = ' + items.gpdelayerr + ';',
        'window.agp_gem = ' + items.agp_gem + ';',
        'window.agp_sticker = ' + items.agp_sticker + ';',
        'window.extprice = ' + items.extprice + ';',
        'window.extmasslisting = ' + items.extmasslisting + ';',
        'window.SIHID = \'' + chrome.runtime.id + '\';'
    ].join('\r\n');
    if (items.simplyinvent)
        $('body').addClass('simple');
    modStyle({ extbgcolor: items.extbgcolor, exttextcolor: items.exttextcolor });
    var script = document.createElement('script');
    script.textContent = actualCode;
    (document.head || document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);

    var sLang = document.createElement('script');
    if (items.lang == '')
        sLang.src = chrome.extension.getURL('js/lang/' + chrome.i18n.getMessage("langcode") + '.js');
    else
        sLang.src = chrome.extension.getURL('js/lang/' + items.lang + '.js');

    (document.head || document.documentElement).appendChild(sLang);
    sLang.onload = function () {
        sLang.parentNode.removeChild(sLang);
        //ReloadLang();
    };
});
