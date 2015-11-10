define([], function () {

        var DZB = {};

        //$(window).on('readepub', eventHandler);
        //$(window).on('loadlibrary', eventHandler);

        
        DZB.customizationsForTouchDevice = function() {
        
            // todo: find a better way to this action because it is once on initialisation necessary 
            if(isTouchDevice())
                disableToolTipsOnMobileDevices();
        };

        function disableToolTipsOnMobileDevices() {
             console.debug("disableToolTipsOnMobileDevices");
            // prevent the user need to click twice to select any menu item
            $("nav *[title]").removeAttr( 'title' );
        }

        
        function isTouchDevice() {
            return (('ontouchstart' in window)
            || (navigator.MaxTouchPoints > 0)
            || (navigator.msMaxTouchPoints > 0));
        }

        return DZB;
    }
);