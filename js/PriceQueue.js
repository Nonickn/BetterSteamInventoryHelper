var expMarketHashName = /market_hash_name=([^&]+)/;
var expCountryCode = /country=([^&]+)/;
var expCurrencyID = /currency=([^&]+)/;
var expAppID = /appid=([^&]+)/;
if (!window.SIHID) {
    window.SIHID = 'cmeakgjggjdlcpncigglobpjbkabhmjl';
    //window.SIHID = 'eggogcjcakfmimappcfccfffjfcgclal';
}

var PriceQueue = {
    _numberOfErrors: 0,
    _currentError: 0,
    _isRunning: false,
    _isInit: false,
    _successDelay: 2500,
    _failureDelay: 5000,
    _queue: {},
    _urls: [],
    _cache: {},
    _currentproviderIdx: 0,
    _rebuildURL: function (url) {

        var _appid = expAppID.exec(url)[1];
        var _countryCode = expCountryCode.exec(url)[1];
        var _currencyID = expCurrencyID.exec(url)[1];
        var _marketHashName = expMarketHashName.exec(url)[1];

        if (!_currencyID || _currencyID == 'undefined' || isNaN(parseInt(_currencyID))) {
            _currencyID = 1;
        }
        url = 'appid=' + _appid + '&country=' + _countryCode + '&currency=' + _currencyID + '&market_hash_name=' + _marketHashName;
        return url;
    },
    GetPrice: function (options) {
        if (!PriceQueue._isInit) {
            PriceQueue.Init();
        }

        options.url = PriceQueue._rebuildURL(options.url);

        if (PriceQueue._cache[options.url]) {
            var cache = PriceQueue._cache[options.url];
            options.success(cache.response, options.pars);
        } else {
            if (!PriceQueue._queue[options.url]) {
                PriceQueue._queue[options.url] = { url: options.url, handlers: [], pars: [] };
                if (options.insert) {
                    PriceQueue._urls.unshift(options.url);
                }
                else {
                    PriceQueue._urls.push(options.url);
                }
            }
            PriceQueue._queue[options.url].handlers.push(options.success);
            PriceQueue._queue[options.url].pars.push(options.pars || null);
            PriceQueue.StartQueue();
            PriceQueue.UpdateLabels();
        }
    },
    PricesProviders: [
        {
            name: 'SteamOverviewPrice',
            getprice: function (appid, countryCode, currencyId, market_hash_name) {
                var cacheURL = 'appid=' + appid + '&country=' + countryCode + '&currency=' + currencyId + '&market_hash_name=' + market_hash_name;
                var url = window.location.protocol + '//steamcommunity.com/market/priceoverview/?appid=' + appid + '&country=' + countryCode + '&currency=' + currencyId + '&market_hash_name=' + market_hash_name;

                $J.ajax({
                    method: "GET",
                    url: url,
                    cacheURL: cacheURL,
                    success: function (response, textStatus, jqXHR) {
                        PriceQueue._generalHandler.success(response, this.cacheURL, 'SteamOverviewPrice');
                    },
                    error: PriceQueue._generalHandler.error,
                    complete: PriceQueue._generalHandler.complete
                });
            }
        },
        {
            name: 'SteamListingPrice',
            getprice: function (appid, countryCode, currencyId, market_hash_name) {
                var cacheURL = 'appid=' + appid + '&country=' + countryCode + '&currency=' + currencyId + '&market_hash_name=' + market_hash_name;
                var url = window.location.protocol + '//steamcommunity.com/market/listings/' + appid + '/' + market_hash_name + '/render/?start=0&count=5&country=' + countryCode + '&language=english&currency=' + currencyId;
                $J.ajax({
                    method: "GET",
                    url: url,
                    cacheURL: cacheURL,
                    success: function (response, textStatus, jqXHR) {
                        if (response && response.success && response.listinginfo) {
                            var price1, price2;
                            price1 = /market_listing_price_with_fee">([\s\S]+?)<\/span>/g.exec(response.results_html);
                            price2 = /market_listing_price_without_fee">([\s\S]+?)<\/span>/g.exec(response.results_html);

                            var _response = { success: true };
                            if (response.total_count > 1) {
                                _response.volume = response.total_count;
                            }
                            if (price1 && price1.length > 1) {
                                _response.lowest_price = price1[1];
                            }

                            if (price2 && price2.length > 1) {
                                _response.median_price = price2[1];
                            }

                            if (v_currencyformat && GetCurrencyCode) {
                                var lstItem = response.listinginfo[Object.keys(response.listinginfo)[0]];
                                for (var i in response.listinginfo) {
                                    if (response.listinginfo[i] && response.listinginfo[i].converted_price) {
                                        lstItem = response.listinginfo[i];
                                        break;
                                    }
                                }

                                _response.lowest_price = v_currencyformat(lstItem.converted_price + lstItem.converted_fee, GetCurrencyCode(currencyId));
                                _response.median_price = v_currencyformat(lstItem.converted_price, GetCurrencyCode(currencyId));
                            }

                            if (price1 == 'sold') {
                                PriceQueue._generalHandler.error();
                            }

                            PriceQueue._generalHandler.success(_response, this.cacheURL, 'SteamListingPrice');
                        }
                        else {
                            PriceQueue._generalHandler.error(true);
                        }
                    },
                    error: PriceQueue._generalHandler.error,
                    complete: PriceQueue._generalHandler.complete
                });
            }
        }
    ],
    StartQueue: function () {
        if (PriceQueue._isRunning) return;
        if (PriceQueue._urls.length > 0) {
            PriceQueue._isRunning = true;
            var url = PriceQueue._urls[0];
            var appid = expAppID.exec(url)[1];
            var countryCode = expCountryCode.exec(url)[1];
            var currencyID = expCurrencyID.exec(url)[1];
            var marketHashName = expMarketHashName.exec(url)[1];

            PriceQueue.PricesProviders[PriceQueue._currentproviderIdx].getprice(appid, countryCode, currencyID, marketHashName);

        } else {
            PriceQueue._currentError = 0;
        }
    },
    UpdateHandler: function () {
    },
    UpdateLabels: function () {
        if (PriceQueue._urls.length == 0) {
            $J('#_priceQueueCont').hide();
        }
        else {
            $J('#_priceQueueCont').show();
            var hashname = '';
            var m = /market_hash_name=([^&]+)/.exec(PriceQueue._urls[0]);
            if (m && m.length > 1) {
                hashname = decodeURI(m[1]);
            }

            $J('#_priceQueueCont .pq-info').html(hashname + '<br />' + PriceQueue._urls.length + ' items remain - ' + PriceQueue._currentError + ' errors');
        }
    },
    GenPriceDescription: function (rgItems) {
        if (!rgItems || !rgItems.descriptions || !rgItems.lowestPrice) return;
        for (var i = 0; i < rgItems.descriptions.length; i++) {
            var des = rgItems.descriptions[i];
            if (des.isprice) return;
        }
        var priceProvider = rgItems.providerName || 'Lowest price';
        var marketLink = window.location.protocol + "//steamcommunity.com/market/listings/" + rgItems.appid + "/" + encodeURIComponent(rgItems.market_hash_name);

        var ddHtml = priceProvider + ": <a href='" + marketLink + "' target='_blank' style='color:#FF0' title='" + rgItems.nofeePrice + "'>" + rgItems.lowestPrice;
        if (rgItems.volume) {
            ddHtml += ' <span style="font-size: 0.9em; font-style: italic">(V: ' + rgItems.volume + ')</span>';
        }

        if (mediumPrice && rgItems.market_hash_name !== mediumName) {
            var price = parseFloat(getNumber(rgItems.lowestPrice)),
                mprice = parseFloat(getNumber(mediumPrice)),
                eq = (price / mprice).toFixed(2);
            ddHtml += ' (' + eq + ' ' + mediumName + ')';
        }

        var pdes = {
            isprice: true,
            type: 'html',
            value: ddHtml
        }

        rgItems.descriptions.unshift(pdes);
    },
    _generalHandler: {
        success: function (response, url, providerName) {
            response.providerName = providerName;

            PriceQueue._cache[url] = { response: response, providerName: providerName };
            if (url == PriceQueue._urls[0]) {
                PriceQueue._urls.shift();
            }
            if (PriceQueue._queue[url]) {
                var handlers = PriceQueue._queue[url].handlers;
                var pars = PriceQueue._queue[url].pars;
                for (var i = 0; i < handlers.length; i++) {
                    try {
                        handlers[i](response, pars[i]);
                    }
                    catch (err) {
                        console.log(err);
                    }
                }
                delete PriceQueue._queue[url];
            }
            $J('#_priceQueueCont .pq-progress').stop().css({ width: '1%' }).animate({ width: '100%' }, PriceQueue._successDelay);
            window.setTimeout(function () { PriceQueue._isRunning = false; PriceQueue.StartQueue(); }, PriceQueue._successDelay);
        },
        error: function (isAppError) {
            PriceQueue._currentError++;
            PriceQueue._numberOfErrors++;
            PriceQueue._currentproviderIdx++;

            if (isAppError) {
                var strUrl = PriceQueue._urls.shift();
                PriceQueue._urls.push(strUrl);
            }

            if (PriceQueue._currentproviderIdx >= PriceQueue.PricesProviders.length) {
                PriceQueue._currentproviderIdx = 0;
                $J('#_priceQueueCont .pq-progress').stop().css({ width: '1%' }).animate({ width: '100%' }, PriceQueue._failureDelay);
                window.setTimeout(function () { PriceQueue._isRunning = false; PriceQueue.StartQueue(); }, PriceQueue._failureDelay);
            }
            else {
                PriceQueue._isRunning = false;
                PriceQueue.StartQueue();
            }

            console.log('No error', PriceQueue._numberOfErrors);
        },
        complete: function () {
            if (PriceQueue.UpdateHandler) {
                PriceQueue.UpdateHandler();
            }
            PriceQueue.UpdateLabels();
        }
    },
    Init: function () {
        if (PriceQueue._isInit) {
            return;
        }

        var cnt = $J('<div id="_priceQueueCont" class="pq-container"><div class="pq-timer"><div class="pq-progress">&nbsp;</div></div><div class="pq-info">&nbsp;</div></div>');
        $J('body').append(cnt);
        PriceQueue._isInit = true;
    }
}

