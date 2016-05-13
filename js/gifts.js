// This script written by VplGhost
// Email: vplghost@gmail.com

var sGen = document.createElement('script');
sGen.src = chrome.extension.getURL('js/lang/_gen.js');
(document.head || document.documentElement).appendChild(sGen);
sGen.onload = function () {
    sGen.parentNode.removeChild(sGen);
};

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
sOffer.src = chrome.extension.getURL('js/gifts.script.min.js');
(document.head || document.documentElement).appendChild(sOffer);
sOffer.onload = function () {
    sOffer.parentNode.removeChild(sOffer);
};
