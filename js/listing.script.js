// This script written by VplGhost
// Email: vplghost@gmail.com
var imgExp = /\<img[^\>]+src="([^"]+)"([^\>])*\>/g;
var checkFloatURL = 'https://glws.org/#';

var FraudAlert = function () {
    $J('.market_listing_row').each(function () {
        var $row = $J(this);
        var idListing = $J(this).attr('id').substring(8);
        var rgListing = g_rgListingInfo[idListing];
        var asset = null;
        if (rgListing)
            asset = g_rgListingInfo[idListing].asset;
        else
            return;

        var rgItem = g_rgAssets[asset.appid][asset.contextid][asset.id];

        if (rgItem.market_actions) {
            var elGameName = $J(this).find('.market_listing_game_name');
            var elImageHolder = $J(this).find('.market_listing_item_img_container');
            $J.each(rgItem.market_actions, function () {
                var action = this;
                var link = $J('<a class="sih-market-action" href="' + action.link.replace('%assetid%', asset.id) + '"/>').text(action.name);
                if (asset.appid == 730) {
                    var href = link.prop('href');
                    if (href.indexOf('%20') > 0) {
                        var idstr = href.substr(href.indexOf('%20') + 3);
                        link.prop('href', checkFloatURL + idstr);
                        link.text('View on glws');
                        link.prop('target', '_blank');
                    }
                    var inspectLink = $J('<a class="sih-inspect-magnifier" title="Inspect in game">&nbsp;</a>').prop('href', href);
                    elImageHolder.append(inspectLink);
                }

                console.log(asset.id);
                elGameName.after(link).after(' - ');
            });
        }

        //$J(this).find('.playerAvatar img').replaceWith(function () {
        //    return '<a href="http://steamcommunity.com/profiles/' + rgItem.owner + '" target="_blank">' + this.outerHTML + '</a>';
        //});

        if (rgItem.fraudwarnings && rgItem.fraudwarnings.length > 0) {
            var nameEl = $J(this).find('.market_listing_item_name');
            if (!nameEl.find('.sih-fraud').length)
                nameEl.html(nameEl.html() + ' <span class="sih-fraud">(warning)</red>');
            var fraudStr = '';
            $J.each(rgItem.fraudwarnings, function (idx, v) {
                fraudStr += ', ' + v;
            });
            fraudStr = fraudStr.substr(2);
            nameEl.find('.sih-fraud').text(fraudStr);
        }
        var img = '';

        if (rgItem.appid == 730) {
            for (var i = 0; i < rgItem.descriptions.length; i++) {
                var d = rgItem.descriptions[i];
                if (d.type == 'html' && d.value.startsWith('<br><div id="sticker_info" name="sticker_info" title="Sticker Details"')) {
                    var m = null;
                    console.log(d);
                    var strickersName = null;
                    if (d.value.indexOf('Sticker: ') > 0) {
                        var stickerstr = d.value.substr(d.value.indexOf('Sticker: ') + 9).replace('</center></div>', '');
                        strickersName = stickerstr.split(',');
                    }
                    var htmlVal = d.value;

                    while (m = imgExp.exec(htmlVal)) {
                        var stickerName = '';
                        if (strickersName && strickersName.length) {
                            stickerName = strickersName.shift().trim();
                        }
                        img += '<img src="' + m[1] + '" title="' + stickerName + '"/>';
                    }
                }
            }
        }

        if (img) {
            var div = $J('<div class="sih-images" />');
            div.html(img);
            $J(this).find('.sih-images').remove();
            $J(this).find('.market_listing_item_name_block').after(div);
        }

        if (window.replaceBuy) {
            if (rgListing['price'] > 0 && $J(this).find('.item_market_action_button:contains("' + SIHLang.quickbuy + '")').length == 0) {
                //console.log(rgListing);
                var quickBuyBt = $J('<a href="#" class="item_market_action_button item_market_action_button_green">' +
                            '<span class="item_market_action_button_edge item_market_action_button_left"></span>' +
                            '<span class="item_market_action_button_contents">' + SIHLang.quickbuy + '</span>' +
                            '<span class="item_market_action_button_edge item_market_action_button_right"></span>' +
                            '<span class="item_market_action_button_preload"></span></a>');
                quickBuyBt.click(function () {
                    $J(this).hide();

                    $row.find('.market_listing_buy_button').append('<img src="http://steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working...">');
                    var Subtotal = rgListing['converted_price'];
                    var FeeAmount = rgListing['converted_fee'];
                    var Total = rgListing['converted_price'] + rgListing['converted_fee'];
                    var data = {
                        sessionid: g_sessionID,
                        currency: g_rgWalletInfo['wallet_currency'],
                        subtotal: Subtotal,
                        fee: FeeAmount,
                        total: Total,
                        quantity: 1
                    };
                    $J.ajax({
                        url: 'https://steamcommunity.com/market/buylisting/' + idListing,
                        type: 'POST',
                        data: data,
                        crossDomain: true,
                        xhrFields: { withCredentials: true }
                    }).done(function (data) {
                        if ($row.is(':visible'))
                            $row.find('.market_listing_buy_button').html('Success');
                        else
                            alert('Success');
                    }).fail(function (jqxhr) {
                        $row.find('.market_listing_buy_button img').remove();
                        var data = $J.parseJSON(jqxhr.responseText);
                        if (data && data.message) {
                            $row.find('.market_listing_buy_button').html(data.message);
                            //BuyItemDialog.DisplayError(data.message);
                        }
                    });
                    return false;
                });

                AddItemHoverToElement(quickBuyBt[0], rgItem);
                $J(this).find('.market_listing_buy_button').empty();
                $J(this).find('.market_listing_buy_button').append(quickBuyBt);
            }

        }
    });
    //$J('.market_listing_action_buttons').css({ width: '200px' });
};
$J(function () {
    if (typeof (g_oSearchResults) != 'undefined' && g_oSearchResults.OnAJAXComplete) {
        g_oSearchResults.OnAJAXComplete = function () {
            g_oSearchResults.m_bLoading = false;
            FraudAlert();
        };

        if (window.noOfRows && window.noOfRows != 10) {
            g_oSearchResults.m_cPageSize = window.noOfRows;
            g_oSearchResults.GoToPage(0, true);
        }
        else
            FraudAlert();
        var btReload = $J('<a href="#" class="btn_grey_white_innerfade btn_small" accesskey="r"><span>Reload listing (alt + R)</span></a>');
        btReload.click(function () {
            g_oSearchResults.m_cMaxPages = g_oSearchResults.m_iCurrentPage + 1;
            g_oSearchResults.GoToPage(g_oSearchResults.m_iCurrentPage, true);
            return false;
        });
        if ($J('.market_listing_filter_clear_button_container').length == 0) {
            $J('#market_listing_filter_form').append('<div class="market_listing_filter_clear_button_container">');
        }
        $J('.market_listing_filter_clear_button_container').prepend(btReload);
        $J('#listings').on('click', '.sih-images img', function () {
            var link = 'http://steamcommunity.com/market/listings/730/Sticker%20%7C%20' + $J(this).prop('title');
            window.open(link, '_blank');
        });
    }

});