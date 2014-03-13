(function () {

var module = angular.module('app', [
    'ng',
    'nw',
    'app.tpl',
    'optng.gestures'
]);

module.factory('app', function () {

    function App() {

    }

    return new App();

});

module.run(['nw', 'app', '$optng.gestures', function (nw, app, gestures) {

    var fullscreen = false;
    var style = angular.element('<style>');
    angular.element(document).find('head').append(style);

    window.onresize = function () {
        style.text("* { z-index: 1}");
    };

    gestures({
        'ctrl+o': function open() {
            nw.openDialog().then(function (files) {
                console.log(files);
            });
        },
        f12: function debug() {
            var gui = require('nw.gui');
            gui.Window.get().showDevTools();
        },
        f11: function fullscreen() {
            var gui = require('nw.gui');
            gui.Window.get().toggleKioskMode();
        }
    });

}]);

})();
