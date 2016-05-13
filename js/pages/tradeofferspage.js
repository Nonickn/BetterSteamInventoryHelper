var steamOfferExp = /<div class="link_overlay" onclick="ShowTradeOffer\( '(\d+)' \);"><\/div>[\s\S]+?<img src="(.+)">[\s\S]+?">([\s\S]+?)[：:]/g;
var imgExp = /<img src="http:\/\/steamcommunity-a.akamaihd.net\/economy\/image\/[^"]+(\d{2})f".+>/g;
var sessionIDJSExp = /g_sessionID = \"(.+)\";/;
var sessionID = '';
var _tradesTimers = {};
var _openedWins = {};

chrome.storage.sync.get({
    quickaccept: false,
    quickacceptprompt: true,
    ck_hidebanner: false,
    qadelay: 10
}, function (items) {
    window.quickaccept = items.quickaccept;
    window.quickacceptprompt = items.quickacceptprompt;
    window.qadelay = items.qadelay;
    if (items.ck_hidebanner) {
        $('.sponsor').hide();
    }
});

$(function () {
    $.ajax({
        method: "GET",
        url: 'http://steamcommunity.com/id/temp/tradeoffers/',
        success: function (response, textStatus, jqXHR) {
            var res = response;

            sessionID = sessionIDJSExp.exec(res);
            if (sessionID) sessionID = sessionID[1];
            var bodyIdx = [res.indexOf('<body class="flat_page responsive_page">'), res.indexOf('</body>')];
            var resHTML = res.substr(bodyIdx[0] + 40, bodyIdx[1] - bodyIdx[0] - 40);
            var $body = $(resHTML);
            var $tradeoffers = $body.find('.tradeoffer');
            //console.log('Get offers done');
            $('#Div_Offers').html('');
            var lastOId = null;
            var m, im;
            var imgs = new Array();
            var lastI = 0;
            var haveOffers = false;
            var num = 0;
            var imstrTheirs = '', imstrYours = '';
            var lastDiv = null;

            $tradeoffers.each(function (i, o) {
                var $tradeoffer = $(this);
                if ($tradeoffer.find('.link_overlay').length == 0) return;
                var partnerImg = $tradeoffer.find('.tradeoffer_partner .playerAvatar img').prop('src');
                var offerID = $tradeoffer.prop('id').substr(13);
                var header = $tradeoffer.find('.tradeoffer_header').text();
                var tradeofferdiv = nofSteam(offerID, partnerImg, header);
                var imgTheirs = $tradeoffer.find('.tradeoffer_items.primary .tradeoffer_item_list .trade_item img');
                var imgYours = $tradeoffer.find('.tradeoffer_items.secondary .tradeoffer_item_list .trade_item img');

                imgTheirs.each(function () {
                    var orgSrc = $(this).prop('src');
                    $(this).prop('src', orgSrc.replace(/96fx96f/g, '48fx48f'));
                    orgSrc = $(this).prop('srcset');
                    $(this).prop('srcset', orgSrc.replace(/96fx96f/g, '48fx48f'));
                });
                imgYours.each(function () {
                    var orgSrc = $(this).prop('src');
                    $(this).prop('src', orgSrc.replace(/73fx73f/g, '32fx32f'));
                    orgSrc = $(this).prop('srcset');
                    $(this).prop('srcset', orgSrc.replace(/73fx73f/g, '32fx32f'));
                });

                tradeofferdiv.find('.offer-theirs').append(imgTheirs);
                tradeofferdiv.find('.offer-yours').append(imgYours);
                $('#Div_Offers').append(tradeofferdiv);
                num++;
            });

            /*
            while (im = imgExp.exec(res)) {
                imgs.push(im);
            }
            console.log(imgs);
            while (m = steamOfferExp.exec(res)) {
                imstrTheirs = '', imstrYours = '';
                while (imgs[lastI].index < m.index) {
                    if (imgs[lastI][1] == '96')
                        imstrTheirs += imgs[lastI][0].replace(/96fx96f/g, '32fx32f');
                    else
                        imstrYours += imgs[lastI][0].replace(/73fx73f/g, '32fx32f');
                    lastI++;
                }
                if (lastDiv) {
                    lastDiv.find('.offer-theirs').append(imstrTheirs);
                    lastDiv.find('.offer-yours').append(imstrYours);
                }
                num++;
                lastDiv = nofSteam(m[1], m[2], m[3]);
            }

            imstrTheirs = '', imstrYours = '';
            while (lastI < imgs.length) {
                if (imgs[lastI][1] == '96')
                    imstrTheirs += imgs[lastI][0].replace(/96fx96f/g, '32fx32f');
                else
                    imstrYours += imgs[lastI][0].replace(/73fx73f/g, '32fx32f');
                lastI++;
            }

            if (lastDiv) {
                lastDiv.find('.offer-theirs').append(imstrTheirs);
                lastDiv.find('.offer-yours').append(imstrYours);
            }
            */
            if (num > 0) {
                $('#Div_Offers').prepend('<div style="margin-bottom:20px;">You have ' + num + ' trade offer(s)<br /> <a href="#" id="lnk_openall">Open all</a> <a href="#" id="lnk_declineall">Decline all</a> </div>');
                $('#lnk_openall').click(function () {
                    openAll();
                    return false;
                });
                $('#lnk_declineall').click(function () {
                    if (confirm('Are you sure?')) {
                        declineAll();
                    }
                    return false;
                });
                chrome.browserAction.setBadgeText({ text: "" + num });
            }
            else {
                $('#Div_Offers').prepend('<div style="margin-bottom:20px;">You don\'t have any trade offer</div>');
                chrome.browserAction.setBadgeText({ text: "" });
            }
        }
    });
    chrome.browserAction.setPopup({
        popup: "html/tradeoffers.html"
    });
});
var lastleft = 0, lasttop = 0;
var nofSteam = function (idOffer, img, name) {
    name = name.trim();
    name = name.replace(/<span.+?>/g, '').replace(/<\/span>/g, '');
    var path = img.replace('.jpg', '_medium.jpg');// chrome.runtime.getURL("/icon64.png");
    var div = $('<div class="tradeoffer" data-id="' + idOffer + '">');
    var link = $('<a href="https://steamcommunity.com/tradeoffer/' + idOffer + '/" target="_blank"><img src="' + path + '"></a>');
    var declineLink = $('<a class="decline-bt" href="#" >Decline</a>');
    var acceptLink = $('<a class="accept-bt" href="#" >Quick accept</a>');
    $(div).append('<div style="clear:both; float:none">' + name + '</div>');
    $(div).append(link);
    $(div).append('<div class="offer-theirs"></div><div>for</div><div class="offer-yours"></div><div class="clearer">&nbsp;</div>');
    $(div).append(declineLink);
    if (quickaccept) {
        $(div).append(acceptLink);
        acceptLink.click(function (e) {
            e.preventDefault();
            e.stopPropagation();

            if (_tradesTimers[idOffer]) {
                window.clearInterval(_tradesTimers[idOffer].timer);
                _tradesTimers[idOffer] = null;
                $(this).html('Quick accept');
                return false;
            }

            if (window.quickacceptprompt && !confirm('Are you sure?')) return false;

            if (window.qadelay) {
                _tradesTimers[idOffer] = {
                    timer: window.setInterval(function () { TradeAcceptTimerTick(idOffer); }, 1000),
                    remain: window.qadelay
                };
                $(this).html('Cancel (' + (window.qadelay < 10 ? '0' : '') + window.qadelay + ')');
            }
            else if (window.qadelay == 0) {
                var link = $J(this);
                link.html('Accepting...');
                link.prop('disabled', true);
                AcceptTradeOffer(idOffer);
            }
        });
    }

    $(div).append('<div class="clearer">&nbsp;</div>');
    $('#Div_Offers').append(div);
    $(declineLink).click(function (event) {
        DeclineTradeOffer(idOffer, sessionID);
        event.stopPropagation();
        return false;
    });
    $(div).click(function (e) {
        //window.open('https://steamcommunity.com/tradeoffer/' + idOffer + '/', '_blank')

        chrome.windows.create({ 'url': 'https://steamcommunity.com/tradeoffer/' + idOffer + '/', 'type': 'popup', 'left': lastleft, 'top': lasttop }, function (window) {
        });
        lastleft += 10;
        lasttop += 10;
        e.preventDefault();
    })
    return div;
}


