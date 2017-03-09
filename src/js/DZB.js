define(['readium_shared_js/models/bookmark_data', 'jquery'], function (BookmarkData, $) {

        var DZB = {};

        const EPUB_TYPE_PAGE_LIST = 'page-list';
        const EPUB_TYPE_LANDMARKS = 'landmarks';

        //$(window).on('readepub', eventHandler);
        //$(window).on('loadlibrary', eventHandler);


        DZB.setIFrameListener = function (readium) {

            readium.reader.addIFrameEventListener('focus', function (e) {
                $('iframe').addClass("focus-on-content");
                Keyboard.scope('reader');
            });

            readium.reader.addIFrameEventListener('blur', function (e) {
                $('iframe').removeClass("focus-on-content");
            });

            window.READIUM.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function () {
                //
                // const firstVisible = getFirstVisibleElement();
                // DZB.setScreenReaderFocusOnElement(firstVisible.parent());

                // hideInvisibleForScreenreaderUser();

                console.log('PAGINATION_CHANGED');
            });
        };


        DZB.forceScrollContinuousAsDefault = function (readerSettings) {

            readerSettings.scroll = "scroll-continuous";
        };

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

            const viewType = window.READIUM.reader.getCurrentViewType();

            var $iframe = $('.iframe-fixed');
            if (viewType === 4)
            //  ReadiumSDK.Views.ReaderView.VIEW_TYPE_SCROLLED_CONTINUOUS
                $frame = $('.iframe-fixed');
            else if (viewType === 1)
            // ReadiumSDK.Views.ReaderView.VIEW_TYPE_COLUMNIZED
                $frame = $('#epubContentIframe');
            else
                throw viewType + ' not supported.';


            $iframe.contents().find("a").each(function () {
                $(this).attr('tabindex', '-1');
            });
        };

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

        // DZB.setScreenReaderFocusOnFirstVisibleELement = function () {
        //
        //     // console.log(window.READIUM);
        //     // window.READIUM.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function () {
        //     //
        //     //     const firstVisible = getFirstVisibleElement();
        //     //     DZB.setScreenReaderFocusOnElement(firstVisible.parent());
        //     //
        //     // });
        // };

        DZB.setScreenReaderFocus = function (href) {

            const listener = function () {
                setScreenReaderFocusbyHref(href);
                window.READIUM.reader.removeListener(ReadiumSDK.Events.PAGINATION_CHANGED, listener);
            };

            window.READIUM.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, listener);
        };


        DZB.setScreenReaderFocusOnElement = function ($el) {

            $el.css('background-color', 'lightblue');
            $el.attr("tabindex", "-1"); // "A tabindex value of -1 is a special value that means scripts can focus the element, but not users."
            $el.focus();
        };


        //
        // private
        //
        function setScreenReaderFocusbyHref(href) {

            var hashIndex = href.indexOf("#");
            var elementIdWithHash;
            if (hashIndex >= 0) {
                elementIdWithHash = href.substr(hashIndex);

                const $el = $('.iframe-fixed').contents().find(elementIdWithHash);

                console.log('text: ' + $el.text());
                DZB.setScreenReaderFocusOnElement($el);


            }
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


        // function getFirstVisibleElement() {
        //
        //     var first = {};
        //
        //     $('#epubContentIframe').contents().find('*').contents().filter(function () {
        //
        //         return this.nodeType === 3;
        //
        //     }).each(function () {
        //
        //         // console.log($(this).text());
        //
        //         if (window.READIUM.reader.isElementVisible($(this))) {
        //
        //             // console.log($(this).text());
        //             first = $(this);
        //             return false;
        //         }
        //     });
        //     return first;
        // }

        return DZB;
    }
);