var CSGOFAST = {
    _cache: null,
    GetPrices: function (items, show) {
        if (!CSGOFAST._cache && SIHID) {
            chrome.runtime.sendMessage(SIHID, { type: "CSGOFAST", data: "prices" }, function (e) {
                if (e.success) {
                    CSGOFAST._cache = e.prices;
                    if (show) {
                        CSGOFAST.SetPrice(730);
                    }
                }
            });
        }
        else {
            if (show) {
                window.setTimeout('CSGOFAST.SetPrice(730)', 100);
            }
        }
    },
    SetPrice: function (appid) {
        if (appid != 730 || !CSGOFAST._cache) {
            return;
        }
        var context = 'item' + appid + '_2_';
        var items = $J('[id^="' + context + '"]');
        var crate = ExchangeRates.GetCurrentRate();
        //console.log(items);
        items.each(function () {
            if (!this.rgItem || !CSGOFAST._cache[this.rgItem.market_hash_name]) {
                return;
            }
            var el = $J(this);
            var pprice = el.find('.p-price');
            if (!pprice.length) {
                pprice = $J('<div class="p-price"></div>');
                el.append(pprice);
            }
            var nprice = CSGOFAST._cache[this.rgItem.market_hash_name];
            if (el[0].rgItem) {
                el[0].rgItem.extprice = Math.round(nprice * crate * 100) / 100;
            }
            pprice.prop('title', 'csgofast');
            pprice.text(ExchangeRates.Format(nprice));
        });
    }
}

