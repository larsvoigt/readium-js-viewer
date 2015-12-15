define([], function () {

        var DZB = {};
        
        const EPUB_TYPE_PAGE_LIST = 'page-list';
        const EPUB_TYPE_LANDMARKS = 'landmarks';

        //$(window).on('readepub', eventHandler);
        //$(window).on('loadlibrary', eventHandler);


        DZB.customizationsForTouchDevice = function () {

            // todo: find a better way to this action because it is once on initialisation necessary 
            if (isTouchDevice())
                disableToolTipsOnMobileDevices();
        };

        DZB.loadNavPageList = function (dom) {
         
            loadNavElement(dom, EPUB_TYPE_PAGE_LIST);
        };

        DZB.loadNavLandmarks = function (dom) {

            loadNavElement(dom, EPUB_TYPE_LANDMARKS);
        };


        // The intention for this function that reflowable documents creates a 
        // partial pagination offset when focus on hyperlinks
        DZB.ignoreHyperlinksAtTabbing = function () {

            $('#epubContentIframe').contents().find("a").each(function() {
                $(this).attr('tabindex', '-1');
            });
        };
        
        DZB.testCfiHighlighting = function (readium) {

            setTimeout(function () {

                readium.reader.plugins.annotations.removeHighlight(999999);
                readium.reader.plugins.annotations.addHighlight(
                    "id-id2635343",
                    "/4/2[building_a_better_epub]/4,/1:106,/1:110",
                    999999,// Math.floor((Math.random() * 1000000)),
                    "highlight", //"underline"
                    undefined  // styles
                ), 600


                setTimeout(function () {

                    var $epubContentIframe = $('#epubContentIframe');
                    //$epubContentIframe[0].contentDocument.designMode = "on";
                    var startMarker = $epubContentIframe.contents().find(".range-start-marker")[0];
                    var range = document.createRange();


                    $(startMarker.nextSibling).wrap('<span id="searchResult" tabindex="-1" style="display:inline"></span>');
                    var $searchResult = $epubContentIframe.contents().find("#searchResult");
                    //$searchResult.css("color", "#1182ba");
                    //$searchResult.css("background-color", "yellow");

                    $searchResult.css("border", "1px dotted");
                    $searchResult.focus();

                    //range.setStart(startMarker.nextSibling , 0);
                    //range.setEnd(startMarker.nextSibling, 4);
                    //var sel = window.getSelection();
                    //sel.removeAllRanges();
                    //sel.addRange(range);
                }, 1000);
            });

        };


        function loadNavElement(dom, epubType) {
            
            if (dom) {
                var pageListNav;
                var $navs = $('nav', dom);
                Array.prototype.every.call($navs, function (nav) {
                    if (nav.getAttributeNS('http://www.idpf.org/2007/ops', 'type') == epubType) {
                        pageListNav = nav;
                        //console.log($(pageListNav).html());
                        return false;
                    }
                    return true;
                });
                
                if (pageListNav) {
                    $(pageListNav).addClass(epubType).removeAttr('hidden');
                    $('#readium-toc-body').append(pageListNav);
                }
            }
        };

        
        function disableToolTipsOnMobileDevices() {
            console.debug("disableToolTipsOnMobileDevices");
            // prevent the user need to click twice to select any menu item
            $("nav *[title]").removeAttr('title');
        }


        function isTouchDevice() {
            return (('ontouchstart' in window)
            || (navigator.MaxTouchPoints > 0)
            || (navigator.msMaxTouchPoints > 0));
        }

        return DZB;
    }
);