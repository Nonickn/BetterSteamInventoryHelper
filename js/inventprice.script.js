var lowestPriceWithFeeRegExp = /<span class="market_listing_price market_listing_price_with_fee">\s*(((?!Sold).)*?)\s*<\/span>/i;
var lowestPriceWithoutFeeRegExp = /<span class="market_listing_price market_listing_price_without_fee">\s*(((?!Sold).)*?)\s*<\/span>/i;
var insGemExp = /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!:).)*?): \d+<\/span><br><span style="font-size: 12px">Inscribed Gem<\/span>/gi;
var kinGemExp = /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!<).)*?)<\/span><br><span style="font-size: 12px">Kinetic Gem<\/span>/gi;
var priGemExp = /<span style="font-size: 18px; color: rgb\(\d+, \d+, \d+\)">(((?!<).)*?)<\/span><br><span style="font-size: 12px">Prismatic Gem<\/span>/gi;
var ethGemExp = /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!<).)*?)<\/span><br><span style="font-size: 12px">Ethereal Gem<\/span>/gi;
var corGemExp = /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!:).)*?): \d+<\/span><br><span style="font-size: 12px">Foulfell Shard<\/span>/gi;
var masGemExp = /<span style="font-size: 18px; color: rgb\(255, 255, 255\)">(((?!:).)*?): \d+<\/span><br><span style="font-size: 12px">Rune of the Duelist Indomitable<\/span>/gi;
var buyingExp = /javascript:BuyMarketListing\('listing', '(\d+)', (\d+), '(\d+)', '(\d+)'\)/;
var cachePrices = {};
var itemsInTrades = [];
var sellingStack = {};
var selectmode = false;
var currencyId = 1;
var sellcurrencyId = 1;
var lastSelectedItem = null;
var apiItems = {};
var dotahatteryAlias = {
    'doom_bringer': 'doom',
    'treant': 'treant_protector',
    'shadow_shaman': 'shadowshaman',
    'naga_siren': 'siren',
    'nyx_assassin': 'nerubian_assassin',
    'drow_ranger': 'drow',
    'riki': 'rikimaru',
    'templar_assassin': 'lanaya',
    'nevermore': 'shadow_fiend',
    'vengefulspirit': 'vengeful',
    'witch_doctor': 'witchdoctor',
    'gyrocopter': 'gyro',
    'tusk': 'tuskarr',
    'bloodseeker': 'blood_seeker',
    'skeleton_king': 'wraith_king'
};

if (typeof (BShouldSuppressFades) == 'undefined') {
    BShouldSuppressFades = function () { return false; };
}

var checkPrice = function () {
    var currentIdx = $J('#iteminfo0').is(':visible') ? 0 : 1;
    var name = $J('#iteminfo' + currentIdx + '_item_name').text();
    getLowestPriceHandler();
}

var reloadDes = function () {
    var sOldInfo = 'iteminfo' + iActiveSelectView;
    var elDescriptors = $(sOldInfo + '_item_descriptors');
    PopulateDescriptions(elDescriptors, g_ActiveInventory.selectedItem.descriptions);
}
var mediumPrice = 0;
var mediumName = '';
var getSetLink = function (d, sItem, isGenuine) {
    var itname = d.market_hash_name || d.value;
    //if (itname.indexOf('The ') == 0) itname = itname.substring(4);
    var setLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=570&country=' + g_strCountryCode + '&currency=' + currencyId + '&market_hash_name=' + (isGenuine ? 'Genuine%20' : '') + encodeURIComponent(itname);
    d.setLink = setLink;
    d.isinset = true;
    if (cachePrices[setLink] && cachePrices[setLink].lowestPrice) {
        d.app_data.price = cachePrices[setLink].lowestPrice;
        d.app_data.market_hash_name = cachePrices[setLink].market_hash_name;
        d.app_data.owned = cachePrices[setLink].owned;

        //d.value = '<a href="http://steamcommunity.com/market/listings/' + sItem.appid + "/" + cachePrices[setLink].market_hash_name + '" target="_blank" title="' + cachePrices[setLink].nofeePrice + '">' + d.value + ' (' + cachePrices[setLink].lowestPrice + ')</a>';
        if (sItem === g_ActiveInventory.selectedItem)
            reloadDes();
        return;
    }
    else {
        //if (itname.indexOf('The ') == 0) itname = itname.substring(4);
        cachePrices[setLink] = { market_hash_name: (isGenuine ? 'Genuine ' : '') + itname };
        //var owned = false;
        var exp = new RegExp('.*' + cachePrices[setLink].market_hash_name.replace('The ', '(The )?') + '$');
        //console.log(exp);
        $J.each(g_ActiveInventory.rgInventory, function () {
            if (exp.test(this.market_hash_name)) {
                cachePrices[setLink].market_hash_name = this.market_hash_name;
                cachePrices[setLink].owned = true;
                return false;
            }
        });
        d.app_data.market_hash_name = cachePrices[setLink].market_hash_name;
        d.app_data.owned = cachePrices[setLink].owned;
        d.value = '<a href="http://steamcommunity.com/market/listings/' + sItem.appid + "/" + cachePrices[setLink].market_hash_name + '" target="_blank" >' + d.value + '</a>';
        reloadDes();
    }

    return;
    PriceQueue.GetPrice({
        method: "GET",
        url: setLink,
        success: function (response, textStatus, jqXHR) {
            var lp = 0, nfp = 0;
            if (response.success) {
                if (response.median_price) {
                    cachePrices[this.url].lowestPrice = lp = response.lowest_price;
                    cachePrices[this.url].nofeePrice = nfp = response.median_price;
                    if (response.volume) {
                        cachePrices[itemLink].volume = response.volume;
                    }
                    if (sItem === g_ActiveInventory.selectedItem) {
                        for (var k = 0; k < sItem.descriptions.length; k++) {
                            var dd = sItem.descriptions[k];
                            if (dd.setLink == this.url) {
                                dd.app_data.price = cachePrices[this.url].lowestPrice;
                                dd.app_data.market_hash_name = cachePrices[this.url].market_hash_name;
                                dd.app_data.owned = cachePrices[this.url].owned;
                                //dd.value = '<a href="http://steamcommunity.com/market/listings/' + sItem.appid + "/" + cachePrices[this.url].market_hash_name + '" target="_blank" title="' + cachePrices[this.url].nofeePrice + '">' + dd.value + ' (' + cachePrices[this.url].lowestPrice + ')</a>';
                                break;
                            }
                        }
                        reloadDes();
                    }
                }
                else if (itname.indexOf('The ') == 0) {
                    d.market_hash_name = itname.substring(4);
                    getSetLink(d, sItem, isGenuine);
                }
            }
            else if (itname.indexOf('The ') == 0) {
                d.market_hash_name = itname.substring(4);
                getSetLink(d, sItem, isGenuine);
            }
        },
        error: function () {
            if (itname.indexOf('The ') == 0) {
                d.market_hash_name = itname.substring(4);
                getSetLink(d, sItem, isGenuine);
            }
        }
    });

}
var getMediumPrice = function (sItem) {
    if (!sItem.market_hash_name) {
        sItem.market_hash_name = sItem.name;
    }
    var itemLink = window.location.protocol + "//steamcommunity.com/market/priceoverview/?appid=" + sItem.appid + "&country=" + g_strCountryCode + "&currency=" + currencyId + "&market_hash_name=" + encodeURIComponent(sItem.market_hash_name);
    mediumName = sItem.market_hash_name;
    PriceQueue.GetPrice({
        method: "GET",
        url: itemLink,
        success: function (response) {
            if (response.success) {
                //cachePrices[itemLink] = new Object();
                mediumPrice = response.lowest_price;
            }
        }
    });

}
var getGiftPrice = function (gitem) {
    var appIdExp = /http:\/\/store.steampowered.com\/app\/(\d+)\//;
    var storeLink = gitem.actions[0].link;
    var appid = appIdExp.exec(storeLink)[1];
    $J('.dd_price').html("Loading...");
    $J.ajax({
        url: '//store.steampowered.com/api/appdetails?appids=' + appid,
        crossDomain: true,
        success: function (res) {
            if (res && res[appid] && res[appid].success) {
                var price_overview = res[appid].data.price_overview;
                var strPrice = '';
                if (price_overview.discount_percent > 0) {
                    strPrice = (price_overview.final / 100) + ' (-' + price_overview.discount_percent + ') ' + price_overview.currency;
                }
                else {
                    strPrice = (price_overview.final / 100) + ' ' + price_overview.currency;
                }
                $J('.dd_price').html(strPrice);
            }
        },
        error: function () {
            $J('.dd_price').html("Error");
        }
    });
}