var TF2BP = {
    _cache: null,
    GetPrices: function (items, show) {
        if (!TF2BP._cache && SIHID) {
            chrome.runtime.sendMessage(SIHID, { type: "TF2BP", data: "prices" }, function (e) {
                if (e.success) {
                    TF2BP._cache = e.prices;

                    if (show) {
                        TF2BP.SetPrice(440);
                    }
                }
            });
        }
        else {
            if (show) {
                window.setTimeout('TF2BP.SetPrice(440)', 100);
            }
        }
    },
    SetPrice: function (appid) {
        if (appid != 440) {
            return;
        }
        var context = 'item' + appid + '_2_';
        var items = $J('[id^="' + context + '"]');
        //console.log(items);
        var strangeModifiers = ['Strange Specialized Killstreak ', 'Strange Professional Killstreak ', 'Strange ', 'Vintage ', 'The ', 'Genuine '];
        items.each(function () {
            if (!this.rgItem || !this.rgItem.tradable) {
                return;
            }
            var nprice = 0, quality = this.rgItem.app_data.quality, tradable = (this.rgItem.tradable ? 'Tradable' : 'Untradable'), craftable = 'Craftable', priceindex = '0';
            var name = this.market_name || this.rgItem.market_hash_name;
            if (!TF2BP._cache.items[name]) {
                for (var i = 0; i < strangeModifiers.length; i++) {
                    if (name.indexOf(strangeModifiers[i]) == 0 && TF2BP._cache.items[name.substr(strangeModifiers[i].length)]) {
                        name = name.substr(strangeModifiers[i].length);
                        break;
                    }
                }
            }
            var isUnusual = false;

            if (name.indexOf('Unusual ') == 0) {
                isUnusual = true;
                name = name.substr(8);
                if (this.rgItem.apivalue && this.rgItem.apivalue.attributes) {
                    for (var iidx = 0; iidx < this.rgItem.apivalue.attributes.length; iidx++) {
                        if (this.rgItem.apivalue.attributes[iidx].defindex == 134) {
                            priceindex = this.rgItem.apivalue.attributes[iidx].float_value;
                            break;
                        }
                    }
                }
            }

            if (!TF2BP._cache.items[name]) {
                return;
            }
            var el = $J(this);
            var pprice = el.find('.p-price');
            if (!pprice.length) {
                pprice = $J('<div class="p-price"></div>');
                el.append(pprice);
            }

            if (TF2BP._cache.items[name].prices &&
                TF2BP._cache.items[name].prices[quality] &&
                TF2BP._cache.items[name].prices[quality][tradable] &&
                TF2BP._cache.items[name].prices[quality][tradable][craftable] &&
                TF2BP._cache.items[name].prices[quality][tradable][craftable][priceindex]) {
                var iprice = TF2BP._cache.items[name].prices[quality][tradable][craftable][priceindex];
                nprice = iprice.value + ' ' + iprice.currency;
                this.rgItem.extcrr = iprice.currency;
                this.rgItem.extprice = iprice.value;
                pprice.prop('title', 'TF2BP');
                pprice.text(nprice);
            }

        });
    }
}

