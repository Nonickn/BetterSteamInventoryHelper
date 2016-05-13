// This script written by VplGhost
// Email: vplghost@gmail.com


var sCommon = document.createElement('script');
sCommon.src = chrome.extension.getURL('js/invites.script.min.js');
(document.head || document.documentElement).appendChild(sCommon);
sCommon.onload = function () {
    sCommon.parentNode.removeChild(sCommon);
};

var expId = /javascript:FriendAccept\( '(\d+)', 'accept' \)/;
var timeStamp = parseInt(new Date().getTime() / 1000);
var getSteamRep = function (id, parent) {
    var div = $('<div class="rep"><div class="profile-info"></div><div class="ban-info"></div></div>');
    $.ajax({
        url: 'http://steamrep.com/util.php',
        data: {
            op: 'getSteamProfileInfo',
            id: id,
            tm: timeStamp
        },
        success: function (res) {
            if (res && !res.error) {
                parent.data('steamlvl', res.steamlevel);
                var cdiv = div.find('.profile-info');
                cdiv.append('<div>Joined Steam: <strong>' + res.membersince + '</strong></div>');
                cdiv.append('<div>Steam Level: <strong>' + res.steamlevel + '</strong></div>');
                cdiv.append('<div>Online Status: <strong>' + res.onlinestate + '</strong></div>');
                cdiv.append('<div>Profile privacy: <strong>' + res.privacystate + '</strong></div>');
                cdiv.append('<div>' + res.identityblock.replace(/\n/g, '<br />') + '</strong></div>');
                cdiv.show();
            }
        }
    });

    $.ajax({
        url: 'http://steamrep.com/util.php',
        data: {
            op: 'getSteamBanInfo',
            id: id,
            tm: timeStamp
        },
        success: function (res) {
            if (res && !res.error) {
                var cdiv = div.find('.ban-info');
                cdiv.append('<div>Trade Ban: <strong>' + res.tradebanstate + '</strong></div>');
                cdiv.append('<div>VAC Ban: <strong>' + res.vacbanned + '</strong></div>');
                cdiv.append('<div>Community Ban: <strong>' + res.communitybanned + '</strong></div>');
                if (res.caution) {
                    cdiv.addClass('caution');
                }
                if (res.scammer) {
                    cdiv.addClass('warning');
                }
                cdiv.show();
            }
        }
    });

    parent.append(div);
}
$(function () {
    chrome.storage.sync.get({
        steamrep: true
    }, function (items) {
        if (items.steamrep) {
            $('.invite_row').each(function () {
                $this = $(this);
                var href = $this.find('.acceptDeclineBlock a.linkStandard:first-child').attr('href');
                var m = expId.exec(href);
                if (m) {
                    getSteamRep(m[1], $this);
                    $this.data('steamID', m[1]);
                }
            });
        }
    });

});

var cssF = document.createElement('link');
cssF.href = chrome.extension.getURL('css/invites.css');
cssF.rel = 'stylesheet';
cssF.type = 'text/css';
(document.head || document.documentElement).appendChild(cssF);