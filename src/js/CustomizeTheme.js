define(['Settings', 'jquery_colpick', 'bootstrap'], function (Settings) {


        var CustomizeTheme = function () {

            var $previewText = $('.preview-text');
            
            this.init = function () {

                deleteTemporaryCustomColor();

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
                    $("#tab-style").prepend($("#theme-preview"));
                    $previewText.attr('data-theme', 'custom-theme');
                    setTemporaryCustomColor();
                });

                $("#custom-theme-dialog").on('show.bs.modal', function () {

                    $("#custom-theme-dialog-body").prepend($("#theme-preview"));

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

                        if (readerSettings.theme) {

                            if (!isTemporaryCustomColorSet()) {
                                setPreviewTheme($previewText, readerSettings);
                                if (readerSettings.themeColor)
                                    setCustomThemeColor($("#custom-theme-btn"), readerSettings);
                            }
                        }
                    });
                });

                $('.theme-option').on('click', function(){
                    var newTheme = $(this).attr('data-theme');
                    setPreview({theme:newTheme});
                });

            };

             function setPreview (readerSettings) {

                var newTheme = readerSettings.theme;
                if (isCustomTheme(newTheme))
                    setCustomThemeColor($previewText, readerSettings);
                else {
                    $previewText.css('color', '').css('background-color', '');
                    deleteTemporaryCustomColor();
                }
            };

            this.save = function (readerSettings) {

                if (isCustomTheme(readerSettings.theme)) {
                    readerSettings.themeColor = {
                        color: $previewText.css('color'),
                        backgroundColor: $previewText.css('background-color')
                    }
                } else {
                    readerSettings.themeColor = {
                        color: 'black',
                        backgroundColor: 'white'
                    }
                }
            };

            function setCustomThemeColor($element, readerSettings) {
                $element.css('color', readerSettings.themeColor.color);
                $element.css('background-color', readerSettings.themeColor.backgroundColor);
            }

            function isCustomTheme(theme) {
                return theme === "custom-theme";
            }

            function setTemporaryCustomColor() {

                localStorage["tempThemeColor"] = {
                    color: $previewText.css('color'),
                    backgroundColor: $previewText.css('background-color')
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

        };

        return CustomizeTheme;

    }
);