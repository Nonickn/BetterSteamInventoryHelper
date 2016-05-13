// This script written by VplGhost
// Email: vplghost@gmail.com

var sGen = document.createElement('script');
sGen.src = chrome.extension.getURL('js/lang/_gen.js');
(document.head || document.documentElement).appendChild(sGen);
sGen.onload = function () {
    sGen.parentNode.removeChild(sGen);
};

var cssM = document.createElement('link');
cssM.href = window.location.protocol + '//steamcommunity-a.akamaihd.net/public/css/skin_1/economy_market.css';
cssM.rel = 'stylesheet';
cssM.type = 'text/css';
(document.head || document.documentElement).appendChild(cssM);

chrome.storage.sync.get({
    lang: ''
}, function (items) {

    var sLang = document.createElement('script');
    if (items.lang == '')
        sLang.src = chrome.extension.getURL('js/lang/' + chrome.i18n.getMessage("langcode") + '.js');
    else
        sLang.src = chrome.extension.getURL('js/lang/' + items.lang + '.js');

    (document.head || document.documentElement).appendChild(sLang);
    sLang.onload = function () {
        sLang.parentNode.removeChild(sLang);
    };
});

var sOffer = document.createElement('script');
sOffer.src = chrome.extension.getURL('js/badge.script.min.js');
(document.head || document.documentElement).appendChild(sOffer);
sOffer.onload = function () {
    sOffer.parentNode.removeChild(sOffer);
};

var sModal = document.createElement('script');
sModal.src = 'http://steamcommunity-a.akamaihd.net/public/javascript/modalv2.js?v=xM3yIvzXuMtB&amp;l=english';
(document.head || document.documentElement).appendChild(sModal);
sModal.onload = function () {
    sModal.parentNode.removeChild(sModal);
};