var getLowestPriceHandler = function (gitem, callback) {
    var sItem = gitem || g_ActiveInventory.selectedItem;
    if (sItem.appid == 753 && sItem.actions && sItem.actions[0].link && sItem.actions[0].link.startsWith('http://store.steampowered.com/app/')) {
        //getGiftPrice(sItem);
        return;
    }
    if (!sItem.market_hash_name) {
        sItem.market_hash_name = sItem.name;
    }
    var theItemString = encodeURIComponent(name);
    // from Steam's community market website
    var appID = g_ActiveInventory.appid;
    //var marketLink = sItem.appid + '/' + sItem.market_hash_name + '/';
    //$J('.dd_price').html("Loading...");
    var isGenuine = false;
    var itemLink = window.location.protocol + "//steamcommunity.com/market/priceoverview/?appid=" + sItem.appid + "&country=" + g_strCountryCode + "&currency=" + currencyId + "&market_hash_name=" + encodeURIComponent(sItem.market_hash_name);
    var itemLinkW = window.location.protocol + "//steamcommunity.com/market/priceoverview/?appid=" + sItem.appid + "&country=" + g_strCountryCode + "&currency=" + sellcurrencyId + "&market_hash_name=" + encodeURIComponent(sItem.market_hash_name);

    var marketLink = window.location.protocol + "//steamcommunity.com/market/listings/" + sItem.appid + "/" + encodeURIComponent(sItem.market_hash_name);
    if (cachePrices[itemLink] && cachePrices[itemLink].nofeePrice) {
        sItem.nofeePrice = cachePrices[itemLink].nofeePrice;
        sItem.lowestPrice = cachePrices[itemLink].lowestPrice;
        sItem.providerName = cachePrices[itemLink].providerName;
    }
    else {
        cachePrices[itemLink] = { market_hash_name: sItem.market_hash_name, owned: true };
    }

    if (cachePrices[itemLinkW] && cachePrices[itemLinkW].nofeePrice) {
        sItem.nofeePriceW = cachePrices[itemLinkW].nofeePrice;
        sItem.lowestPriceW = cachePrices[itemLinkW].lowestPrice;
        sItem.providerName = cachePrices[itemLinkW].providerName;
    }
    else {
        cachePrices[itemLinkW] = { market_hash_name: sItem.market_hash_name, owned: true };
    }

    $J.each(sItem.tags, function () {
        //console.log((this.category == 'Quality' && this.internal_name == 'genuine'));
        isGenuine = (isGenuine || (this.category == 'Quality' && this.internal_name == 'genuine'));
        if (isGenuine) return false;
    });


    if (window.agp_gem && sItem.type !== "Rare Inscribed Gem" && sItem.appid == 570) {
        for (var i = 0; i < sItem.descriptions.length; i++) {
            var d = sItem.descriptions[i];
            //if (d.type != 'html' && d.value.indexOf('Inscribed Gem') < 0 && d.value.indexOf('Kinetic Gem') < 0 && d.value.indexOf('Prismatic Gem') < 0 && d.value.indexOf('Ethereal Gem') < 0) continue;
            if (d.app_data && !d.app_data.is_itemset_name && !d.app_data.price && !d.app_data.limited) {
                getSetLink(d, sItem, isGenuine);
            }
            if (d.insgems) {
                break;
            }

            var ematch, gidx = 0;
            d.insgems = [];

            while ((ematch = insGemExp.exec(d.value))) {
                //console.log(ematch);
                var gemLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=570&country=' + g_strCountryCode + '&currency=' + currencyId + '&market_hash_name=Inscribed ' + ematch[1];
                //var nText = ematch[0].replace('<span style="font-size: 12px">Inscribed Gem</span>', '<a href="' + gemLink + '">Inscribed Gem (Loading)</a>');
                d.insgems.push({ name: 'Inscribed ' + ematch[1] });

                PriceQueue.GetPrice({
                    method: "GET",
                    url: gemLink,
                    pars: { gemidx: gidx },
                    success: function (response, $this) {
                        var lp = 0, nfp = 0;
                        if (response.success) {
                            //cachePrices[this.url] = new Object();
                            //cachePrices[this.url].lowestPrice =
                            lp = response.lowest_price;
                            //cachePrices[this.url].nofeePrice =
                            nfp = response.median_price;

                            d.insgems[$this.gemidx].lowestPrice = lp;
                            d.insgems[$this.gemidx].nofeePrice = nfp;

                            if (sItem === g_ActiveInventory.selectedItem) {
                                reloadDes();
                            }
                        }
                    },
                    error: function () {

                    }
                });
                gidx++;
            }

            while (ematch = kinGemExp.exec(d.value)) {
                //console.log(ematch);
                var gemLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=570&country=' + g_strCountryCode + '&currency=' + currencyId + '&market_hash_name=Kinetic: ' + ematch[1];

                d.insgems.push({ name: 'Kinetic: ' + ematch[1] });

                PriceQueue.GetPrice({
                    method: "GET",
                    url: gemLink,
                    pars: { gemidx: gidx },
                    success: function (response, $this) {
                        var lp = 0, nfp = 0;
                        if (response.success) {
                            //cachePrices[this.url] = new Object();
                            //cachePrices[this.url].lowestPrice =
                            lp = response.lowest_price;
                            //cachePrices[this.url].nofeePrice =
                            nfp = response.median_price;

                            d.insgems[$this.gemidx].lowestPrice = lp;
                            d.insgems[$this.gemidx].nofeePrice = nfp;

                            if (sItem === g_ActiveInventory.selectedItem)
                                reloadDes();
                        }


                    },
                    error: function () {

                    }
                });
                gidx++;
                //console.log(gidx);
            }

            while (ematch = masGemExp.exec(d.value)) {
                //console.log(ematch);
                var gemLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=570&country=' + g_strCountryCode + '&currency=' + currencyId + '&market_hash_name=Rune%20of%20the%20Duelist%20Indomitable';
                d.insgems.push({ name: 'Rune%20of%20the%20Duelist%20Indomitable' });

                PriceQueue.GetPrice({
                    method: "GET",
                    url: gemLink,
                    pars: { gemidx: gidx },
                    success: function (response, $this) {
                        var lp = 0, nfp = 0;
                        if (response.success) {
                            //cachePrices[this.url] = new Object();
                            //cachePrices[this.url].lowestPrice =
                            lp = response.lowest_price;
                            //cachePrices[this.url].nofeePrice =
                            nfp = response.median_price;

                            d.insgems[$this.gemidx].lowestPrice = lp;
                            d.insgems[$this.gemidx].nofeePrice = nfp;

                            if (sItem === g_ActiveInventory.selectedItem)
                                reloadDes();
                        }


                    },
                    error: function () {

                    }
                });
                gidx++;
                //console.log(gidx);
            }

            while (ematch = corGemExp.exec(d.value)) {
                //console.log(ematch);
                var gemLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=570&country=' + g_strCountryCode + '&currency=' + currencyId + '&market_hash_name=Foulfell Shard';

                d.insgems.push({ name: 'Foulfell Shard' });

                PriceQueue.GetPrice({
                    method: "GET",
                    url: gemLink,
                    pars: { gemidx: gidx },
                    success: function (response, $this) {
                        var lp = 0, nfp = 0;
                        if (response.success) {
                            //cachePrices[this.url] = new Object();
                            //cachePrices[this.url].lowestPrice =
                            lp = response.lowest_price;
                            //cachePrices[this.url].nofeePrice =
                            nfp = response.median_price;

                            d.insgems[$this.gemidx].lowestPrice = lp;
                            d.insgems[$this.gemidx].nofeePrice = nfp;

                            if (sItem === g_ActiveInventory.selectedItem)
                                reloadDes();
                        }


                    },
                    error: function () {

                    }
                });
                gidx++;
                //console.log(gidx);
            }

            while (ematch = ethGemExp.exec(d.value)) {
                //console.log(ematch);
                var gemLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=570&country=' + g_strCountryCode + '&currency=' + currencyId + '&market_hash_name=Ethereal: ' + ematch[1];

                d.insgems.push({ name: 'Ethereal: ' + ematch[1] });

                PriceQueue.GetPrice({
                    method: "GET",
                    url: gemLink,
                    pars: { gemidx: gidx },
                    success: function (response, $this) {
                        var lp = 0, nfp = 0;
                        if (response.success) {
                            //cachePrices[this.url] = new Object();
                            //cachePrices[this.url].lowestPrice =
                            lp = response.lowest_price;
                            //cachePrices[this.url].nofeePrice =
                            nfp = response.median_price;

                            d.insgems[$this.gemidx].lowestPrice = lp;
                            d.insgems[$this.gemidx].nofeePrice = nfp;

                            if (sItem === g_ActiveInventory.selectedItem)
                                reloadDes();
                        }


                    },
                    error: function () {

                    }
                });
                gidx++;
                //console.log(gidx);
            }

            while (ematch = priGemExp.exec(d.value)) {
                //console.log(ematch);
                var gemLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=570&country=' + g_strCountryCode + '&currency=' + currencyId + '&market_hash_name=Prismatic: ' + ematch[1];

                d.insgems.push({ name: 'Prismatic: ' + ematch[1] });

                PriceQueue.GetPrice({
                    method: "GET",
                    url: gemLink,
                    pars: { gemidx: gidx },
                    success: function (response, $this) {
                        var lp = 0, nfp = 0;
                        if (response.success) {
                            //cachePrices[this.url] = new Object();
                            //cachePrices[this.url].lowestPrice =
                            lp = response.lowest_price;
                            //cachePrices[this.url].nofeePrice =
                            nfp = response.median_price;

                            d.insgems[$this.gemidx].lowestPrice = lp;
                            d.insgems[$this.gemidx].nofeePrice = nfp;

                            if (sItem === g_ActiveInventory.selectedItem)
                                reloadDes();
                        }


                    },
                    error: function () {

                    }
                });
                gidx++;
                //console.log(gidx);
            }

            if (gidx > 0) {
                //console.log(d);
            }
            else {
                delete d.insgems;
            }
        }
    }

    ///Temporary ignore
    if (window.agp_sticker && sItem.appid == 730) {

        for (var i = 0; i < sItem.descriptions.length; i++) {
            var d = sItem.descriptions[i];
            if (d.type == 'html' && d.value.startsWith('<br><div id="sticker_info" name="sticker_info" title="Sticker Details"') && !d.stickers) {
                d.orgvalue = d.value;
                d.isstickers = true;
                var stIdx = d.value.indexOf('<br>Sticker:');
                if (stIdx == -1 || d.stickers) break;
                var stickers = d.value.substr(stIdx + 12, d.value.length - (stIdx + 27)).split(',');
                d.stickers = [];
                for (var i2 = 0; i2 < stickers.length; i2++) {
                    d.stickers.push({ name: stickers[i2].trim() });
                    var stickerLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=730&country=' + g_strCountryCode + '&currency=' + currencyId + '&market_hash_name=Sticker | ' + stickers[i2].trim();
                    if (cachePrices[stickerLink]) {
                        d.stickers[i2].prices = cachePrices[stickerLink];
                        if (sItem === g_ActiveInventory.selectedItem)
                            reloadDes();
                    }
                    else {
                        PriceQueue.GetPrice({
                            method: "GET",
                            url: stickerLink,
                            pars: { stickeridx: i2 },
                            success: function (response, $this) {
                                var lp = 0, nfp = 0;
                                if (response.success) {
                                    //cachePrices[this.url] = new Object();
                                    //cachePrices[this.url].lowestPrice =
                                    lp = response.lowest_price;
                                    //cachePrices[this.url].nofeePrice =
                                    nfp = response.median_price;

                                    d.stickers[$this.stickeridx].prices = { lowestPrice: lp, nofeePrice: nfp };// cachePrices[this.url];

                                    if (sItem === g_ActiveInventory.selectedItem)
                                        reloadDes();
                                }
                            },
                            error: function () {

                            }
                        });
                    }
                }

            }
        }
    }

    if (!sItem.marketable) {
        //$J('.dd_price').html("Not Marketable");
        if (callback && itemLinkW == itemLink)
            callback(sItem);
        return;
    }

    if (sItem.lowestPrice) {
        PriceQueue.GenPriceDescription(sItem);

        if (callback && itemLinkW == itemLink) {
            callback(sItem);
            return;
        }
    }
    else {
        PriceQueue.GetPrice({
            method: "GET",
            url: itemLink,
            success: function (response) {
                if (response.success) {
                    //cachePrices[itemLink] = new Object();
                    cachePrices[itemLink].lowestPrice = sItem.lowestPrice = response.lowest_price;
                    cachePrices[itemLink].nofeePrice = sItem.nofeePrice = response.median_price;
                    if (response.volume) {
                        cachePrices[itemLink].volume = sItem.volume = response.volume;
                    }

                    if (response.providerName) {
                        cachePrices[itemLink].providerName = sItem.providerName = response.providerName;
                    }

                    PriceQueue.GenPriceDescription(sItem);
                    if (itemLinkW == itemLink) {
                        sItem.lowestPriceW = response.lowest_price;
                        sItem.nofeePriceW = response.median_price;
                        sItem.providerName = response.providerName;
                    }
                    //cachePrices[itemLink].market_hash_name = sItem.market_hash_name;

                    if (sItem === g_ActiveInventory.selectedItem) {
                        reloadDes();

                        $J('.dd_price').find('a').attr('href', marketLink);
                    }

                    if (callback && itemLinkW == itemLink)
                        callback(sItem);
                }
            }
        });
    }

    if (sItem.lowestPriceW) {
        if (callback) {
            callback(sItem);
        }
    }
    else if (itemLinkW != itemLink) {
        PriceQueue.GetPrice({
            method: "GET",
            url: itemLinkW,
            success: function (response) {
                if (response.success) {
                    //cachePrices[itemLink] = new Object();
                    cachePrices[itemLinkW].lowestPrice = sItem.lowestPriceW = response.lowest_price;
                    cachePrices[itemLinkW].nofeePrice = sItem.nofeePriceW = response.median_price;
                    if (response.volume) {
                        cachePrices[itemLink].volume = sItem.volume = response.volume;
                    }
                    //cachePrices[itemLink].market_hash_name = sItem.market_hash_name;

                    if (callback)
                        callback(sItem);
                }
            }
        });
    }
}

var selectSimilar = function (classid) {
    if (!selectmode)
        $J('#Lnk_Sellmulti').trigger('click');
    $J('.inventory_ctn:visible .inventory_page .item').each(function (i, el) {
        if (this.rgItem.marketable && this.rgItem.classid == classid) {
            g_ActiveInventory.LoadItemImage(this);
            $J(this).addClass('selectedSell');
        }
    });

    var itC = $J('.selectedSell').length;
    if (itC > 0) {
        $J('#Lnk_ShowSellMulti .item_market_action_button_contents').html((itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item));
        $J('#Lnk_ShowSellMulti').show();
        if (g_ActiveInventory.appid == 753) {
            $J('#Lnk_TurnIntoGems').show();
            $J('#Lnk_SendGifts').show();
        }
    }
    return false;
}
var setGemPrice = function (sItem, gemName, gemType, callback) {
    var gemLink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=570&country=VN&currency=1&market_hash_name=' + gemName;
    PriceQueue.GetPrice({
        method: "GET",
        url: gemLink,
        success: function (response, textStatus, jqXHR) {
            var lp = 0, nfp = 0;
            if (response.success) {
                lp = response.lowest_price;
                var pp = /([\d\.,]+)/.exec(lp.replace(/\&#\d+;/g, '').replace(' p&#1091;&#1073;.', '').replace(/,/g, '.'))[1];
                sItem.extimatePrice[gemName] = pp;
                callback(sItem);
            }
        },
        error: function () {
        }
    });
}
var imgRex = /<img.*?src="([^"]+?)"[^>]*>/g,
    imgRex2 = /background-image: url\(([^\)]+?)\)/g;
