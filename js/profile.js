
var cssF = document.createElement('link');
cssF.href = chrome.extension.getURL('css/profiles.css');
cssF.rel = 'stylesheet';
cssF.type = 'text/css';
(document.head || document.documentElement).appendChild(cssF);

var sProfile = document.createElement('script');
sProfile.src = chrome.extension.getURL('js/profile.script.min.js');
(document.head || document.documentElement).appendChild(sProfile);
sProfile.onload = function () {
    sProfile.parentNode.removeChild(sProfile);
};
