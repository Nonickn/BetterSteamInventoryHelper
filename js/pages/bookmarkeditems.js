var g_rgWalletInfo = { wallet_fee: 1, wallet_fee_base: 0, wallet_fee_minimum: 1, wallet_fee_percent: 0.05, wallet_publisher_fee_percent_default: 0.10, wallet_currency: 1 };

chrome.storage.sync.get({
    bookmarkscategories: null,
    lang: '',
    currency: ''
}, function (items) {
    var currency = 1;
    if (items.currency != '') {
        g_rgWalletInfo.wallet_currency = currency = items.currency;
    }
    chrome.storage.local.get({
        bookmarks: null
    }, function (subitems) {
        if (subitems.bookmarks) {

            $.each(subitems.bookmarks, function (idx) {
                var item = this;
                if (!item || !item.hashmarket || !item.img) {
                    return;
                }
                var $row = $('<div class="bookmark-row" data-cat="' + (item.cat || '') + '" data-hash="' + item.hashmarket + '" />');
                $row.append('<div class="name">' +
                    '<img src="' + item.img.replace('360fx360f', '38fx38f') + '" style="border-color: ' + item.color + ';" class="market_listing_item_img" alt="">' +
                    '<span style="color: ' + item.color + ';"><a href="http:' + '//steamcommunity.com/market/listings/' + item.hashmarket + '" title="' + item.name + '">' + item.name + '</a></span><br>' +
                    '<span>' + item.gamename + '</span>'
                    + '</div>');
                $row.append('<div class="volume"><span class="bookmark-volume">Loading</span><br /><span class="bookmark-median-price"></span></div>');
                $row.append('<div class="price"><span class="bookmark-lowest-price">Loading</span><br /><span class="bookmark-seller-price"></span></div>');
                $('#div_Cnt').append($row);

                var itemLink = "http://steamcommunity.com/market/priceoverview/?appid=" + item.appid + "&country=US&currency=" + currency
                    + "&market_hash_name=" + item.hashmarket.substring(item.hashmarket.indexOf('/') + 1);

                $.ajax({
                    method: "GET",
                    url: itemLink,
                    innerDiv: $row,
                    success: function (response) {
                        if (response.success) {
                            //cachePrices[itemLink] = new Object();
                            this.innerDiv.find('.bookmark-lowest-price').html(response.lowest_price);
                            this.innerDiv.find('.bookmark-median-price').html(response.median_price);

                            var num = getNumber(response.lowest_price);//.replace(/\&#\d+;/g, '').replace(' p&#1091;&#1073;.', '');

                            var inputValue = GetPriceValueAsInt(num);
                            var nAmount = inputValue;
                            var priceWithoutFee = null;
                            if (inputValue > 0 && nAmount == parseInt(nAmount)) {
                                // Calculate what the seller gets
                                var publisherFee = g_rgWalletInfo['wallet_publisher_fee_percent_default'];
                                var feeInfo = CalculateFeeAmount(nAmount, publisherFee);
                                nAmount = nAmount - feeInfo.fees;

                                priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
                            }
                            this.innerDiv.find('.bookmark-seller-price').html('(' + priceWithoutFee + ')');

                            if (response.volume)
                                this.innerDiv.find('.bookmark-volume').html(response.volume);
                            else
                                this.innerDiv.find('.bookmark-volume').html('');
                        }
                    }
                });
            });

        }
    });

});
$('#div_Cnt').on('click', 'a', function (e) {
    var href = $(this).prop('href');
    openWindow(href);
    e.preventDefault();
});
function openWindow(url) {
    chrome.windows.create({ 'url': url, 'type': 'normal' }, function (window) {
    });
}

function GetPriceValueAsInt(strAmount) {
    var nAmount;
    if (!strAmount) {
        return 0;
    }

    // strip the currency symbol, set commas to periods, set .-- to .00
    strAmount = strAmount.replace(GetCurrencySymbol(GetCurrencyCode(g_rgWalletInfo['wallet_currency'])), '').replace(',', '.').replace('.--', '.00');

    var flAmount = parseFloat(strAmount) * 100;
    nAmount = Math.floor(isNaN(flAmount) ? 0 : flAmount + 0.000001); // round down

    nAmount = Math.max(nAmount, 0);
    return nAmount;
}

$(function () {
    chrome.browserAction.setPopup({
        popup: "html/bookmarkeditems.html"
    });

})