var TradeAcceptTimerTick = function (IdTradeOffer) {
    if (!_tradesTimers[IdTradeOffer]) {
        return;
    }
    var remain = _tradesTimers[IdTradeOffer].remain;
    var link = $('.tradeoffer[data-id="' + IdTradeOffer + '"]').find('.accept-bt');
    if (remain == 0) {
        link.html('Accepting...');
        link.prop('disabled', true);
        window.clearInterval(_tradesTimers[IdTradeOffer].timer);
        AcceptTradeOffer(IdTradeOffer);
    }
    else {
        remain--;
        _tradesTimers[IdTradeOffer].remain = remain;
        link.html('Cancel (' + (remain < 10 ? '0' : '') + remain + ')');
    }
}

var AcceptTradeOffer = function (IdTradeOffer) {
    window.open('https://steamcommunity.com/tradeoffer/' + IdTradeOffer + '/?sihaccept=' + sessionID, 'HiddenTradeOffer' + IdTradeOffer, 'height=10,width=10,resize=yes,scrollbars=yes');
    return;
}


var DeclineTradeOffer = function (tradeOfferID, g_sessionID) {
    //console.log(tradeOfferID, g_sessionID);
    var strAction = 'decline';
    return $.ajax({
        url: 'https://steamcommunity.com/tradeoffer/' + tradeOfferID + '/' + strAction,
        data: { sessionid: g_sessionID },
        type: 'POST',
        crossDomain: true,
        xhrFields: { withCredentials: true }
    }).done(function (data) {
        $('[data-id=' + tradeOfferID + ']').remove();
        var num = $('.tradeoffer[data-id]').length;
        if (null > 0)
            chrome.browserAction.setBadgeText({ text: "" + num });
        else {
            chrome.browserAction.setBadgeText({ text: "" });
        }

    }).fail(function () {

    });
}

var openAll = function () {
    lastleft = 0;
    lasttop = 0;

    $('.tradeoffer[data-id]').each(function () {
        var idoffer = $(this).data('id');
        window.open('https://steamcommunity.com/tradeoffer/' + idoffer + '/', '_blank');
        //chrome.windows.create({ 'url': 'https://steamcommunity.com/tradeoffer/' + idoffer + '/', 'type': 'popup', 'left': lastleft, 'top': lasttop }, function (window) {
        //});
        //lastleft += 10;
        //lasttop += 10;
    });
}

var declineAll = function () {

    $('.tradeoffer[data-id]').each(function () {
        var idoffer = $(this).data('id');
        DeclineTradeOffer(idoffer, sessionID);
    });

}