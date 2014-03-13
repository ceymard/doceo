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

    gestures({
        'ctrl+o': function open() {
            nw.openDialog().then(function (files) {
                console.log(files);
            });
        }
    });

}]);

})();