var ShowQueue = function (goo) {
    $J('div.queue-container').remove();
    var selectedItems = $J('.selectedSell');
    var div = $J('<div class="queue-container">');
    var rightDiv = $J('<div class="queue-right-panel">');
    div.append(rightDiv);

    var cdiv = $J('<div class="scrollbar-inner">');
    div.append(cdiv);

    selectedItems.sort(function (a, b) {
        var rgItemA = a.rgItem, rgItemB = b.rgItem;

        if (rgItemA.market_hash_name == rgItemB.market_hash_name) {
            return 0;
        }
        else if (rgItemA.market_hash_name < rgItemB.market_hash_name)
            return -1;
        else
            return 1;
    });

    if (window.extmasslisting) {
        ExternalPrices.UpdatePrice(typeof (g_rgWalletInfo) != 'undefined' ? g_rgWalletInfo['wallet_currency'] : 1);
    }

    selectedItems.each(function () {

        var rgItem = null;
        if (!(rgItem = this.rgItem) || ((!rgItem.marketable) && !goo) || (goo == '1' && (rgItem.appid != 753 || rgItem.contextid != 6))) {
            $J(this).removeClass('selectedSell');
            return true;
        }
        var container = $J('<div class="queue-item-container" data-id="' + rgItem.id + '">');
        container.append('<a href="#" class="queue-item-remove" title="Remove from queue">&#x2212;</a>');
        var img = '';
        if (rgItem.fraudwarnings) {
            img += '<img src="http://steamcommunity-a.akamaihd.net/public/images/sharedfiles/icons/icon_warning.png" height="16" />';
        }
        if (rgItem.descriptions && rgItem.descriptions.length) {
            var mm = null;
            for (var i = 0; i < rgItem.descriptions.length; i++) {
                while ((mm = imgRex.exec(rgItem.descriptions[i].value)) != null || (mm = imgRex2.exec(rgItem.descriptions[i].value)) != null) {
                    img += '<img src="' + mm[1] + '" height="16"/>';
                }
            }
        }
        //console.log(img);
        if (img.length > 0) {
            container.append('<div class="item-bagde">' + img + '</div>');
        }
        var item = $J('<div class="queue-item">');
        item.css('border-color', '#' + rgItem.name_color)
        if ($J(this).hasClass('item-equipped')) {
            item.addClass('item-equipped');
        }

        if ($J(this).hasClass('item-in-trade')) {
            item.addClass('item-in-trade');
        }
        if (window.extmasslisting && rgItem.extprice) {
            var extpricetag = $J('<div class="p-price"></div>');
            extpricetag.prop('title', 'scmspy');
            extpricetag.text(ExchangeRates.Format(rgItem.extprice));
            item.append(extpricetag);
        }

        item.append($J(this).find('img').clone());
        container[0].rgItem = rgItem;
        container.append(item);
        AddItemHoverToElement(item[0], rgItem);
        cdiv.append(container);
    });

    if ($J('.selectedSell').length == 0) {
        if (goo == '1')
            GrindDialog.Dismiss();
        else
            SellItemDialog.Dismiss();
        $J('div.queue-container').remove();
        $J('#Lnk_ShowSellMulti').hide();
        $J('#Lnk_TurnIntoGems').hide();
        $J('#Lnk_SendGifts').hide();

        return false;
    }

    rightDiv.append('<div class="queue-panel"><fieldset><div class="queue-item-count">' + $J('.selectedSell').length + '</div>' +
        '<div class="queue-total-price"><span class="with-fee" title="Total buyer will pay"></span><span class="without-fee" title="Total will recieve"></span></div>' +
        '</fieldset></div>');
    rightDiv.append('<div class="queue-remove-panel queue-panel"><fieldset><legend>' + SIHLang.queue.removeitem + '</legend><input type="text" class="num" id="txt_remove_queue" /><a href="#" id="bt_lower">' + SIHLang.queue.removelower + '</a><a href="#" id="bt_higher">' + SIHLang.queue.removehigher + '</a><a href="#" id="bt_intrade">' + SIHLang.queue.removeintrade + '</a><a href="#" id="bt_removeequipped">' + SIHLang.queue.removeequipped + '</a></fieldset></div>');
    rightDiv.append('<div class="queue-sort-panel queue-panel"><fieldset><legend>' + SIHLang.sort.sortitem + '</legend><a href="#" id="bt_sort_price">' + SIHLang.sort.price + ' <span class="market_sort_arrow"></span></a></fieldset></div>');


    div.find('#bt_lower, #bt_higher').click(function (e) {
        //e.stop();
        var operator = ($J(this).attr('id') === 'bt_lower' ? -1 : 1)
        var pricetocompare = parseFloat($J('#txt_remove_queue').val());
        //console.log('p2c', pricetocompare);
        if (isNaN(pricetocompare)) return false;
        $J('.queue-item-container').each(function () {
            var item = this.rgItem;
            //console.log(item);
            if (item && (item.lowestPriceW || item.extprice)) {
                var price = item.lowestPriceW ? parseFloat(getNumber(item.lowestPriceW)) : (item.extprice || 0);
                if ((price * operator) > (pricetocompare * operator)) {
                    $J(this).find('.queue-item-remove').trigger('click');
                }
            }
        });
        return false;
    });

    div.find('#bt_intrade').click(function (e) {
        //e.stop();
        $J('.queue-item-container').each(function () {
            var item = this.rgItem;
            //console.log(item);
            if ($J(this).find('.item-in-trade').length) {
                $J(this).find('.queue-item-remove').trigger('click');
            }
        });
        return false;
    });

    div.find('#bt_removeequipped').click(function (e) {
        //e.stop();
        $J('.queue-item-container').each(function () {
            var item = this.rgItem;
            //console.log(item);
            if ($J(this).find('.item-equipped').length) {
                $J(this).find('.queue-item-remove').trigger('click');
            }
        });
        return false;
    });

    div.find('#bt_sort_price').click(function (e) {
        //e.stop();
        if (isSorting) return false;
        isSorting = true;
        var order = 1;
        $this = $J(this);
        if ($this.find('.market_sort_arrow').is(':contains("▲")')) {
            order = -1;
            $this.find('.market_sort_arrow').text('▼');
        }
        else {
            $this.find('.market_sort_arrow').text('▲');
        }

        var $rows = div.find('div:has(>.queue-item-container)'),
            $rowsli = $rows.children('.queue-item-container');

        $rowsli.sort(function (a, b) {
            var rgIa = a.rgItem, rgIb = b.rgItem;

            if (!rgIa)
                return order;
            if (!rgIb)
                return order * -1;

            var an = (typeof (rgIa.lowestPriceW) == 'undefined' ? (rgIa.extprice || 0) : parseFloat(getNumber(rgIa.lowestPriceW))),
                bn = (typeof (rgIb.lowestPriceW) == 'undefined' ? (rgIb.extprice || 0) : parseFloat(getNumber(rgIb.lowestPriceW)));

            if (an == bn) {
                an = rgIa.market_hash_name,
                bn = rgIb.market_hash_name;
            }

            if (an > bn) {
                return 1 * order;
            }
            if (an < bn) {
                return -1 * order;
            }
            return 0;
        });

        $rowsli.detach().appendTo($rows);

        var rgItem = $J('.queue-item-container')[0].rgItem;
        g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
        g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
        UpdateSellItem(rgItem);

        isSorting = false;
        return false;
    });

    $J('body').append(div);
    $J(cdiv).scrollbar();

    qTotalPrice = 0;
    qTotalBuyerPrice = 0;
    if (goo) {
        GetQueueGoo();
    }
    else {
        var rgItem = $J('.queue-item-container:visible')[0].rgItem;
        g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
        g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
        //var lbp = $J('#market_sell_buyercurrency_input').val(), lsp = $J('#market_sell_currency_input').val();
        if (!UpdateSellItem(rgItem)) return;
        GetQueuePrice();
        PriceQueue.UpdateHandler = ContinueListing;
    }
}
var qTimer = null;
var qTotalPrice = 0;
var qTotalBuyerPrice = 0;
var isSorting = false;

