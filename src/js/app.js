(function(window, angular) {
    'use strict';
    angular.module('FileManagerApp', ['pascalprecht.translate', 'ngFileUpload']);

    /**
     * jQuery inits
     */
    angular.element(window.document).on('shown.bs.modal', '.modal', function() {
        window.setTimeout(function() {
            angular.element('[autofocus]', this).focus();
        }.bind(this), 100);
    });

    angular.element(window.document).on('click', function() {
        angular.element('#context-menu').hide();
    });

    angular.element(window.document).on('contextmenu', '.main-navigation .table-files tr.item-list:has("td"), .item-list, .main', function(e) {
        var menu = angular.element('#context-menu');

        var x = e.pageX;
        if (x >= window.innerWidth - menu.width())
            x -= menu.width();
        if (x < 10)
            x = 10;
            
        var y = e.pageY;
        if (y - $(window).scrollTop() >= window.innerHeight - menu.height())
            y -= menu.height();
        if (y < 10)
            y = 10;
         

        menu.hide().css({
            left: x,
            top: y
        }).appendTo('body').show();
        e.preventDefault();
    });

    if (! Array.prototype.find) {
        Array.prototype.find = function(predicate) {
            if (this === null) {
                throw new TypeError('Array.prototype.find called on null or undefined');
            }
            if (typeof predicate !== 'function') {
                throw new TypeError('predicate must be a function');
            }
            var list = Object(this);
            var length = list.length >>> 0;
            var thisArg = arguments[1];
            var value;

            for (var i = 0; i < length; i++) {
                value = list[i];
                if (predicate.call(thisArg, value, i, list)) {
                    return value;
                }
            }
            return undefined;
        };
    }

})(window, angular);
