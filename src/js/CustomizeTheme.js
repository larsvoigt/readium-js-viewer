define(['Settings', 'hgn!readium_js_viewer_html_templates/customize-theme-dialog.html', 'i18nStrings','jquery_colpick', 'bootstrap'], function (Settings, CustomThemeDialog, Strings) {

    // z-index ccs 
    var CustomizeTheme = {};
    
    const CUSTOM_THEME = 'custom-theme';

    CustomizeTheme.init = function () {

        deleteTemporaryCustomColor();
        
        $('#app-container').append(CustomThemeDialog({strings: Strings}));
        $('#theme-radio-group').append($('#custom-theme-btn'));

        Settings.get('reader', function (readerSettings) {

            if (readerSettings && readerSettings.theme) 
                    setPreview(readerSettings);
        });
        

        $("#custom-theme-btn").on("click", function () {
            $('#settings-dialog').modal('hide');
            $("#custom-theme-dialog").modal('show');
        });

        $("#custom-theme-dialog").on('hidden.bs.modal', function () {

            $('#settings-dialog').modal('show');
        });

        $("#custom-theme-dialog").on('hide.bs.modal', function () {

            $("#background-color-btn").colpickHide();
            $("#foreground-color-btn").colpickHide();
            setTemporaryCustomColor();
        });

        $("#custom-theme-dialog").on('show.bs.modal', function () {

            $($('.preview-text').clone()).insertAfter($("#PreviewHeader"));

            var rgbFore = $("#custom-theme-btn").css("color");
            var rgbBack = $("#custom-theme-btn").css("background-color");

            $("#foreground-color-btn").colpickSetColor(rgb2hex(rgbFore));
            $("#background-color-btn").colpickSetColor(rgb2hex(rgbBack));

        });

        $("#background-color-btn").colpick({
            layout: 'hex',
            submit: 0,
            colorScheme: 'light',
            onChange: function (hsb, hex, rgb, el, bySetColor) {

                hex = '#' + hex;
                $(el).css('color', getContrastColor(hex)).css('background-color', hex);

                $('#custom-theme-btn').css('background-color', hex);
                $('.preview-text').css('background-color', hex);
            }
        });

        $("#foreground-color-btn").colpick({
            layout: 'hex',
            submit: 0,
            colorScheme: 'light',
            onChange: function (hsb, hex, rgb, el, bySetColor) {

                hex = '#' + hex;
                $(el).css('color', getContrastColor(hex)).css('background-color', hex);

                $('#custom-theme-btn').css('color', hex);
                $('.preview-text').css('color', hex);
            }
        });


        $('#settings-dialog').on('show.bs.modal', function () {

            Settings.get('reader', function (readerSettings) {

                if (readerSettings && readerSettings.theme) {

                    if (!isTemporaryCustomColorSet() && readerSettings.themeColor)
                        setCustomThemeColor($("#custom-theme-btn"), readerSettings);
                }

                if (isTemporaryCustomColorSet())
                    $('.preview-text').attr('data-theme', CUSTOM_THEME);
            });
        });

        $('.theme-option').on('click', function () {
            var selectedTheme = $(this).attr('data-theme');
            setPreview({theme: selectedTheme});
        });

        $('.colpick').css('z-index', '9999');
    };

    CustomizeTheme.save = function (readerSettings) {

        if (isCustomTheme(readerSettings.theme)) {
            readerSettings.themeColor = {
                color: $('.preview-text').css('color'),
                backgroundColor: $('.preview-text').css('background-color')
            }
        }
        //} else {
        //    readerSettings.themeColor = {
        //        color: 'black',
        //        backgroundColor: 'white'
        //    }
        //}
    };

    function setPreview(readerSettings) {

        var theme = readerSettings.theme;
        if (isCustomTheme(theme))
            setCustomThemeColor($('.preview-text'), readerSettings);
        else {
            $('.preview-text').css('color', '').css('background-color', '');
            deleteTemporaryCustomColor();
        }
    }


    function setCustomThemeColor($element, readerSettings) {
        $element.css('color', readerSettings.themeColor.color);
        $element.css('background-color', readerSettings.themeColor.backgroundColor);
    }

    function isCustomTheme(theme) {
        return theme === CUSTOM_THEME;
    }

    function setTemporaryCustomColor() {

        localStorage["tempThemeColor"] = {
            color: $('.preview-text').css('color'),
            backgroundColor: $('.preview-text').css('background-color')
        }
    }

    function deleteTemporaryCustomColor() {
        localStorage.removeItem("tempThemeColor");
    }

    function isTemporaryCustomColorSet() {
        return localStorage.hasOwnProperty("tempThemeColor");
    }


    function rgb2hex(rgb) {
        rgb = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+))?\)$/);
        function hex(x) {
            return ("0" + parseInt(x).toString(16)).slice(-2);
        }

        return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
    }

    function getContrastColor(hexcolor) {

        if (hexcolor[0] == '#')
            hexcolor = hexcolor.substring(1);
        return (parseInt(hexcolor, 16) > 0xffffff / 2) ? 'black' : 'white';
    }

    return CustomizeTheme;
});