var GetQueuePrice = function () {
    isSorting = false;
    if (qTimer) window.clearTimeout(qTimer);
    var it = $J('.queue-item-container:not(:has(>span.price))');
    for (var i = 0; i < it.length; i++) {

        var rgItem = it[i].rgItem;
        if (window.extmasslisting && rgItem.extprice) {
            var num = rgItem.extprice;
            var inputValue = GetPriceValueAsInt(num + '');
            var nAmount = inputValue;
            var priceWithoutFee = null;
            if (inputValue > 0 && nAmount == parseInt(nAmount)) {
                // Calculate what the seller gets
                var publisherFee = typeof SellItemDialog.m_item.market_fee != 'undefined' ? SellItemDialog.m_item.market_fee : g_rgWalletInfo['wallet_publisher_fee_percent_default'];
                var feeInfo = CalculateFeeAmount(nAmount, publisherFee);
                nAmount = nAmount - feeInfo.fees;

                priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
            }


            rgItem.buyerPrice = inputValue;
            rgItem.sellerPrice = nAmount;

            qTotalPrice += inputValue;
            qTotalBuyerPrice += nAmount;

            $J('.queue-total-price .with-fee').html(v_currencyformat(qTotalPrice, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
            $J('.queue-total-price .without-fee').html(v_currencyformat(qTotalBuyerPrice, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));

            var pp = $J('<span class="price"></span>');
            pp.html(rgItem.extprice);
            pp.attr('title', priceWithoutFee);

            continue;
        }

        getLowestPriceHandler(rgItem, function (item) {

            if (item && item.lowestPriceW) {
                var num = getNumber(item.lowestPriceW);//.replace(/\&#\d+;/g, '').replace(' p&#1091;&#1073;.', '');
                var inputValue = GetPriceValueAsInt(num);
                var nAmount = inputValue;
                var priceWithoutFee = null;
                if (inputValue > 0 && nAmount == parseInt(nAmount)) {
                    // Calculate what the seller gets
                    var publisherFee = typeof SellItemDialog.m_item.market_fee != 'undefined' ? SellItemDialog.m_item.market_fee : g_rgWalletInfo['wallet_publisher_fee_percent_default'];
                    var feeInfo = CalculateFeeAmount(nAmount, publisherFee);
                    nAmount = nAmount - feeInfo.fees;

                    priceWithoutFee = v_currencyformat(nAmount, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
                }

                var pp = $J('<span class="price"></span>');
                pp.html(item.lowestPriceW);
                pp.attr('title', priceWithoutFee);

                item.buyerPrice = inputValue;
                item.sellerPrice = nAmount;
                var itCnt = $J('.queue-item-container[data-id="' + item.id + '"]');
                itCnt.append(pp);
                qTotalPrice += inputValue;
                qTotalBuyerPrice += nAmount;
                $J('.queue-total-price .with-fee').html(v_currencyformat(qTotalPrice, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
                $J('.queue-total-price .without-fee').html(v_currencyformat(qTotalBuyerPrice, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));

            }
            else {
                var rgItemOrg = item;
                $J('#item' + rgItemOrg.appid + '_' + rgItemOrg.contextid + '_' + $J(it[0]).data().id + '.selectedSell').removeClass('selectedSell');

                var itC = $J('.inventory_page .selectedSell').length;
                if (itC <= 0) {
                    SellItemDialog.Dismiss();
                    $J('#Lnk_ShowSellMulti').hide();
                    $J('#Lnk_TurnIntoGems').hide();
                    $J('#Lnk_SendGifts').hide();
                    return false;
                }

                var rgItem1 = $J('.queue-item-container')[0].rgItem;

                UpdateSellItem(rgItem1);
                $J('.queue-item-count').html(itC);
                $J('#Lnk_ShowSellMulti .item_market_action_button_contents').html((itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item));
                var itCnt = $J('.queue-item-container[data-id="' + item.id + '"]');
                itCnt.remove();

            }
            //window.setTimeout('GetQueuePrice();', 50);
        });
    }

}

var GetQueueGoo = function () {
    isSorting = false;
    if (qTimer) window.clearTimeout(qTimer);
    var it = $J('.queue-item-container:not(:has(>span.price))');
    if (it.length > 0) {
        var rgItem = it[0].rgItem;

        var rgAJAXParams = {
            sessionid: g_sessionID,
            appid: rgItem.app_data.appid,
            assetid: rgItem.id,
            contextid: rgItem.contextid
        };
        var strActionURL = g_strProfileURL + "/ajaxgetgoovalue/";

        $J.get(strActionURL, rgAJAXParams).done(function (data) {
            var $Content = $J(data.strHTML);
            var strDialogTitle = data.strTitle;
            rgItem.goo_value = data.goo_value;

            if (rgItem.goo_value > 0) {

                var pp = $J('<span class="price"></span>');
                pp.html(rgItem.goo_value);
                pp.attr('title', rgItem.goo_value);
                $J(it[0]).append(pp);
                qTotalPrice += parseInt(rgItem.goo_value);
                $J('.queue-total-price .with-fee').html(qTotalPrice);
                $J('.queue-total-price .without-fee').html('gems');

            }
            else {
                var rgItemOrg = it[0].rgItem;
                $J('#item' + rgItemOrg.appid + '_' + rgItemOrg.contextid + '_' + $J(it[0]).data().id + '.selectedSell').removeClass('selectedSell');

                var itC = $J('.inventory_page .selectedSell').length;
                if (itC <= 0) {
                    GrindDialog.Dismiss();
                    $J('#Lnk_ShowSellMulti').hide();
                    $J('#Lnk_TurnIntoGems').hide();
                    $J('#Lnk_SendGifts').hide();
                    return false;
                }

                var rgItem1 = $J('.queue-item-container')[0].rgItem;
                g_ActiveInventory.SelectItem(null, rgItem1.element, rgItem1);
                g_ActiveInventory.EnsurePageActiveForItem(rgItem1.element);
                UpdateSellItem(rgItem1);
                $J('.queue-item-count').html(itC);
                $J('#Lnk_ShowSellMulti .item_market_action_button_contents').html((itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item));
                $J(it[0]).remove();

            }
            window.setTimeout('GetQueueGoo();', 50);
        });

    }
    else {
        //isSorting = false;
    }
}

var SetQueueTotal = function () {

    qTotalPrice = 0;
    qTotalBuyerPrice = 0;
    $J('.queue-item-container').each(function (i, e) {

    });
}

var GrindNextItem = function () {
    if ($J('.selectedSell').length == 0) {
        GrindDialog.Dismiss();
        $J('#Lnk_ShowSellMulti').hide();
        $J('#Lnk_TurnIntoGems').hide();
        $J('#Lnk_SendGifts').hide();
    }
    else if ($J('.selectedSell').length > 0 && !GrindDialog.m_bIsDismissed) {
        var itC = $J('.selectedSell').length;
        $J('.queue-item-count').html(itC);
        $J('#Lnk_ShowSellMulti .item_market_action_button_contents').html((itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item));
        var rgItem = $J('.queue-item-container:visible')[0].rgItem;
        g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
        g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
        //var lbp = $J('#market_sell_buyercurrency_input').val(), lsp = $J('#market_sell_currency_input').val();
        //$J('#market_sell_buyercurrency_input').val(lbp);
        //$J('#market_sell_currency_input').val(lsp);

        if (rgItem.goo_value) {
            var rgAJAXParams = {
                sessionid: g_sessionID,
                appid: rgItem.app_data.appid,
                assetid: rgItem.id,
                contextid: rgItem.contextid,
                goo_value_expected: rgItem.goo_value
            };
            strActionURL = g_strProfileURL + "/ajaxgrindintogoo/";

            $J.post(strActionURL, rgAJAXParams).done(function (data) {

                g_ActiveInventory.selectedItem.marketable = 0;
                $J(g_ActiveInventory.selectedItem.element).removeClass('selectedSell');
                $J(g_ActiveInventory.selectedItem.element).css('opacity', '0.3');
                $J('div.queue-item-container[data-id=' + g_ActiveInventory.selectedItem.id + ']').hide(200, function () {
                    setTimeout('GrindNextItem()', 100);
                });
            }).fail(function () {
                ShowAlertDialog(strDialogTitle, 'There was an error communicating with the network. Please try again later.');
            });
        }
    }
    else {
        GrindDialog.Dismiss();
    }
}

var ModifyMarketActions = function () {
    if (typeof (window.fastdelta) == 'undefined') window.fastdelta = -0.01;
    if (typeof (window.delaylistings) == 'undefined') window.delaylistings = 200;
    if (typeof (window.quicksellbuttons) == 'undefined') window.quicksellbuttons = true;
    if (typeof (window.buysetbuttons) == 'undefined') window.buysetbuttons = true;
    PopulateMarketActions = function (elActions, item) {
        elActions.update('');
        if (!item.marketable || (item.is_currency && CurrencyIsWalletFunds(item))) {
            elActions.hide();
            return;
        }
        if (typeof (g_bViewingOwnProfile) != 'undefined' && g_bViewingOwnProfile) {
            var strMarketName = typeof item.market_hash_name != 'undefined' ? item.market_hash_name : item.market_name || item.name;

            var elPriceInfo = new Element('div');
            var elPriceInfoHeader = new Element('div', { 'style': 'height: 24px;' });
            var elMarketLink = new Element('a', {
                'href': window.location.protocol + '//steamcommunity.com/market/listings/' + item.appid + '/' + encodeURIComponent(strMarketName)
            });
            elMarketLink.update('View in Community Market');
            elPriceInfoHeader.appendChild(elMarketLink);
            elPriceInfo.appendChild(elPriceInfoHeader);
            if (!window.hidedefaultprice) {

                var elPriceInfoContent = new Element('div', { 'style': 'min-height: 3em; margin-left: 1em;' });
                elPriceInfoContent.update('<img src="' + window.location.protocol + '//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working...">');
                elPriceInfo.appendChild(elPriceInfoContent);
                var fastSellBt = null;
                var itemlink = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=' + item.appid + '&country=' + g_strCountryCode + '&currency=' + (typeof (g_rgWalletInfo) != 'undefined' ? g_rgWalletInfo['wallet_currency'] : 1) + '&market_hash_name=' + encodeURIComponent(strMarketName);
                PriceQueue.GetPrice({
                    method: "GET",
                    url: itemlink,
                    insert: true,
                    success: function (response) {
                        if (response.success) {
                            var strInfo = '';
                            if (response.lowest_price) {
                                strInfo += 'Starting at: ' + response.lowest_price + '<br>'

                                var num = getNumber(response.lowest_price);//.replace(/\s/g, '').replace(/\&#\d+;/g, '').replace(' p&#1091;&#1073;.', '').replace(/[^\d,\.]/g, '');
                                var inputValue = GetPriceValueAsInt(num);
                                var nAmount = inputValue;
                                var sellingPrice = null;
                                if (inputValue > 0 && nAmount == parseInt(nAmount)) {
                                    // Calculate what the seller gets
                                    var publisherFee = typeof item.market_fee != 'undefined' ? item.market_fee : g_rgWalletInfo['wallet_publisher_fee_percent_default'];
                                    var feeInfo = CalculateFeeAmount(nAmount, publisherFee);
                                    nAmount = nAmount - feeInfo.fees + (100 * (window.fastdelta));
                                    if (nAmount <= 0) nAmount = 1;

                                    var info = CalculateAmountToSendForDesiredReceivedAmount(nAmount, publisherFee);
                                    inputValue = info.amount;
                                    sellingPrice = v_currencyformat(inputValue, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
                                }

                                if (quicksellbuttons) {
                                    fastSellBt = CreateMarketActionButton('green', '#', SIHLang.quicksell.replace('$1', sellingPrice));
                                    $J(fastSellBt).css({ 'marginLeft': '12px' });
                                    //console.log('Quick sell data ', {
                                    //    sessionid: g_sessionID,
                                    //    appid: item.appid,
                                    //    contextid: item.contextid,
                                    //    assetid: item.id,
                                    //    amount: 1,
                                    //    price: nAmount
                                    //});
                                    $J(fastSellBt).click(function () {
                                        elPriceInfoContent.update('<img src="' + window.location.protocol + '//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working...">');
                                        SellItemDialog.m_item = item;
                                        $J.ajax({
                                            url: 'https://steamcommunity.com/market/sellitem/',
                                            type: 'POST',
                                            data: {
                                                sessionid: g_sessionID,
                                                appid: item.appid,
                                                contextid: item.contextid,
                                                assetid: item.id,
                                                amount: 1,
                                                price: nAmount
                                            },
                                            crossDomain: true,
                                            xhrFields: { withCredentials: true }
                                        }).done(function (data) {
                                            SellItemDialog.OnSuccess({ responseJSON: data });
                                            if ($J('#Ck_NoReload').is(':checked'))
                                                PopulateMarketActions(elActions, item);
                                        }).fail(function (jqxhr) {
                                            // jquery doesn't parse json on fail
                                            elPriceInfoContent.update('Error...');
                                            var data = $J.parseJSON(jqxhr.responseText);
                                            SellItemDialog.OnFailure({ responseJSON: data });
                                        });
                                        return false;
                                    });
                                    if (item == g_ActiveInventory.selectedItem) {
                                        elActions.appendChild(fastSellBt);
                                    }
                                }
                            }
                            else {
                                strInfo += 'There are no listings currently available for this item.' + '<br>';
                            }

                            if (response.volume) {
                                var strVolume = '%1$s sold in the last 24 hours';
                                strVolume = strVolume.replace('%1$s', response.volume);
                                strInfo += 'Volume: ' + strVolume + '<br>';
                            }

                            elPriceInfoContent.update(strInfo);
                        }
                    }
                });

                //new Ajax.Request(window.location.protocol + '//steamcommunity.com/market/priceoverview/', {
                //    method: 'get',
                //    parameters: {
                //        country: g_strCountryCode,
                //        currency: typeof (g_rgWalletInfo) != 'undefined' ? g_rgWalletInfo['wallet_currency'] : 1,
                //        appid: item.appid,
                //        market_hash_name: strMarketName
                //    },
                //    onSuccess: function (transport) {
                //        if (transport.responseJSON && transport.responseJSON.success) {
                //            var strInfo = '';
                //            if (transport.responseJSON.lowest_price) {
                //                strInfo += 'Starting at: ' + transport.responseJSON.lowest_price + '<br>'

                //                var num = getNumber(transport.responseJSON.lowest_price);//.replace(/\s/g, '').replace(/\&#\d+;/g, '').replace(' p&#1091;&#1073;.', '').replace(/[^\d,\.]/g, '');
                //                var inputValue = GetPriceValueAsInt(num);
                //                var nAmount = inputValue;
                //                var sellingPrice = null;
                //                if (inputValue > 0 && nAmount == parseInt(nAmount)) {
                //                    // Calculate what the seller gets
                //                    var publisherFee = typeof item.market_fee != 'undefined' ? item.market_fee : g_rgWalletInfo['wallet_publisher_fee_percent_default'];
                //                    var feeInfo = CalculateFeeAmount(nAmount, publisherFee);
                //                    nAmount = nAmount - feeInfo.fees + (100 * (window.fastdelta));
                //                    if (nAmount <= 0) nAmount = 1;

                //                    var info = CalculateAmountToSendForDesiredReceivedAmount(nAmount, publisherFee);
                //                    inputValue = info.amount;
                //                    sellingPrice = v_currencyformat(inputValue, GetCurrencyCode(g_rgWalletInfo['wallet_currency']));
                //                }

                //                if (quicksellbuttons) {
                //                    var fastSellBt = CreateMarketActionButton('green', '#', SIHLang.quicksell.replace('$1', sellingPrice));
                //                    $J(fastSellBt).css({ 'marginLeft': '12px' });
                //                    $J(fastSellBt).click(function () {
                //                        elPriceInfoContent.update('<img src="' + window.location.protocol + '//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working...">');
                //                        SellItemDialog.m_item = item;
                //                        $J.ajax({
                //                            url: 'https://steamcommunity.com/market/sellitem/',
                //                            type: 'POST',
                //                            data: {
                //                                sessionid: g_sessionID,
                //                                appid: item.appid,
                //                                contextid: item.contextid,
                //                                assetid: item.id,
                //                                amount: 1,
                //                                price: nAmount
                //                            },
                //                            crossDomain: true,
                //                            xhrFields: { withCredentials: true }
                //                        }).done(function (data) {
                //                            SellItemDialog.OnSuccess({ responseJSON: data });
                //                            if ($J('#Ck_NoReload').is(':checked'))
                //                                PopulateMarketActions(elActions, item);
                //                        }).fail(function (jqxhr) {
                //                            // jquery doesn't parse json on fail
                //                            elPriceInfoContent.update('Error...');
                //                            var data = $J.parseJSON(jqxhr.responseText);
                //                            SellItemDialog.OnFailure({ responseJSON: data });
                //                        });
                //                        return false;
                //                    });
                //                    elActions.appendChild(fastSellBt);
                //                }
                //            }
                //            else {
                //                strInfo += 'There are no listings currently available for this item.' + '<br>';
                //            }

                //            if (transport.responseJSON.volume) {
                //                var strVolume = '%1$s sold in the last 24 hours';
                //                strVolume = strVolume.replace('%1$s', transport.responseJSON.volume);
                //                //strInfo += 'Median price: ' + transport.responseJSON.median_price + '<br>';
                //                strInfo += 'Volume: ' + strVolume + '<br>';
                //            }

                //            elPriceInfoContent.update(strInfo);
                //        }
                //    },
                //    onFailure: function (transport) { elPriceInfo.hide(); }
                //});
            }
            elActions.appendChild(elPriceInfo);

            var elSellButton = CreateMarketActionButton('green', '#', 'Sell');
            $J(elSellButton).click(function () {
                if ($J('.selectedSell').length > 0) {
                    $J('#div_multi input[type=checkbox]').prop('disabled', false);
                    $J('#div_multi').show();
                    $J('#ck_autoaccept').prop('checked', true);
                    var rgItem = $J('.selectedSell')[0].rgItem;
                    //g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
                    //g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
                    SellItemDialog.Show(rgItem);
                    ShowQueue();
                }
                else {
                    SellCurrentSelection();
                }
                return false;
            });
            elActions.appendChild(elSellButton);
            window.setTimeout(function () {
                if (fastSellBt && item == g_ActiveInventory.selectedItem) {
                    elActions.appendChild(fastSellBt);
                }
            }, 50);


            if (!g_bMarketAllowed) {
                var elTooltip = $('market_tip_noaccess');
                InstallHoverTooltip(elSellButton, elTooltip);
            }
        }
        else {
            elActions.hide();
            return;
        }


        elActions.show();
    }

}

var ModifyDescriptionFunction = function () {
    PopulateDescriptions = function (elDescriptions, rgDescriptions) {
        elDescriptions.update('');
        if (!rgDescriptions || !rgDescriptions.length) {
            elDescriptions.hide();
            return;
        }

        elDescriptions.show();
        var setEl = null;
        var setName = null;
        var totalPrice = 0;
        var missingParts = [];
        for (var i = 0; i < rgDescriptions.length; i++) {
            var description = rgDescriptions[i];
            if (!description.value)
                continue;

            var strParsedDescription = v_trim(description.value.replace(/\[date\](\d*)\[\/date\]/g, function (match, p1) {
                var date = new Date(p1 * 1000);
                return date.toLocaleString();
            }));

            var elDescription = new Element('div', { 'class': 'descriptor' });
            if (description.color)
                elDescription.style.color = '#' + description.color;

            // just use a blank space for an empty string
            if (strParsedDescription.length == 0) {
                elDescription.update('&nbsp;');
            }
            else if (description.type == 'image') {
                var elImage = new Element('img', { src: v_trim(description.value) });
                elDescription.appendChild(elImage);
            }
            else if (description.type == 'html') {
                var html = strParsedDescription;
                if (description.app_data && !description.app_data.limited && !description.app_data.is_itemset_name) {
                    var item = {};
                    if (description.app_data.price) {
                        var pp = getNumber(description.app_data.price);
                        item.price = pp;
                        item.link = window.location.protocol + '//steamcommunity.com/market/listings/' + g_ActiveInventory.appid + '/' + encodeURIComponent(description.app_data.market_hash_name);
                        item.name = strParsedDescription;
                        item.market_hash_name = description.app_data.market_hash_name;
                        totalPrice += parseFloat(pp);
                        html = '<a href="' + window.location.protocol + '//steamcommunity.com/market/listings/' + g_ActiveInventory.appid + '/' + encodeURIComponent(description.app_data.market_hash_name) + '" target="_blank" style="color:inherit" class="whiteLink">' + html + ' (' + description.app_data.price + ')</a>';
                    }

                    if (description.isinset) {
                        if (description.app_data.owned) {
                            html = '&#10003; ' + html;
                        }
                        else {
                            html = '&#10007;&nbsp; ' + html;
                            if (description.app_data.price)
                                missingParts.push(item);
                        }
                    }
                }

                if (description.isstickers) {
                    html = html.substr(0, html.indexOf('<br>Sticker:') + 12);
                    for (var k = 0; k < description.stickers.length; k++) {
                        var sticker = description.stickers[k];
                        if (k) html += ', ';
                        html += sticker.name;
                        if (sticker.prices && sticker.prices.lowestPrice) {
                            html += ' - <span title="' + sticker.prices.nofeePrice + '" style="color: #FF0">' + sticker.prices.lowestPrice + '</span>'
                        }
                    }
                    html += '</center></div>';
                }

                if (description.insgems && description.insgems.length) {
                    if (!description.orgvalue) description.orgvalue = description.value;
                    else description.value = description.orgvalue;

                    var regexgem = /<span style="font-size: 12px">([\w\s]+)<\/span>/gi;
                    for (var j = 0; j < description.insgems.length; j++) {
                        var m = regexgem.exec(description.orgvalue);
                        var ggem = description.insgems[j];
                        var gemLink = window.location.protocol + '//steamcommunity.com/market/listings/570/' + ggem.name;
                        if (ggem.lowestPrice) {
                            description.value = description.value.replace(m[0], '<a href="' + gemLink + '" target="_blank" title="' + ggem.name + '">' + m[1] + ' <span style="color: #FF0">(' + ggem.lowestPrice + ')</span></a>')
                        }
                        else {
                            description.value = description.value.replace(m[0], '<a href="' + gemLink + '" target="_blank" title="' + ggem.name + '">' + m[1] + '</a>')
                        }
                    }
                    html = description.value;
                }

                elDescription.update(html);

            }
            else {
                elDescription.update(strParsedDescription.escapeHTML().replace(/\n/g, '<br>'));
            }

            if (description.app_data && description.app_data.is_itemset_name) {
                setEl = elDescription;
                setName = description.value;
            }

            if (description.label) {
                var elLabel = new Element('span', { 'class': 'descriptor_label' });
                elLabel.update(description.label + ': ');
                elDescription.insert({ top: elLabel });
            }

            elDescriptions.appendChild(elDescription);
        }
        //console.log(totalPrice);
        if (setEl && totalPrice > 0) {
            //var totalStr = (Math.round(totalPrice * 100) / 100) + '';
            //if (totalStr.lastIndexOf('.') == -1) totalStr += '.00';
            //totalStr = totalStr.replace(/(\d)(\d{3})([,\.])/, '$1,$2$3');
            setEl.update(setName + ' (' + formatNumber(totalPrice) + ')');

            if (missingParts.length > 0 && g_bViewingOwnProfile && g_bMarketAllowed && buysetbuttons && !elDescriptions.id.startsWith('hover')) {
                var buySetBtn = $J('<a href="#" class="buy-set">' + SIHLang.buymissing + '</a>');
                buySetBtn.click(function () {
                    BuySetDialog.Show(missingParts);
                    return false;
                });
                $J(setEl).append('<br />').append(buySetBtn);
            }
        }

    }
    var orgPopulateTags = PopulateTags;
    PopulateTags = function (elTags, elTagsContent, rgTags) {
        orgPopulateTags(elTags, elTagsContent, rgTags);
        if (rgTags && rgTags.length > 0) {
            var link = $J('<a href="javascript:void(0)">Gen. expression</a>');
            link.click(function () {
                GenExpDialog.Show(rgTags);
            });
            $J(elTagsContent).append('<br />').append(link);
        }
    }
}

var ModifyItemDisplay = function () {
    UserYou.OnLoadInventoryComplete = function (transport, appid, contextid) {
        this.cLoadsInFlight--;
        if (transport.responseJSON && transport.responseJSON.success) {
            var inventory = new CInventory(this, appid, contextid, transport.responseJSON.rgInventory, transport.responseJSON.rgCurrency);

            this.addInventory(inventory);
            var elInventory = inventory.getInventoryElement();
            elInventory.hide();
            $('inventories').insert(elInventory);

            var elTags = inventory.getTagContainer();
            var elTagHolder = $('filter_options');
            if (elTagHolder && elTags) {
                elTags.hide();
                elTagHolder.insert(elTags);
                elTagHolder.addClassName('filter_collapsed');
            }

            var classArr = {};
            for (var ii in transport.responseJSON.rgInventory) {
                var rgItem = transport.responseJSON.rgInventory[ii];
                if (!classArr[rgItem.classid])
                    classArr[rgItem.classid] = 1;
                else
                    classArr[rgItem.classid]++;
            }
            //console.log(classArr);

            for (var ii in transport.responseJSON.rgInventory) {
                var rgItem = transport.responseJSON.rgInventory[ii];

                if (classArr[rgItem.classid] && classArr[rgItem.classid] > 1 && rgItem.descriptions) {
                    if (!rgItem.descriptions[0].iscount)
                        rgItem.descriptions.unshift({
                            iscount: true,
                            type: 'html',
                            value: 'Number owned: <i style="color: rgb(153, 204, 255); font-size: 16px">' + classArr[rgItem.classid] + '</i>' + (g_bViewingOwnProfile ? ' (<a href="javascript:selectSimilar(' + rgItem.classid + ')">Select all</a>)' : '')
                        });
                }
            }

            if (appid == 570) {
                $J.ajax({
                    url: 'https://api.steampowered.com/IEconItems_570/GetPlayerItems/v0001/',
                    strSteamId: this.strSteamId,
                    data: {
                        SteamID: this.strSteamId,
                        key: apiKey
                    },
                    success: function (data) {
                        if (!apiItems[this.strSteamId])
                            apiItems[this.strSteamId] = {};

                        if (data && data.result && data.result.status == 1) {
                            apiItems[this.strSteamId][appid] = data.result.items;
                            $J.each(apiItems[this.strSteamId][appid], function (i, o) {
                                var elIt = $J('div.item[id=item570_2_' + o.id + ']');
                                if (o.equipped) {
                                    elIt.addClass('item-equipped');
                                    elIt.each(function () { this.rgItem.equipped = true; });;
                                }
                                elIt.each(function () { this.rgItem.defindex = o.defindex; });;
                            });
                        }
                    },
                    error: function () {

                    }
                });
            }
            else if (appid == 730) {
                numberOfRetries = 0;
                GetCSGOItems();
            }
            else if (appid == 440) {
                $J.ajax({
                    url: 'https://api.steampowered.com/IEconItems_440/GetPlayerItems/v0001/',
                    strSteamId: this.strSteamId,
                    data: {
                        SteamID: this.strSteamId,
                        key: apiKey
                    },
                    success: function (data) {

                        if (!apiItems[this.strSteamId])
                            apiItems[this.strSteamId] = {};

                        if (data && data.result && data.result.status == 1) {
                            apiItems[this.strSteamId][appid] = data.result.items;
                            $J.each(apiItems[this.strSteamId][appid], function (i, o) {
                                var elIt = $J('div.item[id=item440_2_' + o.id + ']');
                                if (o.equipped) {
                                    elIt.addClass('item-equipped');
                                    elIt.each(function () { this.rgItem.equipped = true; });;
                                }
                                elIt.each(function () {
                                    this.rgItem.defindex = o.defindex;
                                    this.rgItem.apivalue = o;
                                });;
                            });
                        }
                        if (TF2BP && TF2BP.SetPrice) {
                            TF2BP.SetPrice(440);
                        }
                    },
                    error: function () {

                    }
                });
            }
            /*
            */
            if (window.extprice) {
                SetupExternalDropdown(g_ActiveInventory.appid);
                if (ExternalPrices[appid]) {
                    var lastAPI = GetCookie('lastext_' + appid);
                    if (lastAPI != null) {
                        lastAPI = parseInt(lastAPI);
                    } else {
                        lastAPI = 0;
                    }
                    $J.each(ExternalPrices[appid].apis, function (idx, el) {
                        if (this.api && this.api.GetPrices) {
                            this.api.GetPrices(inventory.rgInventory, (idx == lastAPI));
                        }
                    });
                }
            }
        }
        else {
            this.OnInventoryLoadFailed(transport, appid, contextid);
            return;
        }

        this.ShowInventoryIfActive(appid, contextid);
        $J(window).trigger('resize.DynamicInventorySizing');

        $J.each(itemsInTrades, function () {
            var it = this;
            if (it.appid == appid) {
                var elIt = $J('div.item[id=item' + it.appid + '_' + it.context + '_' + it.id + ']');
                elIt.addClass('item-in-trade');
            }
        });

        if (g_bIsTrading)
            RedrawCurrentTradeStatus();

    };
}

var numberOfRetries = 0, maxRetries = 10;
var dopplerPhaseName = {
    421: 'Phase 4',
    420: 'Phase 3',
    419: 'Phase 2',
    418: 'Phase 1',
    417: 'Black Pearl',
    416: 'Sapphire',
    415: 'Ruby'
}
var GetCSGOItems = function () {
    $J.ajax({
        url: 'https://api.steampowered.com/IEconItems_730/GetPlayerItems/v0001/',
        strSteamId: UserYou.strSteamId,
        data: {
            SteamID: UserYou.strSteamId,
            key: apiKey
        },
        success: function (data) {
            if (!apiItems[this.strSteamId])
                apiItems[this.strSteamId] = {};
            if (data && data.result && data.result.status == 1) {
                apiItems[this.strSteamId][730] = data.result.items;
                $J.each(apiItems[this.strSteamId][730], function (i, o) {
                    var elIt = $J('div.item[id=item730_2_' + o.id + ']');
                    if (o.attributes) {
                        var floatValue = -1;
                        var dopplerPhase = -1;
                        for (var j = 0; j < o.attributes.length; j++) {
                            if (o.attributes[j].defindex == 8) {
                                floatValue = o.attributes[j].float_value;
                            }
                            if (o.attributes[j].defindex == 6) {
                                dopplerPhase = o.attributes[j].float_value;
                            }
                        }
                    }
                    if (floatValue >= 0) {
                        var dPstr = '';
                        if (dopplerPhase > 0) {
                            dPstr = dopplerPhaseName[dopplerPhase] || '';
                        }
                        elIt.each(function () {
                            if (!this.rgItem.float_value) {
                                this.rgItem.float_value = floatValue;
                                this.rgItem.dopplerPhase = dPstr;
                                if (this.rgItem.descriptions) {
                                    this.rgItem.descriptions = this.rgItem.descriptions.clone();
                                    this.rgItem.descriptions.unshift({ type: "html", value: "Float value: <strong style='color: #FF0'>" + floatValue.toFixed(4) + "</strong> " + dPstr, floatvalue: true });
                                }
                            }
                        });;
                    }
                });
            }
        },
        error: function () {
            numberOfRetries++;
            console.log('Retry', numberOfRetries);
            if (numberOfRetries >= maxRetries) return;
            window.setTimeout(GetCSGOItems, 1000 + (200 * numberOfRetries));
        }
    });
}


var ModifyGamesTabs = function () {
    //$J('.games_list_tabs').append($J('.games_list_tabs a.games_list_tab').clone());
    var numberOfGames = $J('.games_list_tabs a.games_list_tab').length;
    var cIdx = $J('.games_list_tabs a.games_list_tab').index($J('.games_list_tabs .active'));

    if (numberOfGames > 10) {
        var divCont = $J('<div class="holder">');
        var divCtrl = $J('<div class="tab-controls">');
        var children = $J('.games_list_tabs').children().remove();
        divCont.append(children);
        divCtrl.append('<a href="#" class="tab-up">up</a><a href="#" class="tab-down">down</a>');
        divCtrl.find('.tab-up').click(function () {
            divCont.stop();

            var cPos = parseInt(divCont.scrollTop() / 56) * 56;
            divCont.animate({ scrollTop: cPos - 112 }, 500);
            return false;
        });
        divCtrl.find('.tab-down').click(function () {
            divCont.stop();
            var cPos = (parseInt(divCont.scrollTop() / 56)) * 56;
            divCont.animate({ scrollTop: cPos + 112 }, 500);
            return false;
        });
        $J('.games_list_tabs').append(divCont);
        $J('.games_list_tabs').append(divCtrl);
        if (cIdx > 5) {
            divCont.animate({ scrollTop: cIdx * 56 }, 500);
        }
    }
}

var orgShowItemInventory = null;
var ModifyShowItemInventory = function () {
    orgShowItemInventory = ShowItemInventory;
    ShowItemInventory = function (appid, contextid, assetid, bLoadCompleted) {
        orgShowItemInventory(appid, contextid, assetid, bLoadCompleted);
        SetupExternalDropdown(appid);
        if (ExternalPrices[appid]) {
            $J.each(ExternalPrices[appid].apis, function (idx, el) {
                if (this.api && this.api.GetPrices) {
                    this.api.GetPrices(g_ActiveInventory.rgInventory, (idx == 0));
                }
            });
        }
    }
}
var UpdateSellItem = function (item) {
    SellItemDialog.m_item = item;
    if ($J('#ck_autoadjust').is(':checked')) {
        if (!item.sellerPrice) {
            SellItemDialog.b_isInterupted = true;
            return false;
        }
        var calPrice = CalculateSellingPrice(item.sellerPrice);
        if (calPrice <= 0) calPrice = item.sellerPrice;
        var publisherFee = typeof SellItemDialog.m_item.market_fee != 'undefined' ? SellItemDialog.m_item.market_fee : g_rgWalletInfo['wallet_publisher_fee_percent_default'];
        var info = CalculateAmountToSendForDesiredReceivedAmount(calPrice, publisherFee);

        $J('#market_sell_currency_input').val(v_currencyformat(calPrice, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
        $J('#market_sell_buyercurrency_input').val(v_currencyformat(info.amount, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
        SellItemDialog.m_nConfirmedPrice = calPrice;
    }

    var elItem = $('market_sell_dialog_item');
    if (item.name_color)
        elItem.style.borderColor = '#' + item.name_color;
    if (item.background_color)
        elItem.style.backgroundColor = '#' + item.background_color;

    var elItemImage = $('market_sell_dialog_item_img');
    if (item.is_stackable)
        elItemImage.src = ImageURL(item.icon_url, '96f', '58f');
    else
        elItemImage.src = ImageURL(item.icon_url, '96f', '96f');

    SellItemDialog.m_strName = GetNameForItem(item);
    $('market_sell_dialog_item_name').update(SellItemDialog.m_strName);
    $('market_sell_quantity_available_amt').update(item.amount);

    if (item.name_color) {
        $('market_sell_dialog_item_name').style.color = '#' + item.name_color;
    }
    else {
        $('market_sell_dialog_item_name').style.color = '';
    }

    if (item.appid && g_rgAppContextData[item.appid]) {
        var rgAppData = g_rgAppContextData[item.appid];
        $('market_sell_dialog_game_icon').src = rgAppData.icon;
        $('market_sell_dialog_game_icon').alt = rgAppData.name;
        $('market_sell_dialog_game_name').update(rgAppData.name);
        $('market_sell_dialog_item_type').update(item.type);
        $('market_sell_dialog_game_info').show();
    }
    else {
        $('market_sell_dialog_game_info').hide();
    }

    if (item.amount == 1) {
        $('market_sell_quantity_input').disable();

        $('market_sell_quantity_label').hide();
        $('market_sell_quantity_input').hide();
        $('market_sell_quantity_available').hide();
    }
    else {
        $('market_sell_quantity_label').show();
        $('market_sell_quantity_input').show();
        $('market_sell_quantity_available').show();
    }
    return true;
};

var ModifySellingFuntions = function () {

    SellItemDialog.orgOnSuccess = SellItemDialog.OnSuccess;
    SellItemDialog.orgOnFailure = SellItemDialog.OnFailure;
    SellItemDialog.newOnSuccess = function (transport) {
        this.m_bWaitingForUserToConfirm = false;
        this.m_bWaitingOnServer = false;
        if (transport.responseJSON) {
            //this.Dismiss();
            $('market_headertip_itemsold_itemname').update(this.m_strName);
            if (this.m_item.name_color) {
                $('market_headertip_itemsold_itemname').style.color = '#' + this.m_item.name_color;
            }
            else {
                $('market_headertip_itemsold_itemname').style.color = '';
            }

            //new Effect.BlindDown('market_headertip_itemsold', { duration: 0.25 });
            g_ActiveInventory.selectedItem.marketable = 0;
            $J(g_ActiveInventory.selectedItem.element).removeClass('selectedSell');
            $J(g_ActiveInventory.selectedItem.element).css('opacity', '0.3');
            $J('div.queue-item-container[data-id=' + g_ActiveInventory.selectedItem.id + ']').hide(200, function () {
                //$J('div.queue-item-container[data-id=' + g_ActiveInventory.selectedItem.id + ']').remove();

                if ($J('.queue-item-container:visible').length > 0) {
                    var itC = $J('.queue-item-container:visible').length;
                    $J('.queue-item-count').html(itC);
                    $J('#Lnk_ShowSellMulti .item_market_action_button_contents').html((itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item));
                    var rgItem = $J('.queue-item-container:visible')[0].rgItem;
                    g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
                    g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
                    //var lbp = $J('#market_sell_buyercurrency_input').val(), lsp = $J('#market_sell_currency_input').val();
                    if (!UpdateSellItem(rgItem)) return;

                    //$J('#market_sell_buyercurrency_input').val(lbp);
                    //$J('#market_sell_currency_input').val(lsp);

                    if ($J('#ck_autoaccept').is(':checked')) {
                        if ($J('#market_sell_dialog').is(':visible'))
                            window.setTimeout('SellItemDialog.OnConfirmationAccept({stop:function(){}});', window.delaylistings);
                        //window.setTimeout('$J("#market_sell_dialog_ok").trigger("click");', 200);
                    }
                    else {
                        $('market_sell_dialog_ok').show();
                        $('market_sell_dialog_ok').setOpacity('0');
                        $('market_sell_dialog_ok').fade({ duration: 0.25, from: 0, to: 1 });
                        $('market_sell_dialog_back').show();
                        $('market_sell_dialog_back').setOpacity('0');
                        $('market_sell_dialog_back').fade({ duration: 0.25, from: 0, to: 1 });
                        $('market_sell_dialog_throbber').fade({ duration: 0.25 });
                    }

                }
                //else {
                //    SellItemDialog.Dismiss();
                //    $J('.item.selectedSell').removeClass('selectedSell');
                //    $J('.similar-item').removeClass('similar-item');

                //    $J('#Lnk_Sellmulti .item_market_action_button_contents').html(SIHLang.sellmulti);
                //    $J('#Lnk_ShowSellMulti').hide();
                //    selectmode = false;
                //    SellItemDialog.OnFailure = SellItemDialog.orgOnFailure;
                //    $J('.item_market_actions').html('');
                //}
            });

            if ($J('.selectedSell').length <= 0) {
                SellItemDialog.Dismiss();
                $J('.item.selectedSell').removeClass('selectedSell');
                $J('.similar-item').removeClass('similar-item');

                $J('#Lnk_Sellmulti .item_market_action_button_contents').html(SIHLang.sellmulti);
                $J('#Lnk_ShowSellMulti').hide();
                $J('#Lnk_TurnIntoGems').hide();
                $J('#Lnk_SendGifts').hide();
                selectmode = false;
                SellItemDialog.OnFailure = SellItemDialog.orgOnFailure;
                $J('.item_market_actions').html('');
            }
        }
        else {
            this.DisplayError('There was a problem listing your item. Refresh the page and try again.');
        }
    }

    //SellItemDialog.Dismiss = function () {
    //    $(document).stopObserving('keydown', this.m_fnDocumentKeyHandler);
    //    $J('div.queue-container').remove();
    //    $J('#div_multi').hide();
    //    $J('#ck_autoaccept,#ck_autoadjust').prop('checked', false);
    //    $J('#Txt_adjust').prop('disabled', false);
    //    hideModal('market_sell_dialog');
    //    if (this.m_modal)
    //        this.m_modal.Dismiss();
    //    HideHover();
    //}

    SellItemDialog.orgShow = SellItemDialog.Show;

    SellItemDialog.Show = function (item) {
        SellItemDialog.orgShow(item);
        SellItemDialog.m_modal.m_fnOnDismiss = function () {
            $J('div.queue-container').remove();
            $J('#div_multi').hide();
            $J('#ck_autoaccept,#ck_autoadjust').prop('checked', false);
            $J('#Txt_adjust').prop('disabled', false);
            HideHover();
        }
    }

    SellItemDialog.newOnFailure = function (transport) {
        this.m_bWaitingOnServer = false;

        var queue = Effect.Queues.get('global');
        queue.each(function (effect) { effect.cancel(); });

        $('market_sell_dialog_ok').show();
        $('market_sell_dialog_ok').setOpacity('0');
        $('market_sell_dialog_ok').fade({ duration: 0.25, from: 0, to: 1 });
        $('market_sell_dialog_back').show();
        $('market_sell_dialog_back').setOpacity('0');
        $('market_sell_dialog_back').fade({ duration: 0.25, from: 0, to: 1 });
        $('market_sell_dialog_throbber').fade({ duration: 0.25 });

        if (transport.responseJSON && transport.responseJSON.message) {
            this.DisplayError(transport.responseJSON.message);
            if (transport.responseJSON.message != 'The item specified is no longer in your inventory or is not allowed to be traded on the Community Market.') {
                if ($J('#ck_autoaccept').is(':checked') && transport.responseJSON.message.indexOf('exceed the maximum wallet balance') < 0)
                    window.setTimeout('SellItemDialog.OnConfirmationAccept({stop:function(){}});', 200);
            }
            else {
                $J(g_ActiveInventory.selectedItem.element).removeClass('selectedSell');
                $J(g_ActiveInventory.selectedItem.element).css('opacity', '0.3');
            }
        }
        else {
            this.DisplayError('There was a problem listing your item. Refresh the page and try again.');
        }
    };
    //g_bMarketAllowed
    $J('#filter_options').after(
        '<div>' +
        '<label for="Ck_NoReload" style="margin-left: 12px; display: none"><input type="checkbox" name="Ck_NoReload" checked="checked" id="Ck_NoReload" /><span data-lang="noreload">No inventory reloading when sell item</span></label>' +
        //'<br />'+
        '<a href="#" id="Lnk_Reload" accesskey="r" style="margin-left: 12px" class="item_market_action_button item_market_action_button_green"><span class="item_market_action_button_edge item_market_action_button_left"></span><span class="item_market_action_button_contents" data-lang="reloadinvent">Reload inventory (alt + r)</span><span class="item_market_action_button_edge item_market_action_button_right"></span><span class="item_market_action_button_preload"></span></a>' +
        '<a href="#" id="Lnk_Sellmulti" style="margin-left: 12px" class="item_market_action_button item_market_action_button_green" title="Tips: User shift click to select a range of items"><span class="item_market_action_button_edge item_market_action_button_left"></span><span class="item_market_action_button_contents" data-lang="sellmulti">Select items</span><span class="item_market_action_button_edge item_market_action_button_right"></span><span class="item_market_action_button_preload"></span></a>' +
        '<a href="#" id="Lnk_ShowSellMulti" style="display:none; margin-left: 12px" title="Tips: User shift click to select a range of items" class="item_market_action_button item_market_action_button_green"><span class="item_market_action_button_edge item_market_action_button_left"></span><span class="item_market_action_button_contents">Sell</span><span class="item_market_action_button_edge item_market_action_button_right"></span><span class="item_market_action_button_preload"></span></a>' +
        '<a href="#" id="Lnk_TurnIntoGems" style="display:none; margin-left: 12px" class="item_market_action_button item_market_action_button_green"><span class="item_market_action_button_edge item_market_action_button_left"></span><span class="item_market_action_button_contents">Turn into gems</span><span class="item_market_action_button_edge item_market_action_button_right"></span><span class="item_market_action_button_preload"></span></a>' +
        '<a href="#" id="Lnk_SendGifts" style="display:none; margin-left: 12px" class="item_market_action_button item_market_action_button_green"><span class="item_market_action_button_edge item_market_action_button_left"></span><span class="item_market_action_button_contents">Send gifts</span><span class="item_market_action_button_edge item_market_action_button_right"></span><span class="item_market_action_button_preload"></span></a>' +
        ' <br />' +
        '</div>'
        );
    $J('#market_sell_dialog_accept_ssa_label').after('<div id="div_multi" style="display:none">' +
        '<label for="ck_autoaccept"><input type="checkbox" id="ck_autoaccept"> <span data-lang="autoaccept">auto accept</span></label> ' +
        '<label for="ck_autoadjust"><input type="checkbox" id="ck_autoadjust"> <span data-lang="autoadjust">auto adjust price</span></label>' +
        '<input type="number" step="0.01" title="adjust amount" id="Txt_adjust" value="0" />' +
        '<select id="cb_adtype"><option value="1">Value</option><option value="2">Percentage</option></select>' +
        '</div>')

    $J('#market_sell_dialog_accept').click(function () {
        $J('#div_multi input[type=checkbox],#Txt_adjust').prop('disabled', true);
    });

    SellItemDialog.OnSuccess = SellItemDialog.newOnSuccess;

    $J('#Ck_NoReload').click(function () {
        if ($J(this).is(':checked')) {
            SellItemDialog.OnSuccess = SellItemDialog.newOnSuccess;
        }
        else
            SellItemDialog.OnSuccess = SellItemDialog.orgOnSuccess;
    });
    $J('#ck_autoadjust').click(function () {
        var rgItem = g_ActiveInventory.selectedItem;
        var calPrice = CalculateSellingPrice(rgItem.sellerPrice);
        if (calPrice <= 0) calPrice = rgItem.sellerPrice;
        var publisherFee = typeof SellItemDialog.m_item.market_fee != 'undefined' ? SellItemDialog.m_item.market_fee : g_rgWalletInfo['wallet_publisher_fee_percent_default'];
        var info = CalculateAmountToSendForDesiredReceivedAmount(calPrice, publisherFee);

        $J('#market_sell_currency_input').val(v_currencyformat(calPrice, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
        $J('#market_sell_buyercurrency_input').val(v_currencyformat(info.amount, GetCurrencyCode(g_rgWalletInfo['wallet_currency'])));
        if ($J(this).is(':checked')) {
            $J('#market_sell_currency_input,#market_sell_buyercurrency_input').prop('disabled', true);
        }
        else {
            $J('#market_sell_currency_input,#market_sell_buyercurrency_input').prop('disabled', false);
        }
    });
    $J('#Lnk_Reload').click(function () {
        var it = g_ActiveInventory.selectedItem;
        UserYou.ReloadInventory(it.appid, it.contextid);
        cachePrices = {};
        selectmode = false;
        $J('#Lnk_Sellmulti .item_market_action_button_contents').html(SIHLang.sellmulti);
        $J('#Lnk_ShowSellMulti').hide();
        $J('#Lnk_TurnIntoGems').hide();
        $J('#Lnk_SendGifts').hide();
        SellItemDialog.OnFailure = SellItemDialog.orgOnFailure;
        $J('.item.selectedSell').removeClass('selectedSell');
        $J('.similar-item').removeClass('similar-item');

        return false;
    });
    $J('#Lnk_Sellmulti').click(function () {
        selectmode = !selectmode;
        if (selectmode) {
            $J('#Lnk_Sellmulti .item_market_action_button_contents').html(SIHLang.cancel);
            $J('#Ck_NoReload').prop('checked', true);
            SellItemDialog.OnSuccess = SellItemDialog.newOnSuccess;
            SellItemDialog.OnFailure = SellItemDialog.newOnFailure;
        }
        else {
            $J('#Lnk_Sellmulti .item_market_action_button_contents').html(SIHLang.sellmulti);
            $J('#Lnk_ShowSellMulti').hide();
            $J('#Lnk_TurnIntoGems').hide();
            $J('#Lnk_SendGifts').hide();
            SellItemDialog.OnFailure = SellItemDialog.orgOnFailure;
        }
        $J('.item.selectedSell').removeClass('selectedSell');
        $J('.similar-item').removeClass('similar-item');

        return false;
    });
    $J('#Lnk_ShowSellMulti').click(function () {
        if ($J('.selectedSell').length > 0) {
            $J('#div_multi input[type=checkbox]').prop('disabled', false);
            $J('#div_multi').show();
            $J('#ck_autoaccept').prop('checked', true);
            var rgItem = $J('.selectedSell')[0].rgItem;
            g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
            g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
            SellItemDialog.m_bWaitingOnServer = false;
            SellItemDialog.Show(rgItem);
            ShowQueue();
        }
        return false;
    });

    $J('#Lnk_TurnIntoGems').click(function () {
        if ($J('.selectedSell').length > 0) {
            //$J('#div_multi input[type=checkbox]').prop('disabled', false);
            //$J('#div_multi').show();
            //$J('#ck_autoaccept').prop('checked', true);
            //var rgItem = $J('.selectedSell')[0].rgItem;
            ////g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
            ////g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
            ////SellItemDialog.m_bWaitingOnServer = false;
            ////SellItemDialog.Show(rgItem);

            //var rgAJAXParams = {
            //    sessionid: g_sessionID,
            //    appid: rgItem.app_data.appid,
            //    assetid: rgItem.id,
            //    contextid: rgItem.contextid
            //};
            var strActionURL = g_strProfileURL + "/ajaxgetgoovalue/";
            GrindDialog.Show();
            ShowQueue(1);
            //$J.get(strActionURL, rgAJAXParams).done(function (data) {
            //    var $Content = $J(data.strHTML);
            //    var strDialogTitle = data.strTitle;
            //    ShowConfirmDialog(strDialogTitle, $Content).done(function () {
            //        GrindNextItem();
            //    });
            //});
        }
        return false;
    });

    $J('#Lnk_SendGifts').click(function () {

        var url = '';
        $J('.selectedSell').each(function () {
            var rgItem = this.rgItem;
            if (rgItem.appid == 753 && rgItem.contextid == 1) {
                url += rgItem.id + '/';
            }
        });
        if (url != '') {
            url = 'http://store.steampowered.com/checkout/sendgift/' + url + g_steamID;
            window.location.href = url;
        }
        else {
            $J('#Lnk_SendGifts').hide();
        }
        return false;
    });

    $J('body').on('click', '.queue-item-remove', function () {
        var p = $J(this).parent('.queue-item-container');
        var rgItemOrg = p[0].rgItem;
        $J('#item' + rgItemOrg.appid + '_' + rgItemOrg.contextid + '_' + p.data().id + '.selectedSell').removeClass('selectedSell');
        p.hide(200);
        var itC = $J('.selectedSell').length;
        if (itC <= 0) {
            SellItemDialog.Dismiss();
            $J('#Lnk_ShowSellMulti').hide();
            $J('#Lnk_TurnIntoGems').hide();
            $J('#Lnk_SendGifts').hide();
            return false;
        }

        var rgItem = $J('.selectedSell')[0].rgItem;
        g_ActiveInventory.SelectItem(null, rgItem.element, rgItem);
        g_ActiveInventory.EnsurePageActiveForItem(rgItem.element);
        UpdateSellItem(rgItem);
        $J('.queue-item-count').html(itC);
        $J('#Lnk_ShowSellMulti .item_market_action_button_contents').html((itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item));
        return false;
    });
}

var AddDialogHTML = function () {
    var dialog = '<div id="market_buyset_dialog" class="market_modal_dialog" style="display: none;">' +
        '<div class="market_dialog_title">' +
            '<span id="market_buyset_dialog_title" >Buy missing parts</span>' +
            '<span class="market_dialog_cancel">' +
                '<a id="market_buyset_dialog_cancel" href="#" class="market_dialog_title_cancel">Cancel<span class="market_dialog_title_cancel_X">X</span></a>' +
            '</span>' +
        '</div>' +
        '<div class="market_dialog_contents">' +
            '<div class="market_dialog_content_frame">' +
                '<div class="market_dialog_content">' +
                    '<div class="market_dialog_iteminfo">' +
                        '<div id="lstParts" class="market_content_block market_home_listing_table market_home_main_listing_table market_listing_table"></div>' +
                    '</div>' +
                '</div>' +
                '<div class="market_dialog_content_separator"></div>' +
                '<div class="market_dialog_content market_dialog_content_dark">' +
                    '<div class="market_sell_dialog_input_area">' +
                        //'<a id="market_buyset_dialog_accept" href="#" class="btn_green_white_innerfade btn_small_wide"><span>Buy missing parts</span></a>' +
                        '<a id="market_buyset_dialog_reload" href="#" class="btn_green_white_innerfade btn_small_wide"><span>Reload list</span></a>' +
                        '<div>&nbsp;<br /><br /></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    dialog += '<div id="hover" style="display: none; z-index: 1001">' +
		'<div class="shadow_ul"></div><div class="shadow_top"></div><div class="shadow_ur"></div><div class="shadow_left"></div><div class="shadow_right"></div><div class="shadow_bl"></div><div class="shadow_bottom"></div><div class="shadow_br"></div>		<div class="inventory_iteminfo hover_box shadow_content" id="iteminfo_clienthover">' +
			'<div class="item_desc_content" id="hover_content">' +
				'<div class="item_desc_icon">' +
					'<div class="item_desc_icon_center">' +
						'<img id="hover_item_icon" src="' + window.location.protocol + '//steamcommunity-a.akamaihd.net/public/images/trans.gif" alt="" />' +
					'</div>' +
				'</div>' +
				'<div class="item_desc_description">' +
					'<h1 class="hover_item_name" id="hover_item_name"></h1>' +
					'<div class="fraud_warning" id="hover_fraud_warnings"></div>' +
					'<div class="item_desc_game_info" id="hover_game_info">' +
						'<div class="item_desc_game_icon">' +
							'<img id="hover_game_icon" src="' + window.location.protocol + '//steamcommunity-a.akamaihd.net/public/images/trans.gif" alt="" />' +
						'</div>' +
						'<div id="hover_game_name" class="ellipsis"></div>' +
						'<div id="hover_item_type" class=""></div>' +
					'</div>' +
					'<div class="item_desc_descriptors" id="hover_item_descriptors">' +
					'</div>' +
					'<div class="item_desc_descriptors" id="hover_item_owner_descriptors">' +
					'</div>' +
				'</div>' +
			'</div>' +
		'</div>' +
		'<div class="hover_arrow_left" id="hover_arrow_left">' +
			'<div class="hover_arrow_inner"></div>' +
		'</div>' +
		'<div class="hover_arrow_right" id="hover_arrow_right">' +
			'<div class="hover_arrow_inner"></div>' +
		'</div>' +
	'</div>';
    dialog += '<div id="market_getexp_dialog" class="market_modal_dialog" style="display: none;">' +
        '<div class="market_dialog_title">' +
            '<span id="market_getexp_dialog_title" >Generate custom button expression</span>' +
            '<span class="market_dialog_cancel">' +
                '<a id="market_getexp_dialog_cancel" href="#" class="market_dialog_title_cancel">Cancel<span class="market_dialog_title_cancel_X">X</span></a>' +
            '</span>' +
        '</div>' +
        '<div class="market_dialog_contents">' +
            '<div class="market_dialog_content_frame">' +
                '<div class="market_dialog_content">' +
                    '<div>' +
                        '<div class="tags-container"></div>' +
                        '<div class="tag-textbox"><input type="text" style="width:100%" id="market_getexp_dialog_exptext" /></div>' +
                    '</div>' +
                '</div>' +
                '<div class="market_dialog_content_separator"></div>' +
                '<div class="market_dialog_content market_dialog_content_dark">' +
                    '<div class="market_sell_dialog_input_area">' +
                        //'<a id="market_getexp_dialog_accept" href="#" class="btn_green_white_innerfade btn_small_wide"><span>Buy missing parts</span></a>' +
                        '<a id="market_getexp_dialog_gen" href="#" class="btn_green_white_innerfade btn_small_wide"><span>Generate</span></a>' +
                        '<div>&nbsp;<br /><br /></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';

    dialog += '<div id="market_grind_dialog" class="market_modal_dialog" style="display: none;">' +
        '<div class="market_dialog_title">' +
            '<span id="market_grind_dialog_title" >Turn into gems</span>' +
            '<span class="market_dialog_cancel">' +
                '<a id="market_grind_dialog_cancel" href="#" class="market_dialog_title_cancel">Cancel<span class="market_dialog_title_cancel_X">X</span></a>' +
            '</span>' +
        '</div>' +
        '<div class="market_dialog_contents">' +
            '<div class="market_dialog_content_frame">' +
                '<div class="market_dialog_content">' +
                    '<div>' +
                        '<div class="tags-container">Did you want to convert these items into Gems? It cannot be undone.</div>' +
                    '</div>' +
                '</div>' +
                '<div class="market_dialog_content_separator"></div>' +
                '<div class="market_dialog_content market_dialog_content_dark">' +
                    '<div class="market_sell_dialog_input_area">' +
                        //'<a id="market_grind_dialog_accept" href="#" class="btn_green_white_innerfade btn_small_wide"><span>Buy missing parts</span></a>' +
                        '<a id="market_grind_dialog_grind" href="#" class="btn_green_white_innerfade btn_small_wide"><span>Ok</span></a>' +
                        '<div>&nbsp;<br /><br /></div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    $J('body').append(dialog);
}

var CalculateSellingPrice = function (basePrice) {
    var calPrice = basePrice;
    if ($J('#cb_adtype').val() == '2') {
        var per = Math.round((basePrice * parseFloat($J('#Txt_adjust').val())) / 100);
        if (per == 0 && parseFloat($J('#Txt_adjust').val()) != 0) per = (parseFloat($J('#Txt_adjust').val()) < 0 ? -1 : 1);
        calPrice = basePrice + per;
    }
    else {
        calPrice = basePrice + Math.floor(parseFloat($J('#Txt_adjust').val()) * 100);
    }

    if (calPrice <= 0) calPrice = basePrice;
    return calPrice;
}

var ContinueListing = function () {
    if (!SellItemDialog.b_isInterupted) return;
    SellItemDialog.b_isInterupted = false;

    console.log('Resume listing');

    var firstItem = $J('.queue-item-container:has(>span.price)');
    if (firstItem.length == 0) return;
    var rgItem = firstItem[0].rgItem;

    if (!UpdateSellItem(rgItem)) return;

    if ($J('#ck_autoaccept').is(':checked')) {
        if ($J('#market_sell_dialog').is(':visible'))
            window.setTimeout('SellItemDialog.OnConfirmationAccept({stop:function(){}});', window.delaylistings);
    }

}

var SetupAcceptAllGifts = function () {

    if ($J('#tabcontent_pendinggifts .pending_gift').length == 0) return;
    var divCnt = $J('<div style="padding: 20px" />');
    var AcceptAllGifts = $J('<a href="#" class="btn_darkblue_white_innerfade btn_medium new_trade_offer_btn"><span>Add all to my Steam Gift Inventory</span></a>');// CreateMarketActionButton('yellow', '#', 'Add all to my Steam Gift Inventory');
    divCnt.append(AcceptAllGifts);

    $J(AcceptAllGifts).click(function (e) {
        e.preventDefault();
        var giftIds = [];
        $J('#tabcontent_pendinggifts .pending_gift > div[id^="pending_gift_"]').each(function () {
            var thisID = $J(this).attr('id');
            var giftID = thisID.substring(13);
            giftIds.push(giftID);
            ShowAcceptGiftOptions(giftID);
            DoAcceptGift(giftID, false);
        });
    });

    $J('#tabcontent_pendinggifts .pending_gifts_header').after(divCnt);

}

BuySetDialog = {
    m_bInitialized: false,
    m_oItemsToBuy: [],
    m_fnDocumentKeyHandler: null,
    Initialize: function () {
        //$('market_buyset_dialog_accept').observe('click', this.OnAccept.bindAsEventListener(this));
        $('market_buyset_dialog_cancel').observe('click', this.OnCancel.bindAsEventListener(this));
        $('market_buyset_dialog_reload').observe('click', this.OnReload.bindAsEventListener(this));

        $('market_buyset_dialog').style.visibility = 'hidden';
        $('market_buyset_dialog').show();
        // TODO: Slider
        $('market_buyset_dialog').hide();
        $('market_buyset_dialog').style.visibility = '';

        this.m_bInitialized = true;
    },
    Show: function (items) {
        if (!this.m_bInitialized)
            this.Initialize();
        if (items.length == 0) return;
        m_oItemsToBuy = items;
        this.m_fnDocumentKeyHandler = this.OnDocumentKeyPress.bindAsEventListener(this);
        $(document).observe('keydown', this.m_fnDocumentKeyHandler);
        showModal('market_buyset_dialog', true);
        this.OnReload({ stop: function () { } });
    },
    OnCancel: function (event) {
        this.Dismiss();
        event.stop();
    },

    Dismiss: function () {
        $(document).stopObserving('keydown', this.m_fnDocumentKeyHandler);
        hideModal('market_buyset_dialog');
        if (this.m_modal)
            this.m_modal.Dismiss();
    },
    OnAccept: function (event) {
        event.stop();
    },
    OnReload: function (event) {
        event.stop();

        $J('#lstParts').html('<img src="' + window.location.protocol + '//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" class="loading" alt="Working...">');
        for (var i = 0; i < m_oItemsToBuy.length; i++) {
            var it = m_oItemsToBuy[i];
            //var li = $J('<div>');
            //li.html(it.name + ' (' + it.price + ')');
            //li[0].item = it;
            $J.get(it.link + "/render/?query=&start=0&count=1&country=" + g_rgWalletInfo['wallet_country'] + "&language=" + g_strLanguage +
                "&currency=" + g_rgWalletInfo['wallet_currency'],
                function (data, textStatus) {
                    $J('#lstParts').find('img.loading').remove();
                    if (data.success) {
                        var listDiv = $J(data.results_html);
                        $J('#lstParts').append(listDiv);
                        $J('#lstParts').find('.market_listing_table_header').remove();
                        listDiv.find('a.item_market_action_button.item_market_action_button_green').each(function () {
                            var $row = $J(this).parents('.market_listing_row');
                            var match = buyingExp.exec($J(this).attr('href'));
                            if (match) {
                                $J(this).attr('href', '#');
                                $J(this).find('.item_market_action_button_contents').html(SIHLang.quickbuy);
                                AddItemHoverToElement(this, data.assets[match[2]][match[3]][match[4]]);
                                $J(this).click(function () {
                                    $J(this).hide();
                                    var obj = {
                                        listingid: match[1],
                                        appid: match[2],
                                        contextid: match[3],
                                        id: match[4]
                                    };
                                    var rgListing = data.listinginfo[obj.listingid]
                                    var dat = {
                                        sessionid: g_sessionID,
                                        currency: g_rgWalletInfo['wallet_currency'],
                                        subtotal: rgListing['converted_price'],
                                        fee: rgListing['converted_fee'],
                                        total: rgListing['converted_price'] + rgListing['converted_fee'],
                                        quantity: 1
                                    }

                                    //var setLink = 'http://steamcommunity.com/market/priceoverview/?appid=570&country=' + g_strCountryCode + '&currency=' + g_rgWalletInfo['wallet_currency'] +
                                    //    '&market_hash_name=' + data.assets[match[2]][match[3]][match[4]].market_hash_name;

                                    //var itemLink = "http://steamcommunity.com/market/priceoverview/?appid=" + obj.appid + "&country=" + g_strCountryCode +
                                    //    "&currency=" + g_rgWalletInfo['wallet_currency'] + "&market_hash_name=" + data.assets[match[2]][match[3]][match[4]].market_hash_name;
                                    //console.log(cachePrices[setLink]);
                                    //cachePrices[setLink].owned = true;
                                    //return false;

                                    $row.find('.market_listing_buy_button').append('<img src="' + window.location.protocol + '//steamcommunity-a.akamaihd.net/public/images/login/throbber.gif" alt="Working...">');
                                    $J.ajax({
                                        url: 'https://steamcommunity.com/market/buylisting/' + obj.listingid,
                                        type: 'POST',
                                        data: dat,
                                        crossDomain: true,
                                        xhrFields: { withCredentials: true }
                                    }).done(function (data1) {
                                        if ($row.is(':visible'))
                                            $row.find('.market_listing_buy_button').html('Success');
                                        else
                                            alert('Success');
                                    }).fail(function (jqxhr) {
                                        $row.find('.market_listing_buy_button img').remove();
                                        var data1 = $J.parseJSON(jqxhr.responseText);
                                        if (data1 && data1.message) {
                                            alert(data1.message);
                                        }
                                    });
                                    return false;
                                });
                            }
                        });
                    }
                }
            );
        }
    },
    OnDocumentKeyPress: function (event) {
        if (event.keyCode == Event.KEY_ESC) {
            this.Dismiss();
            event.stop();
        }
    },
}

GrindDialog = {
    m_bInitialized: false,
    m_bIsDismissed: true,
    m_fnDocumentKeyHandler: null,
    m_modal: null,
    m_elDialogContent: null,
    Initialize: function () {
        //$('market_grind_dialog_accept').observe('click', this.OnAccept.bindAsEventListener(this));
        $('market_grind_dialog_cancel').observe('click', this.OnCancel.bindAsEventListener(this));
        $('market_grind_dialog_grind').observe('click', this.OnGrind.bindAsEventListener(this));

        $('market_grind_dialog').style.visibility = 'hidden';
        $('market_grind_dialog').show();
        // TODO: Slider
        $('market_grind_dialog').hide();
        $('market_grind_dialog').style.visibility = '';

        this.m_elDialogContent = $('market_grind_dialog');

        this.m_bInitialized = true;
    },
    Show: function () {

        if (!this.m_bInitialized)
            this.Initialize();
        this.m_bIsDismissed = false;
        this.m_fnDocumentKeyHandler = this.OnDocumentKeyPress.bindAsEventListener(this);
        $(document).observe('keydown', this.m_fnDocumentKeyHandler);
        this.m_modal = new CModal($J(this.m_elDialogContent));
        this.m_modal.Show();
    },
    OnCancel: function (event) {
        this.Dismiss();
        event.stop();
    },

    Dismiss: function () {
        $(document).stopObserving('keydown', this.m_fnDocumentKeyHandler);
        //hideModal('market_grind_dialog');

        if (this.m_modal)
            this.m_modal.Dismiss();
        this.m_bIsDismissed = true;
        $J('div.queue-container').remove();
    },
    OnAccept: function (event) {
        event.stop();
    },
    OnGrind: function (event) {
        event.stop();
        GrindNextItem();
    },
    OnDocumentKeyPress: function (event) {
        if (event.keyCode == Event.KEY_ESC) {
            this.Dismiss();
            event.stop();
        }
    },
}

GenExpDialog = {
    m_bInitialized: false,
    m_oItem: null,
    m_fnDocumentKeyHandler: null,
    Initialize: function () {
        //$('market_getexp_dialog_accept').observe('click', this.OnAccept.bindAsEventListener(this));
        $('market_getexp_dialog_cancel').observe('click', this.OnCancel.bindAsEventListener(this));
        $('market_getexp_dialog_gen').observe('click', this.OnGenerate.bindAsEventListener(this));

        $('market_getexp_dialog').style.visibility = 'hidden';
        $('market_getexp_dialog').show();
        // TODO: Slider
        $('market_getexp_dialog').hide();
        $('market_getexp_dialog').style.visibility = '';
        $J('#market_getexp_dialog_exptext').click(function () {
            $J(this).select();
        });
        this.m_bInitialized = true;
    },
    Show: function (item) {
        if (!this.m_bInitialized)
            this.Initialize();
        if (!item) return;
        this.m_oItem = item;
        this.m_fnDocumentKeyHandler = this.OnDocumentKeyPress.bindAsEventListener(this);
        $(document).observe('keydown', this.m_fnDocumentKeyHandler);
        this.CreateList();
        showModal('market_getexp_dialog', true);
    },
    CreateList: function () {
        var container = $J('#market_getexp_dialog .tags-container');
        container.empty();
        for (var i = 0; i < this.m_oItem.length; i++) {
            var tag = this.m_oItem[i];
            var ck = $J('<input type="checkbox" checked="checked" id="ck_tag_' + tag.internal_name + '"/>');
            ck.data('exp', tag);
            container.append(ck);
            container.append(' ' + tag.category_name + ': ' + tag.name + '<br />');
        }
        this.OnGenerate({ stop: function () { } });
        //console.log('1');
    },
    OnCancel: function (event) {
        this.Dismiss();
        event.stop();
    },

    Dismiss: function () {
        $(document).stopObserving('keydown', this.m_fnDocumentKeyHandler);
        hideModal('market_getexp_dialog');

        if (this.m_modal)
            this.m_modal.Dismiss();
    },
    OnGenerate: function (event) {
        event.stop();
        var container = $J('#market_getexp_dialog .tags-container');
        var exp = '';
        var cats = [];
        container.find('input[type=checkbox]').each(function () {
            if ($J(this).prop('checked')) {
                var tag = $J(this).data('exp');
                if (cats.indexOf(tag.category) >= 0) return;
                exp += ',"' + tag.category + '":"' + tag.internal_name + '"';
                cats.push(tag.category);
            }
        });
        if (exp.length > 0) exp = "{" + exp.substring(1) + "}";
        $J('#market_getexp_dialog_exptext').val(exp);
        $J('#market_getexp_dialog_exptext').select();

    },
    OnDocumentKeyPress: function (event) {
        if (event.keyCode == Event.KEY_ESC) {
            this.Dismiss();
            event.stop();
        }
    }
}



setTimeout(function () {
    //INVENTORY_PAGE_ITEMS = 36;
    //INVENTORY_PAGE_WIDTH = 104 * 6
    sellcurrencyId = typeof (g_rgWalletInfo) != 'undefined' ? g_rgWalletInfo['wallet_currency'] : 1;
    if (typeof (window.currency) != 'undefined' && window.currency != '')
        currencyId = window.currency;
    else
        currencyId = sellcurrencyId;

    var qs = function (key) {
        key = key.replace(/[*+?^$.\[\]{}()|\\\/]/g, "\\$&"); // escape RegEx meta chars
        var match = location.search.match(new RegExp("[?&]" + key + "=([^&]+)(&|$)"));
        return match && decodeURIComponent(match[1].replace(/\+/g, " "));
    };
    $J('.inventory_page_right .hover_item_name').after('<h2 class="dd_price"></h2>');
    if (window.usevector) {
        $J('.inventory_page_right .hover_item_name').after('<a href="javascript:void(0)" id="lnk_Medium" style="clear:both; display: block">use this as vector</a>');
        var _mediumName = GetCookie('mediumname');
        var _mediumAppid = GetCookie('mediumappid');
        $J('#lnk_Medium').click(function () {
            SetCookie('mediumname', g_ActiveInventory.selectedItem.market_hash_name, 365 * 10, '/');
            SetCookie('mediumappid', g_ActiveInventory.selectedItem.appid, 365 * 10, '/');
            getMediumPrice(g_ActiveInventory.selectedItem);
            return false;
        });

        if (_mediumName && _mediumAppid) {
            getMediumPrice({ market_hash_name: _mediumName, appid: _mediumAppid });
        }
    }
    //$('.dd_price').html("Loading...");
    apiKey = (window._apikey != '' ? window._apikey : apiKey);

    $J('body').on('click', '.item', function (e) {
        //extimatePrice(g_ActiveInventory.selectedItem);
        getLowestPriceHandler();
        $J('.equiped').remove();
        $J('.review').remove();
        //if (g_ActiveInventory.selectedItem.equipped)
        //    $J('.hover_item_name:visible').after('<div class="equiped" style="float: left">Equipped</div>');
        if (g_ActiveInventory.selectedItem.defindex) {
            var hero = '';
            $J.each(g_ActiveInventory.selectedItem.tags, function (i, e) {
                var tag = g_ActiveInventory.selectedItem.tags[i];
                //console.log(tag);
                if (tag.category === 'Hero') {
                    //npc_dota_hero_legion_commander
                    hero = tag.internal_name.substring(14);
                    if (dotahatteryAlias[hero])
                        hero = dotahatteryAlias[hero];
                }
            });
            if (hero != '')
                $J('.hover_item_name:visible').after('<a href="http://dotahattery.com/?h=' + hero + '&id[]=' + g_ActiveInventory.selectedItem.defindex + '" class="equiped" style="display: block; margin:3px; float: left" target="_blank">Preview</a>');
        }
        //$J.each(apiItems[g_ActiveUser.strSteamId], function (i, o) {
        //    if (o.id == g_ActiveInventory.selectedItem.id) {
        //        if (o.equipped) {
        //            $J('.hover_item_name:visible').after('<div class="equiped">Equiped</div>');
        //        }
        //        //$J(elDescriptions).prepend('<div>Equiped</div>');
        //        return false;
        //    }
        //});

        if (selectmode) {
            if (this.rgItem && (this.rgItem.marketable || this.rgItem.appid == 753)) {
                $J(this).toggleClass('selectedSell');
                $J('.similar-item').removeClass('similar-item');
                var p_market_hash_name = this.rgItem.market_hash_name;
                var iclassid = this.rgItem.classid;
                var bselected = $J(this).hasClass('selectedSell');
                if (e.ctrlKey) {
                    $J('.inventory_ctn:visible .inventory_page .item').each(function (i, el) {
                        if (this.rgItem.marketable && this.rgItem.classid == iclassid) {
                            if (bselected) {
                                g_ActiveInventory.LoadItemImage(this);
                                $J(this).addClass('selectedSell');
                            }
                            else
                                $J(this).removeClass('selectedSell');
                        }
                    });
                }
                else if (bselected) {
                    $J('.inventory_ctn:visible .inventory_page .item').each(function (i, el) {
                        if (this.rgItem.market_hash_name == p_market_hash_name && this.rgItem.marketable) {
                            $J(this).addClass('similar-item');
                        }
                    });
                }

                if (e.shiftKey && lastSelectedItem) {
                    var lastContainer = $J(lastSelectedItem).parent('.itemHolder');
                    var itemsPage = lastContainer.parent('.inventory_page');
                    var idx1 = lastContainer.index(), idx2 = $J(this).parent('.itemHolder').index(),
                        pidx1 = itemsPage.index(), pidx2 = $J(this).parents('.inventory_page').index();

                    if ((pidx1 == pidx2 && idx1 > idx2) || (pidx2 < pidx1)) {
                        var tmp = idx1;
                        idx1 = idx2; idx2 = tmp;
                    }
                    //console.log(pidx1 + '-' + idx1 + ' ' + pidx2 + '-' + idx2);
                    for (var pi = pidx1; pi <= pidx2; pi++) {
                        var filter = '.inventory_ctn:visible .inventory_page:eq(' + pi + ') .itemHolder';
                        if (pi == pidx1) {
                            filter += ':gt(' + idx1 + ')';

                            if (pi == pidx2) {
                                filter += ':lt(' + (idx2 - idx1) + ')';
                            }
                        }
                        else if (pi == pidx2) {
                            filter += ':lt(' + idx2 + ')';
                        }

                        $J(filter + '[style!="display: none;"] .item').each(function () {
                            if (this.rgItem && (this.rgItem.marketable || this.rgItem.appid == 753)) {
                                $J(this).addClass('selectedSell');
                            }
                        });

                        //for (var i = idx1 + 1; i <= idx2; i++) {
                        //    itemsPage.find('.itemHolder:eq(' + i + ')[style!="display: none;"] .item ').addClass('selectedSell');
                        //}
                    }

                    if (itemsPage.is(':visible')) {

                    }
                }

                var itC = $J('.selectedSell').length;
                if (itC > 0) {
                    $J('#Lnk_ShowSellMulti .item_market_action_button_contents').html((itC > 1 ? SIHLang.sellnitem.replace('$1', itC) : SIHLang.sell1item));
                    $J('#Lnk_ShowSellMulti').show();
                    if (g_ActiveInventory.appid == 753) {
                        $J('#Lnk_TurnIntoGems').show();
                        $J('#Lnk_SendGifts').show();
                    }
                }
                else {
                    $J('#Lnk_ShowSellMulti').hide();
                    $J('#Lnk_TurnIntoGems').hide();
                    $J('#Lnk_SendGifts').hide();
                }

                lastSelectedItem = this;
            }
            return false;
        }
    });

    //var btSellSelected = '<a class="item_market_action_button item_market_action_button_green" href="javascript:void();" id="btSellSelected"><span class="item_market_action_button_edge item_market_action_button_left"></span><span class="item_market_action_button_contents">Sell selected items</span><span class="item_market_action_button_edge item_market_action_button_right"></span><span class="item_market_action_button_preload"></span></a>'
    //$J('.item_market_actions').append(btSellSelected);
    if (g_bViewingOwnProfile) {
        ModifySellingFuntions();
        ModifyMarketActions();
    }

    ModifyDescriptionFunction();
    AddDialogHTML();
    ModifyItemDisplay();
    SetupAcceptAllGifts();


    if (window.extprice) {
        var divRight = $J('<div class="sih-functions-panel" />');

        var divExtPrices = $J('<div>External prices: </div>');
        var cb = $J('<select class="side-dropdown" id="cb_ExternalPrices"></select>');
        divExtPrices.append(cb);
        divRight.append(divExtPrices);

        cb.change(function () {
            var _api = ExternalPrices[g_ActiveInventory.appid].apis[parseInt($J(this).val())];
            if (_api && _api.api && _api.api.SetPrice) {
                _api.api.SetPrice(g_ActiveInventory.appid);
                SetCookie('lastext_' + g_ActiveInventory.appid, $J(this).val(), 356);
            }
        });
        $J('#inventory_pagecontrols').before(divRight);
        if (g_ActiveInventory && g_ActiveInventory.appid) {
            SetupExternalDropdown(g_ActiveInventory.appid);
        }
        ModifyShowItemInventory();
    }


    if (window.simplyinvent) {
        ModifyGamesTabs();
    }
    if (window.gpdelayscc) {
        PriceQueue._successDelay = window.gpdelayscc;
    } if (window.gpdelayerr) {
        PriceQueue._failureDelay = window.gpdelayerr;
    }
    ReloadLang();
}, 10);

var SetupExternalDropdown = function (appid) {
    $J('#cb_ExternalPrices').empty();
    if (ExternalPrices[appid]) {
        var lastAPI = GetCookie('lastext_' + appid);
        if (lastAPI != null) {
            lastAPI = parseInt(lastAPI);
        } else {
            lastAPI = 0;
        }
        $J.each(ExternalPrices[appid].apis, function (idx, el) {
            if (this.api && this.api.GetPrices) {
                var opt = $J('<option value="' + idx + '"></option>');
                opt.text(this.name);
                if (idx == lastAPI) {
                    opt.prop('selected', true);
                }
                if (this.isApproved) {
                    opt.prop('selected', true);
                }
                $J('#cb_ExternalPrices').append(opt);
            }
        });
    }
}

var econItemExp = /data-economy-item="(\d+)\/(\d+)\/(\d+)\/(\d+)"/gi
var GetItemsInTrades = function () {
    $J.ajax({
        url: '//steamcommunity.com/my/tradeoffers/sent/',

        success: function (res) {
            var m = null;
            while (m = econItemExp.exec(res)) {

                itemsInTrades.push({
                    id: m[3],
                    appid: parseInt(m[1]),
                    context: parseInt(m[2])
                });
                var elIt = $J('div.item[id=item' + m[1] + '_' + m[2] + '_' + m[3] + ']');
                elIt.addClass('item-in-trade');
            }
        }
    });
}();