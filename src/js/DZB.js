define(['readium_shared_js/models/bookmark_data', 'jquery'], function (BookmarkData, $) {

        var DZB = {};

        const EPUB_TYPE_PAGE_LIST = 'page-list';
        const EPUB_TYPE_LANDMARKS = 'landmarks';

        //$(window).on('readepub', eventHandler);
        //$(window).on('loadlibrary', eventHandler);


        DZB.setIFrameListener = function (readium) {

            readium.reader.addIFrameEventListener('focus', function (e) {
                $('iframe').addClass("focus-on-content");
            });

            readium.reader.addIFrameEventListener('blur', function (e) {
                $('iframe').removeClass("focus-on-content");
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

            $('#epubContentIframe').contents().find("a").each(function () {
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

        DZB.setScreenReaderFocusOnFirstVisibleELement = function () {

            // console.log(window.READIUM);
            window.READIUM.reader.on(ReadiumSDK.Events.PAGINATION_CHANGED, function () {

                const firstVisible = getFirstVisibleElement();
                DZB.setScreenReaderFocusOnElement(firstVisible.parent());

            });
        };

        DZB.setScreenReaderFocusOnElement = function ($el) {

            $el.css('background-color', 'lightblue');
            $el.attr("tabindex", "-1"); // "A tabindex value of -1 is a special value that means scripts can focus the element, but not users."
            $el.focus();
        };

        //
        // private
        //
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


        function getFirstVisibleElement() {

            var first = {};

            $('#epubContentIframe').contents().find('*').contents().filter(function () {

                return this.nodeType === 3;

            }).each(function () {

                // console.log($(this).text());

                if (window.READIUM.reader.isElementVisible($(this))) {

                    // console.log($(this).text());
                    first = $(this);
                    return false;
                }
            });
            return first;
        }

        return DZB;
    }
);


// function highlightCfi(cfi, readium) {
//
//     if (!cfi) {
//         console.error("cfi not defined");
//         return;
//     }
//
//     try {
//         console.debug("try to hightlight: " + cfi);
//
//         var idref = getIdref(cfi);
//         var partialCfi = getPartialCfi(cfi);
//
//         readium.reader.openSpineItemElementCfi(idref, partialCfi);
//         var highlighter = new Highlighter(readium);
//         // TODO: looks like this should be call after spineitem is loaded
//         highlighter.add(idref, partialCfi, 'blue');
//
//
//     } catch (e) {
//
//         console.error(e);
//     }
//
// }
//
// function getPartialCfi(cfi) {
//
//     return cfi.split('!')[1];
// }
//
// function getIdref(cfi) {
//
//     return cfi.split('!')[0].match(/\[(.*?)\]/)[1];
// }
//
// /**
//  * Highlighter use part from CFI navigation helper class.
//  *
//  * Own Hightlighter should be full text search module
//  * a little bit more independent from future developing waves
//  */
// var Highlighter = function (readium) {
//
//     // todo: focus screenreader
//
//     var self = this;
//     var lastOverlay;
//
//     self.add = function (idref, partialCfi, borderColor) {
//
//         if (lastOverlay)
//             lastOverlay.remove();
//
//         var range = readium.reader.getDomRangeFromRangeCfi(new BookmarkData(idref, partialCfi));
//         console.log("________________________ range: " + range);
//
//         drawOverlayFromDomRange(range, borderColor)
//     };
//
//
//     function drawOverlayFromDomRange(range, borderColor) {
//         var rect = getNodeRangeClientRect(
//             range.startContainer,
//             range.startOffset,
//             range.endContainer,
//             range.endOffset);
//
//         drawOverlayFromRect(rect, borderColor);
//     }
//
//
//     function drawOverlayFromRect(rect, borderColor) {
//         var leftOffset, topOffset;
//
//         if (isVerticalWritingMode()) {
//             leftOffset = 0;
//             topOffset = -getPaginationLeftOffset();
//         } else {
//             leftOffset = -getPaginationLeftOffset();
//             topOffset = 0;
//         }
//
//         addOverlayRect({
//             left: rect.left + leftOffset,
//             top: rect.top + topOffset,
//             width: rect.width,
//             height: rect.height
//         }, borderColor, self.getRootDocument());
//     }
//
//
//     function addOverlayRect(rects, borderColor, doc) {
//
//         if (!(rects instanceof Array)) {
//             rects = [rects];
//         }
//         for (var i = 0; i != rects.length; i++) {
//             var rect = rects[i];
//             var overlayDiv = doc.createElement('div');
//             overlayDiv.style.position = 'absolute';
//             $(overlayDiv).css('z-index', '1000');
//             $(overlayDiv).css('pointer-events', 'none');
//             $(overlayDiv).css('opacity', '0.4');
//             overlayDiv.style.border = '2px dashed ' + borderColor;
//             overlayDiv.style.background = 'yellow';
//             overlayDiv.style.margin = overlayDiv.style.padding = '0';
//             overlayDiv.style.top = (rect.top ) + 'px';
//             overlayDiv.style.left = (rect.left ) + 'px';
//             // we want rect.width to be the border width, so content width is 2px less.
//             overlayDiv.style.width = (rect.width - 2) + 'px';
//             overlayDiv.style.height = (rect.height - 2) + 'px';
//             doc.documentElement.appendChild(overlayDiv);
//             lastOverlay = overlayDiv;
//         }
//     }
//
//     function getPaginationLeftOffset() {
//
//         var $htmlElement = $("html", self.getRootDocument());
//         var offsetLeftPixels = $htmlElement.css(isVerticalWritingMode() ? "top" : (isPageProgressionRightToLeft() ? "right" : "left"));
//         var offsetLeft = parseInt(offsetLeftPixels.replace("px", ""));
//         if (isNaN(offsetLeft)) {
//             //for fixed layouts, $htmlElement.css("left") has no numerical value
//             offsetLeft = 0;
//         }
//         if (isPageProgressionRightToLeft() && !isVerticalWritingMode()) return -offsetLeft;
//         return offsetLeft;
//     }
//
//     function getNodeRangeClientRect(startNode, startOffset, endNode, endOffset) {
//         var range = createRange();
//         range.setStart(startNode, startOffset ? startOffset : 0);
//         if (endNode.nodeType === Node.ELEMENT_NODE) {
//             range.setEnd(endNode, endOffset ? endOffset : endNode.childNodes.length);
//         } else if (endNode.nodeType === Node.TEXT_NODE) {
//             range.setEnd(endNode, endOffset ? endOffset : 0);
//         }
//         return normalizeRectangle(range.getBoundingClientRect(), 0, 0);
//     }
//
//     function normalizeRectangle(textRect, leftOffset, topOffset) {
//
//         var plainRectObject = {
//             left: textRect.left,
//             right: textRect.right,
//             top: textRect.top,
//             bottom: textRect.bottom,
//             width: textRect.right - textRect.left,
//             height: textRect.bottom - textRect.top
//         };
//         offsetRectangle(plainRectObject, leftOffset, topOffset);
//         return plainRectObject;
//     }
//
//     function offsetRectangle(rect, leftOffset, topOffset) {
//
//         rect.left += leftOffset;
//         rect.right += leftOffset;
//         rect.top += topOffset;
//         rect.bottom += topOffset;
//     }
//
//     function isPageProgressionRightToLeft() {
//         return readium.reader.getPaginationInfo().rightToLeft;
//     }
//
//     function isVerticalWritingMode() {
//         return readium.reader.getPaginationInfo().isVerticalWritingMode;
//     }
//
//     this.getRootDocument = function () {
//         return $('#epubContentIframe')[0].contentDocument;
//     };
//
//     function createRange() {
//         return self.getRootDocument().createRange();
//     }
// };
