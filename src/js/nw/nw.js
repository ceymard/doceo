(function () {

var module = angular.module('nw', []);

module.factory('nw',
['$q', function ($q) {

    var gui = require('nw.gui');
    var file_input = null;

    function get_fileinput() {
        if (!file_input) {
            file_input = angular.element('<input type="file" style="display: none;">');
            angular.element(window.document).prepend(file_input);
        }
        file_input.removeAttr('multiple');
        file_input.removeAttr('filter');
        file_input.removeAttr('nwsaveas');
        return file_input;
    }

    return {

        window: function window(win) {
            return gui.Window.get(window);
        },

        open: function open(url) {
            return gui.Window.open(url);
        },

        openDialog: function (opts) {
            var input = get_fileinput();
            var deferred = $q.defer();
            opts = opts || {};

            if (opts.multiple)
                input.attr('multiple', '');
            if (opts.filter)
                input.attr('filter', opts.filter);

            input.on('change', function (evt) {
                deferred.resolve(this.files);
            });

            input[0].click();

            return deferred.promise;
        },
        saveAsDialog: function () {

        }
    };

}]);

})();