var ExchangeRates = {
    _rates: null,
    GetRate: function () {
        chrome.runtime.sendMessage(SIHID, { type: "exchangerate" }, function (e) {
            if (e && e.success) {
                ExchangeRates._rates = e.rates.rates;
            }
        });
    },
    GetCurrentRate: function () {
        if (currencyId && currencyId > 1 && ExchangeRates._rates != null) {
            var ccode = GetCurrencyCode(currencyId);
            if (ExchangeRates._rates[ccode]) {
                return ExchangeRates._rates[ccode];
            }
            else
                return 1;
        }
        else {
            return 1;
        }
    },
    Format: function (input) {
        if (currencyId && currencyId > 1 && ExchangeRates._rates != null) {
            var ccode = GetCurrencyCode(currencyId);
            if (ExchangeRates._rates[ccode]) {
                input *= ExchangeRates._rates[ccode];
                return v_currencyformat(Math.round(input * 100), ccode);
            }
            else {
                return v_currencyformat(Math.round(input * 100), 'USD');
            }
        }
        else {
            return v_currencyformat(Math.round(input * 100), 'USD');
        }
    }
}

var ExternalPrices = {
    440: {
        apis: [{
            name: 'backpack.tf',
            api: TF2BP
        }]
    },
    730: {
        apis: [{
            name: 'csgofast.com',
            api: CSGOFAST
        }]
    },
    UpdatePrice: function (_currencyid) {
        if (_currencyid && _currencyid > 0) {
            currencyId = _currencyid;
        }
        else {
            currencyId = typeof (g_rgWalletInfo) != 'undefined' ? g_rgWalletInfo['wallet_currency'] : 1;
        }
        var apiIdx = 0;
        if ($J('#cb_ExternalPrices').length) {
            apiIdx = $J('#cb_ExternalPrices').val();
        }
        var _api = ExternalPrices[g_ActiveInventory.appid].apis[apiIdx];

        if (_api && _api.api && _api.api.SetPrice) {
            _api.api.SetPrice(g_ActiveInventory.appid);
        }
    },
    Push: function (data) {

    },
    cusapis: {}
}
ExchangeRates.GetRate();

