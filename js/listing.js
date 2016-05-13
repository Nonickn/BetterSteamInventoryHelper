// This script written by VplGhost
// Email: vplghost@gmail.com

var sGen = document.createElement('script');
sGen.src = chrome.extension.getURL('js/lang/_gen.js');
(document.head || document.documentElement).appendChild(sGen);

var cssF = document.createElement('link');
cssF.href = chrome.extension.getURL('css/listings.css');
cssF.rel = 'stylesheet';
cssF.type = 'text/css';
(document.head || document.documentElement).appendChild(cssF);

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

chrome.storage.sync.get({
    sound: 'offersound.mp3',
    resultnumber: 10,
    shownotify: true,
    quickbuybuttons: true,
    showbookmarks: true,
    bookmarkscategories: null,
    gpdelayscc: 2500,
    gpdelayerr: 5000,
    agp_hover: true,
    agp_gem: true,
    agp_sticker: true,
    lang: ''
}, function (items) {
    var actualCode = ['window.replaceBuy = ' + items.quickbuybuttons,
        'window.noOfRows = ' + items.resultnumber,
        'window.gpdelayscc = ' + items.gpdelayscc + ';',
        'window.gpdelayerr = ' + items.gpdelayerr + ';',
        'window.agp_hover = ' + items.agp_hover + ';',
        'window.agp_gem = ' + items.agp_gem + ';',
        'window.agp_sticker = ' + items.agp_sticker + ';'
    ].join('\n');

    var script = document.createElement('script');
    script.textContent = actualCode;
    (document.head || document.documentElement).appendChild(script);
    script.parentNode.removeChild(script);

    var sLang = document.createElement('script');
    if (items.lang == '')
        sLang.src = chrome.extension.getURL('js/lang/' + chrome.i18n.getMessage("langcode") + '.js');
    else
        sLang.src = chrome.extension.getURL('js/lang/' + items.lang + '.js');

    if (items.showbookmarks) {
        chrome.storage.local.get({
            bookmarks: null
        }, function (subitems) {
            showBookmarks(subitems.bookmarks, items.bookmarkscategories);
        });
    }

    (document.head || document.documentElement).appendChild(sLang);
    sLang.onload = function () {
        sLang.parentNode.removeChild(sLang);
    };
});

var sCommon = document.createElement('script');
sCommon.src = chrome.extension.getURL('js/hovermod.script.min.js');
(document.head || document.documentElement).appendChild(sCommon);
sCommon.onload = function () {
    var sOffer = document.createElement('script');
    sOffer.src = chrome.extension.getURL('js/listing.script.min.js');
    (document.head || document.documentElement).appendChild(sOffer);
    sOffer.onload = function () {
        sOffer.parentNode.removeChild(sOffer);
    };

    sCommon.parentNode.removeChild(sCommon);
};

var showBookmarks = function (bookmarks, bookmarkscategories) {
    var itemlink = $('.market_listing_nav > a:last-child');
    var m = /\/\/steamcommunity.com\/market\/listings\/(\d+)\/(.+)/.exec(itemlink.attr('href'));
    if (!m) return;
    var name = itemlink.text();
    var hashname = m[2];
    var appid = m[1];
    var img = $('.market_listing_largeimage > img').prop('src');
    var color = $('#largeiteminfo_item_name').css('color');
    var hashmarket = appid + '/' + hashname;
    var gamename = $('.market_listing_nav > a:nth(0)').text();

    var div = $('<div class="add-to-bookmarks-container"></div>');
    var addLink = $('<a href="javascript:void(0)" class="add-to-bookmarks-link" ><span class="text">Add to bookmarks</span> <span class="arrow">▼</span></a>');
    //$('#largeiteminfo_item_name').after(addLink);
    if (bookmarks && bookmarks[hashmarket]) {
        var html = 'Added';
        if (bookmarks[hashmarket].cat && bookmarkscategories && bookmarkscategories[bookmarks[hashmarket].cat])
            html += ' to ' + bookmarkscategories[bookmarks[hashmarket].cat];
        else
            html += ' to General';

        addLink.find('.text').html(html);
        //addLink.css('backgroundImage', 'url(//store.akamai.steamstatic.com/public/images/v6/store_checkbox_blue.png)');
    }
    div.append(addLink);

    $('.market_page_fullwidth.market_listing_firstsection').css({ position: 'relative' }).append(div);
    var ul = $('<ul class="add-to-bookmarks">');
    ul.append('<li><a href="#">General</a>');
    if (bookmarkscategories)
        $.each(bookmarkscategories, function (id, cat) {
            ul.append('<li><a href="#" data-id="' + id + '">' + cat + '</a>');
        });
    div.append(ul);
    addLink.click(function () {
        ul.toggle();
        if (ul.is(':visible')) {
            addLink.find('.arrow').text('▲');
        }
        else {
            addLink.find('.arrow').text('▼');
        }
    });
    ul.find('a').click(function (e) {
        $this = $(this);
        chrome.storage.local.get({
            bookmarks: null
        }, function (items) {
            var bookmarks = items.bookmarks || {};
            var idcat = $this.data('id');
            var item = {
                hashmarket: hashmarket,
                name: name,
                appid: appid,
                img: img,
                color: color,
                gamename: gamename
            }
            var html = 'Added';

            if (idcat) {
                html += ' to ' + bookmarkscategories[idcat];
                item.cat = idcat;
            }
            else
                html += ' to General';

            bookmarks[hashmarket] = item;
            console.log(bookmarks);
            chrome.storage.local.set({
                bookmarks: bookmarks
            });


            addLink.find('.text').html(html);
            //addLink.css('backgroundImage', 'url(//store.akamai.steamstatic.com/public/images/v6/store_checkbox_blue.png)');
            addLink.find('.arrow').text('▼');
            ul.hide();
            //addLink.attr('style', 'background: url(//store.akamai.steamstatic.com/public/images/v6/store_checkbox_blue.png) bottom left no-repeat; padding-left: 20px; margin: 7px 0px; display: inline-block');
        });
        e.preventDefault();
    });
};