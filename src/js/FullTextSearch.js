define(['./Dialogs',
        'i18nStrings',
        './Keyboard',
        'jquery',
        'hgn!readium_js_viewer_html_templates/search.html',
        'spin',
        'readium_shared_js/models/bookmark_data',
        './DZB'
    ],
    function (Dialogs,
              Strings,
              Keyboard,
              $,
              SearchDialog,
              Spinner,
              BookmarkData,
              DZB) {

        var newSearch;
        var cfis = [];

        var curCfi;
        var currentCfiIndex = 0;
        var PREVIOUS = "previous";
        var NEXT = "next";
        var direction;


        // todo: host should be configurable 
        //var host = 'http://' + window.location.hostname + ':8085';
        // var host = 'http://192.168.1.103:8080';
        // var host = 'http://localhost:8080';
        // var host = window.location.origin;
        var host = 'http://dzbvm-badi.dzbnet.local:8085';
        var readium,
            spinner,
            epubTitle = "",
            highlighter,
            startContainer,
            autocomplete;


        var FullTextSearch = function (readiumRef, title) {

            readium = readiumRef;
            epubTitle = title;
            highlighter = new Highlighter();

            this.init = function () {

                // add search dialog icon to navbar
                $('#app-navbar > .navbar-right').prepend(
                    $(SearchDialog({
                        strings: Strings,
                        dialogs: Dialogs,
                        keyboard: Keyboard
                    })));

                Keyboard.scope('reader');

                //$("#search").keydown(function (event) {
                //
                //    if (event.which === 13) { // enter key
                //
                //        $("#search-btn-next").trigger("click");
                //    }
                //    event.stopPropagation();
                //});

                Keyboard.on(Keyboard.FullTextSearchForwards, 'reader', forwards);
                Keyboard.on(Keyboard.FullTextSearchBackwards, 'reader', backwards);

                $("#search-btn-next").click(forwards);
                $("#search-btn-previous").click(backwards);


                Keyboard.on(Keyboard.FullTextSearch, 'reader', function () {
                    $('#search-btn').trigger("click");
                    setFocusOnSearchInput
                });

                $('#search-btn').on('click', setFocusOnSearchInput);

                $('#search-menu').click(function (e) {
                    e.stopPropagation();
                });

                setUpSpinner();
                autocomplete = new Autocomplete();
            };

            // search forwards
            function forwards() {

                direction = NEXT;

                var q = $("#search").val();

                if (q === "") { //no search string entered
                    signalNoQuery();
                } else {

                    if (newSearch) {
                        sendSearchRequest(q);
                        newSearch = false;
                    } else
                        hightlightNextHit(q);
                }
            }

            // search backwards
            function backwards() {

                direction = PREVIOUS;

                var q = $("#search").val();

                if (q === "") { //no search string entered
                    signalNoQuery();
                } else {

                    if (newSearch) {
                        sendSearchRequest(q);
                        newSearch = false;
                    } else
                        highlightPreviousHit(q);

                }
            }


            function sendSearchRequest(pattern) {

                var request = host + '/search?q=' + pattern + '&t=' + epubTitle;

                spinner.radius = 4;
                spinner.spin($('#search-spinner')[0]);

                $.getJSON(request, '', {})
                    .done(function (hits) {
                        spinner.stop();

                        if (hits && hits.length > 0) {

                            //console.log("found " + hits.length + ' hits');
                            setCFIs(hits);
                            setCurrentCFI(hits);
                            highlightCurrentCFI();
                            //highlightCfi("/6/20[id-id2635343]!/4/2[building_a_better_epub]/10/36/22/2,/1:0,/1:4");

                        } else {
                            console.debug("no search result");
                        }
                        console.debug("search request ready");
                    })
                    .fail(function () {
                        console.error("error fulltext search request");
                    });
            }


            function hightlightNextHit() {

                setNextCfi();
                commonHighlightCfi();
            }

            function highlightPreviousHit(pattern) {

                if (pattern === "") {
                    signalNoQuery();
                    return;
                }
                setPreviousCfi();
                commonHighlightCfi();
            }


            function commonHighlightCfi() {

                (isSameSpineItem())
                highlightCfi(curCfi);

                window.READIUM.reader.on(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, triggerContentIsLoaded);

                window.READIUM.reader.openSpineItemElementCfi(getIdref(curCfi), getPartialCfi(curCfi));
            }


            function highlightCurrentCFI() {

                if (cfis.length !== 0) {

                    window.READIUM.reader.openSpineItemElementCfi(getIdref(curCfi), getPartialCfi(curCfi));

                    var curIdref = window.READIUM.reader.getLoadedSpineItems()[0].idref;
                    var idref = getIdref(curCfi);
                    if (curIdref === idref)
                        highlightCfi(curCfi);
                    //console.debug("curCfi: " + curCfi)
                }
            }

            function setCurrentCFI(hits) {

                var curIdref = window.READIUM.reader.getLoadedSpineItems()[0].idref;

                for (hit in hits) {

                    if (hits[hit].cfis.length > 0) {

                        if (hit === "0")
                            curCfi = hits[hit].cfis[0];

                        // Try to start hit highlighting (in/near) current spine item.
                        // This realise only "in". How can it realise "near"? 
                        if (curIdref === hits[hit].id) {
                            curCfi = hits[hit].cfis[0];
                            currentCfiIndex = cfis.indexOf(curCfi);
                        }
                    } else
                        console.error("found hit " + hits[hit].id + " without cfi(s)");
                }
            }


            function highlightCfi(cfi) {

                if (!cfi) {
                    console.error("cfi not defined");
                    return;
                }

                try {
                    console.debug("try to hightlight: " + cfi);

                    var idref = getIdref(cfi);
                    var partialCfi = getPartialCfi(cfi);

                    // TODO: looks like this should be call after spineitem is loaded
                    highlighter.apply(idref, partialCfi, 'black');

                } catch (e) {

                    console.error(e);
                }
            }


            //function highlightRange(range) {
            //    var newNode = document.createElement("div");
            //    newNode.setAttribute("style", "background-color: yellow; display: inline;");
            //    newNode.setAttribute("contenteditable", "true");
            //    newNode.id = "searchResult";
            //    range.surroundContents(newNode);
            //}

            function setNextCfi() {

                // wrap around:
                // end of the book, we are continue at begin of the book 
                if (currentCfiIndex === (cfis.length - 1))
                    currentCfiIndex = 0;

                curCfi = cfis[++currentCfiIndex];
                return curCfi;
            }

            function setPreviousCfi() {


                if (currentCfiIndex === 0)
                    currentCfiIndex = cfis.length - 1;

                curCfi = cfis[--currentCfiIndex];
                return curCfi;
            }


            function setCFIs(hits) {

                cfis = [];

                for (hit in hits) {

                    if (hits[hit].cfis.length > 0)
                        cfis.push.apply(cfis, hits[hit].cfis);
                }

            }

            function getPartialCfi(cfi) {

                return cfi.split('!')[1];
            }

            function getIdref(cfi) {

                return cfi.split('!')[0].match(/\[(.*?)\]/)[1];
            }


            function isSameSpineItem() {

                var curIdref = window.READIUM.reader.getLoadedSpineItems()[0].idref;
                var idref = getIdref(curCfi);

                return curIdref === idref;
            }

            // refactoring 
            var signalNoQuery = function () {

                var firstKeyDown = true;
                var KeyUpAfterFocusingInput = true;

                $('#search').attr("placeholder", Strings.enter_text);
                $('#search').attr("role", "alert");
                $('#search').addClass("error");

                $('#search').on("keydown", function (event) {

                    if (event.keyCode != 13 && firstKeyDown) {
                        setToDefault();
                    }

                    firstKeyDown = false;
                    KeyUpAfterFocusingInput = false;

                });

                $('#search').on("keyup", function () {
                    if (KeyUpAfterFocusingInput) {
                        $('#search').val("");
                    }
                    KeyUpAfterFocusingInput = false;
                });

                $("#app-navbar").click(function () {
                    setToDefault();
                });

                $('#search').focus();

            };

            function setToDefault() {
                $('#search').removeClass("error");
                $('#search').attr("placeholder", Strings.full_text_search);
                $('#search').removeAttr("role");

            };

            function setFocusOnSearchInput() {
                setTimeout(function () {
                    $('#search')[0].focus();
                }, 100);
            }

            function setUpSpinner() {

                var opts = {
                    lines: 8, // The number of lines to draw
                    length: 2, // The length of each line
                    width: 4, // The line thickness
                    radius: 8, // The radius of the inner circle
                    corners: 1, // Corner roundness (0..1)
                    rotate: 0, // The rotation offset
                    direction: 1, // 1: clockwise, -1: counterclockwise
                    color: '#000', // #rgb or #rrggbb or array of colors
                    speed: 1, // Rounds per second
                    trail: 66, // Afterglow percentage
                    shadow: false, // Whether to render a shadow
                    hwaccel: false, // Whether to use hardware acceleration
                    className: 'spinner', // The CSS class to assign to the spinner
                    zIndex: 2e9, // The z-index (defaults to 2000000000)
                    top: '72%', // Top position relative to parent in px
                    left: '69%' // Left position relative to parent in px
                };
                spinner = new Spinner(opts);
            }

            function triggerContentIsLoaded() {

                if (curCfi)
                    highlightCfi(curCfi);

                window.READIUM.reader.off(ReadiumSDK.Events.CONTENT_DOCUMENT_LOADED, triggerContentIsLoaded);
            }
        };


        /**
         * Highlighter use part from CFI navigation helper class.
         *
         * Own Hightlighter should be full text search module
         * a little bit more independent from future developing waves
         */
        var Highlighter = function () {

            var self = this;
            var lastOverlay;

            self.apply = function (idref, partialCfi, borderColor) {

                if (lastOverlay && lastOverlay.parentNode)
                    lastOverlay.parentNode.removeChild(lastOverlay);
                // lastOverlay.remove(); Ohh Dear! not supported by IE11 

                var range = window.READIUM.reader.getDomRangeFromRangeCfi(new BookmarkData(idref, partialCfi));
                startContainer = range.startContainer;
                console.log("________________________ range: " + range);

                drawOverlayFromDomRange(range, borderColor);

                // console.log("name" + $(range.startContainer).parents("html"));
                DZB.setScreenReaderFocusOnElement($(range.startContainer).parent());
            };


            function drawOverlayFromDomRange(range, borderColor) {
                var rect = getNodeRangeClientRect(
                    range.startContainer,
                    range.startOffset,
                    range.endContainer,
                    range.endOffset);

                console.log(rect);
                drawOverlayFromRect(rect, borderColor);
            }


            function drawOverlayFromRect(rect, borderColor) {
                var leftOffset, topOffset;

                if (isVerticalWritingMode()) {
                    leftOffset = 0;
                    topOffset = -getPaginationLeftOffset();
                } else {
                    leftOffset = -getPaginationLeftOffset();
                    topOffset = 0;
                }

                addOverlayRect({
                    left: rect.left + leftOffset,
                    top: rect.top + topOffset,
                    width: rect.width,
                    height: rect.height
                }, borderColor, self.getRootDocument());
            }


            function addOverlayRect(rects, borderColor, doc) {

                if (!(rects instanceof Array)) {
                    rects = [rects];
                }
                for (var i = 0; i != rects.length; i++) {
                    var rect = rects[i];
                    var overlayDiv = doc.createElement('div');
                    overlayDiv.style.position = 'absolute';
                    $(overlayDiv).css('z-index', '1000');
                    $(overlayDiv).css('pointer-events', 'none');
                    $(overlayDiv).css('opacity', '0.4');
                    overlayDiv.style.border = '1500px solid ' + borderColor;
                    // overlayDiv.style.background = 'yellow';
                    overlayDiv.style.margin = overlayDiv.style.padding = '0';
                    overlayDiv.style.top = (rect.top - 1502) + 'px';
                    overlayDiv.style.left = (rect.left - 1502) + 'px';
                    // we want rect.width to be the border width, so content width is 2px less.
                    overlayDiv.style.width = (rect.width + 3) + 'px';
                    overlayDiv.style.height = (rect.height) + 'px';
                    doc.documentElement.appendChild(overlayDiv);
                    lastOverlay = overlayDiv;
                }
            }

            function getPaginationLeftOffset() {

                var $htmlElement = $("html", self.getRootDocument());
                var offsetLeftPixels = $htmlElement.css(isVerticalWritingMode() ? "top" : (isPageProgressionRightToLeft() ? "right" : "left"));
                var offsetLeft = parseInt(offsetLeftPixels.replace("px", ""));
                if (isNaN(offsetLeft)) {
                    //for fixed layouts, $htmlElement.css("left") has no numerical value
                    offsetLeft = 0;
                }
                if (isPageProgressionRightToLeft() && !isVerticalWritingMode()) return -offsetLeft;
                return offsetLeft;
            }

            function getNodeRangeClientRect(startNode, startOffset, endNode, endOffset) {
                var range = self.getRootDocument().createRange();
                range.setStart(startNode, startOffset ? startOffset : 0);
                if (endNode.nodeType === Node.ELEMENT_NODE) {
                    range.setEnd(endNode, endOffset ? endOffset : endNode.childNodes.length);
                } else if (endNode.nodeType === Node.TEXT_NODE) {
                    range.setEnd(endNode, endOffset ? endOffset : 0);
                }
                return normalizeRectangle(range.getBoundingClientRect(), 0, 0);
            }

            function normalizeRectangle(textRect, leftOffset, topOffset) {

                var plainRectObject = {
                    left: textRect.left,
                    right: textRect.right,
                    top: textRect.top,
                    bottom: textRect.bottom,
                    width: textRect.right - textRect.left,
                    height: textRect.bottom - textRect.top
                };
                offsetRectangle(plainRectObject, leftOffset, topOffset);
                return plainRectObject;
            }

            function offsetRectangle(rect, leftOffset, topOffset) {

                rect.left += leftOffset;
                rect.right += leftOffset;
                rect.top += topOffset;
                rect.bottom += topOffset;
            }

            function isPageProgressionRightToLeft() {
                return window.READIUM.reader.getPaginationInfo().rightToLeft;
            }

            function isVerticalWritingMode() {
                return window.READIUM.reader.getPaginationInfo().isVerticalWritingMode;
            }

            this.getRootDocument = function () {
                return $(startContainer).parents("html").parent()[0];
            };

        };


        /**
         * ACCESSIBLE AUTOCOMPLETE
         *
         *
         * Inspiration and code parts from here
         * http://haltersweb.github.io/Accessibility/autocomplete.html
         *
         */
        const Autocomplete = function () {

            const $widget = $('[data-widget="accessible-autocomplete"]'),
                $input = $widget.find('#search'),
                $clearText = $('#clearText'),
                $results = $widget.find('#results'),
                $live = $widget.find('[aria-live]'),
                key = {
                    back: 8, // delete key on mac
                    tab: 9,
                    enter: 13,
                    shift: 16, // shiftKey = true
                    ctrl: 17, // ctrlKey = true
                    alt: 18, // (a.k.a. option on Mac) altKey = true
                    esc: 27,
                    space: 32,
                    pageUp: 33, // fn + up on mac
                    pageDown: 34, // fn + down on mac
                    end: 35, // fn + right on mac
                    home: 36, // fn + left on mac
                    left: 37,
                    up: 38,
                    right: 39,
                    down: 40,
                    del: 46, // fn + delete on mac
                    command: 91 // metaKey = true (mac and sun machines)
                },
                directions = "Keyboard Nutzer, nutzen Pfeil rauf und runter zum Ansehen der Ergebnisse und Eingabe Taste zur Auswahl.",
                liMarkup = '<li id="" class="autocomplete-item" role="option" aria-selected="false" tabindex="-1">'

            var inputVal = "",
                results = [];


            function positionResults() {
                // stop if this has already been set
                if ($results.is('[style*="width"]')) {
                    return;
                }
                $results.css({
                    left: $input.position().left + "px",
                    top: $input.position().top + $input.outerHeight() + "px",
                    "min-width": $input.outerWidth() + "px"
                });

            }

            function buildListHtml (results) {
                var resultsMarkup = "", i = 0;
                for (i = 0; i < results.length; i += 1) {
                    resultsMarkup += liMarkup + results[i] + "</li>";
                }
                $results.html(resultsMarkup);
                $results.show();
                $input.attr('aria-expanded', 'true');
            };

            function announceResults() {
                
                var number = results.length,
                    textToRead = number + " Ergebnisse verfügbar. " + directions;
                // if results length === 0 then say "no search results"
                if (results.length === 0) {
                    textToRead = "Die Suche ergab keine Ergebnisse.";
                }
                announcements($live, textToRead);
            }

            function announcements($ariaContainer, textToRead) {
                $ariaContainer.text(textToRead);
                setTimeout(function () {
                    $ariaContainer.text('');
                }, 1000);
            }


            function markSelected($selectionToMark) {
                // don't mark anything on the results list if we're back at the input field
                if ($selectionToMark.length === 0) {
                    return;
                }
                var activeItemId = 'selectedOption';
                $selectionToMark.attr('aria-selected', 'true').attr('id', activeItemId);
                $input.attr('aria-activedescendant', activeItemId);
            }

            function clearSelected() {
                $input.attr('aria-activedescendant', '');
                $results.find('[aria-selected="true"]').attr('aria-selected', 'false').attr('id', '');
            }

            function closeResults() {
                clearSelected();
                $results.hide();
                $input.attr('aria-expanded', 'false');
            }


            function autocomplete() {

                // if input value didn't change, return
                if ($input.val() === inputVal)
                    return;
                // save new input value
                inputVal = $input.val();

                if (inputVal === '' || inputVal.length < 3)
                    return;

                var matcher = "/matcher?beginsWith=" + inputVal;
                var title = '&t=' + epubTitle;
                var request = host + matcher + title;

                //console.debug(request);

                $.getJSON(request, '', {})
                    .done(function (data) {

                        results = data;
                        
                        if (results.length > 0)
                            buildListHtml(results);
                        else
                            closeResults();

                        // aria-live results
                        announceResults();
                    })
                    .fail(function (jqxhr, textStatus, error) {
                        var err = textStatus + ", " + error;
                        console.error("Request " + request + " Failed: " + err);
                    });
            }

            function arrowing(kc) {
                var $thisActiveItem = $results.find('[aria-selected="true"]'),
                    $nextMenuItem;
                // don't do anything if no results
                if (!results.length) {
                    return;
                }
                if (kc === key.down) {
                    // find the next list item to be arrowed to
                    $nextMenuItem = ($thisActiveItem.length !== 0)
                        ? $thisActiveItem.next('li')
                        : $results.children().eq(0); //first item in list
                }
                if (kc === key.up) {
                    // find the previous list to be arrowed to
                    $nextMenuItem = ($thisActiveItem.length !== 0)
                        ? $thisActiveItem.prev('li')
                        : $results.children().eq(-1); //last item in list
                }
                clearSelected();
                markSelected($nextMenuItem);
            }

            function populating() {
                var selectedText = $results.find('[aria-selected="true"]').text();
                if (selectedText === "") {
                    selectedText = inputVal;
                }
                $input.val(selectedText);
            }

            function senseClickOutside ($evtTarget, $container) {
                if (($evtTarget).closest($container).length === 0) {
                    // click target is outside
                    return true;
                }
            }
            
            function eventListeners() {
                
                /*
                 * close results if click outside $input and $results
                 */
                $(document).on('click', function (e) {
                    var $container = $input.add($results);
                    if (senseClickOutside($(e.target), $container)) {
                        closeResults();
                        return;
                    }
                });
                /*
                 * keyup
                 */
                $input.on('keyup', function (e) {
                    var kc = e.keyCode;
                    if (kc === key.up || kc === key.down || kc === key.tab || kc === key.enter || kc === key.esc) {
                        return;
                    };
                    autocomplete();
                    newSearch = true;
                });

                /*
                 * down
                 */
                $input.on('keydown', function (e) {
                    var kc = e.keyCode;
                    if (kc === key.tab) {
                        closeResults();
                        return;
                    }
                    if (kc === key.enter) {
                        e.preventDefault();
                        closeResults();
                        $("#search-btn-next").trigger("click");
                        return;
                    }
                    if (kc === key.up || kc === key.down) {
                        e.preventDefault();
                        arrowing(kc);
                        populating();
                        return;
                    }
                    if (kc === key.esc) {
                        $input.val(inputVal);
                        closeResults();
                    }
                });

                $results.on('click', function (e) {
                    $input.val(e.target.textContent);
                    closeResults();
                    $input.focus();
                });

                $results.hover(function () {
                    clearSelected();
                });

                $clearText.on('click', function () {
                    inputVal = '';
                    $input.val(inputVal);
                });
            }

            function init() {
                eventListeners();
                positionResults();
            }

            init();
        };

        return FullTextSearch;
    }
);