chrome.runtime.sendMessage(SIHID, { type: "getcustomtotal" }, function (e) {
    if (e) {
        for (var i = 0; i < e; i++) {
            getCustomAPI(i);
        }
    }
})

var getCustomAPI = function (idx) {
    chrome.runtime.sendMessage(SIHID, { type: "getcustom", idx: idx }, function (e) {
        if (!e) return;
        var isApproved = false;
        if (e.aprrovedids && typeof (g_ulTradePartnerSteamID) != 'undefined') {
            var arr = e.aprrovedids;
            for (var i = 0; i < arr.length; i++) {
                if (g_ulTradePartnerSteamID == arr[i]) {
                    var a = $J('<a href="#" class="verified-user" title="">Verified</a>');
                    a.prop('title', 'Verified by ' + e.name);
                    a.text('Verified by ' + e.name);
                    $J('#trade_theirs h2').append(a);
                    isApproved = true;
                    break;
                }
            }
        }
        if (e.prices) {
            if (!ExternalPrices.cusapis[e.name]) {
                var napi = {
                    name: e.name,
                    GetPrices: function (items, show) {
                        if (items && (items.appid || Object.keys(items).length) && show) {
                            var appid = items.appid || items[Object.keys(items)[0]].appid;
                            var $__api = this;
                            window.setTimeout(function () {
                                $__api.SetPrice(appid);
                            }, 100);
                        }
                    },
                    SetPrice: function (appid) {
                        var $__api = this;
                        //console.log($__api);
                        if (!$__api._cache[appid]) {
                            return;
                        }
                        var context = 'item' + appid + '_';
                        var items = $J('[id^="' + context + '"]');
                        var crate = ExchangeRates.GetCurrentRate();
                        //console.log(items);
                        items.each(function () {
                            var name = this.rgItem.market_hash_name || this.rgItem.market_name || this.rgItem.name;
                            if (!this.rgItem || !$__api._cache[appid][name]) {
                                return;
                            }
                            var el = $J(this);
                            var pprice = el.find('.p-price');
                            if (!pprice.length) {
                                pprice = $J('<div class="p-price"></div>');
                                el.append(pprice);
                            }
                            var nprice = $__api._cache[appid][name].lowest;
                            if (el[0].rgItem) {
                                el[0].rgItem.extprice = Math.round(nprice * crate * 100) / 100;
                            }
                            pprice.prop('title', $__api.name);
                            pprice.text(ExchangeRates.Format(nprice));
                        });
                    }
                };
                ExternalPrices.cusapis[e.name] = napi;
                $J.each(e.prices, function (idx, o) {
                    idx = parseInt(idx) + '';
                    if (!ExternalPrices[idx]) {
                        ExternalPrices[idx] = { apis: [] };
                    }
                    ExternalPrices[idx].apis.push({
                        name: e.name,
                        api: ExternalPrices.cusapis[e.name],
                        isApproved: isApproved
                    });
                });
            }
            var capi = ExternalPrices.cusapis[e.name];
            capi._cache = e.prices;
        }
    });
}