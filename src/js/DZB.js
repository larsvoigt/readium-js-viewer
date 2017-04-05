define([
        'readium_shared_js/models/bookmark_data',
        'jquery',
        'hgn!readium_js_viewer_html_templates/help.html',
        'Settings'],
    function (BookmarkData, $, HelpDialog, Settings) {

        var DZB = {};

        const EPUB_TYPE_PAGE_LIST = 'page-list';
        const EPUB_TYPE_LANDMARKS = 'landmarks';

        //$(window).on('readepub', eventHandler);
        //$(window).on('loadlibrary', eventHandler);

        DZB.initial = function () {
            setFocusOnFirstMenuEntry();
        };

        DZB.customize = function () {

            help();
            setIFrameListener();
            customizationsForTouchDevice();
            DZB.setScreenReaderFocusOnFirstVisibleElement();
            removeSettingsButton();
            addTextSizeToogle();
        };


        DZB.setFocusToNearestHeader = function () {

            const $first = getFirstVisibleElement();

            var $el = $first.parent();
            var $h;

            while ($h = hasHeaderAsPredecessor($el), $el.length !== 0 && $h.length === 0)
                $el = $el.parent();

            $el = $h;

            const text = $($el[$el.length - 1]).text();
            var $tocEl = $("#readium-toc-body a").filter(function () {
                // console.log('text : ' + $(this).text() + ' === ' + text);
                return $(this).text() === text;
            });

            const toc = $("#readium-toc-body");

            if ($tocEl.length !== 0) {
                const scrollOffset = $tocEl.position().top - toc.offset().top + toc.scrollTop() - 20;
                console.log('offset: ' + scrollOffset);
                toc.animate({scrollTop: scrollOffset}, "slow");

            } else {
                $tocEl = $('#readium-toc-body li >a')[0];
            }

            // DZB.setScreenReaderFocusOnElement($tocEl);

            setTimeout(function () {
                $tocEl.focus();
            }, 100);

        };


        DZB.forceScrollContinuousAsDefault = function (readerSettings) {

            readerSettings.scroll = "scroll-continuous";
            console.log('Force continuous scroll mode.');
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

            $("#epub-reader-frame iframe").contents().find("a").each(function () {
                $(this).attr('tabindex', '-1');
            });
        };

        DZB.setScreenReaderFocus = function (href) {

            const listener = function () {
                setScreenReaderFocusbyHref(href);
                window.READIUM.reader.removeListener(ReadiumSDK.Events.PAGINATION_CHANGED, listener);
            };

            window.READIUM.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, listener);
        };


        DZB.setScreenReaderFocusOnElement = function ($el) {

            $el.css('border', '4px solid #0027ee');
            $el.attr("tabindex", "-1"); // "A tabindex value of -1 is a special value 
            // that means scripts can focus the element, but not users."
            setTimeout(function () {
                $el.focus();
                console.log($el);

                $el.on('blur', function () {
                    $el.css('border', '');
                });
            }, 500);
        };


        DZB.setScreenReaderFocusOnFirstVisibleElement = function () {
            const listener = function () {
                const $firstVisible = getFirstVisibleElement();
                DZB.setScreenReaderFocusOnElement($firstVisible.parent());
                console.log('focus on first visible');
                window.READIUM.reader.off(ReadiumSDK.Events.PAGINATION_CHANGED, listener);
            };
            window.READIUM.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, listener);
        };
        
        /***********************************************************************************************************
         *
         *   private
         *
         ***********************************************************************************************************/


        function addTextSizeToogle() {
            
            $('.icon-textSize').on('click', function () {

                Settings.get('reader', function (json) {
                    if (!json) {
                        json = {};
                    }

                    json.fontSize = json.fontSize === 100 ? 220 : 100;
                    json.scroll = "scroll-continuous";

                    Settings.put('reader', json);

                    window.READIUM.reader.updateSettings(json);
                });
            });
        }

        function help() {

            const $appContainer = $('#app-container');
            $appContainer.append(HelpDialog({}));
            $('#help-modal').on('hidden.bs.modal', function() {
                const $firstVisible = getFirstVisibleElement();
                DZB.setScreenReaderFocusOnElement($firstVisible.parent());
            });
        }

        function hasHeaderAsPredecessor($el) {

            while ($el.length !== 0 && !$el.is(':header'))
                $el = $el.prev();

            return $el;
        }

        function setFocusOnFirstMenuEntry() {

            $(window).bind('libraryUIReady', function () {

                setTimeout(function () {
                    $('button[tabindex=1]').focus();
                    // console.log('set focus on first menu entry');
                }, 0);
            });
        }


        function removeSettingsButton() {
            const btnSettings = $('#settbutt1');
            if (btnSettings.length > 0)
                btnSettings[0].parentNode.removeChild(btnSettings[0]);
            else
                console.error('Settings button not found!')
        }

        function customizationsForTouchDevice() {

            // todo: find a better way to this action because it is once on initialisation necessary 
            if (isTouchDevice())
                disableToolTipsOnMobileDevices();
        }


        function setIFrameListener() {

            window.READIUM.reader.addIFrameEventListener('focus', function (e) {
                $('iframe').addClass("focus-on-content");
                Keyboard.scope('reader');
            });

            window.READIUM.reader.addIFrameEventListener('blur', function (e) {
                $('iframe').removeClass("focus-on-content");
            });

            window.READIUM.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function () {

                // hideInvisibleForScreenreaderUser();

                // console.log('PAGINATION_CHANGED');
            });
        }


        function setScreenReaderFocusbyHref(href) {

            var hashIndex = href.indexOf("#");
            var filter;

            if (hashIndex >= 0)
                filter = href.substr(hashIndex);
            else
                filter = ":header:first";

            var $el = $('.iframe-fixed').contents().find(filter);
            DZB.setScreenReaderFocusOnElement($el);
        }

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
        }


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


        // function hideInvisibleForScreenreaderUser() {
        //
        //     $('#epubContentIframe').contents().find('*').contents().filter(function () {
        //
        //         return this.nodeType === 3;
        //
        //     }).each(function () {
        //
        //         // console.log($(this).text());
        //         $(this).parent().removeAttr('aria-hidden');
        //
        //         if (!window.READIUM.reader.isElementVisible($(this))) {
        //             $(this).parent().attr('aria-hidden', 'true')
        //         } else {
        //             $(this).parent().attr('aria-hidden', 'false')
        //         }
        //     });
        // }


        function getFirstVisibleElement() {

            const cfi = window.READIUM.reader.getFirstVisibleCfi();
            const range = window.READIUM.reader.getDomRangeFromRangeCfi(new BookmarkData(cfi.idref, cfi.contentCFI));
            return $(range.startContainer);
        }


        //
        // testing
        //
        DZB.testCfiHighlighting = function (readium) {

            setTimeout(function () {


                readium.reader.openSpineItemElementCfi('id-id2642385', '/4/2/38/52,/9:20,/9:27');
                readium.reader.plugins.highlights.removeHighlight(999999);
                readium.reader.plugins.highlights.addHighlight(
                    "id-id2642385",
                    "/4/2/38/52,/9:20,/9:27",
                    999999,// Math.floor((Math.random() * 1000000)),
                    "highlight", //"underline"
                    undefined  // styles
                ), 600
            });

// highlightCfi("/6/30[id-id2642385]!/4/2/38/52,/9:20,/9:27", readium);
        };

        return DZB;
    }
);