var gulp = require('gulp');
var through = require('through2');

var clean = require('gulp-clean');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var concat = require('gulp-concat');
var watch = require('gulp-watch');
var stylus = require('gulp-stylus');
var uglify = require('gulp-uglify');
var jshint = require('gulp-jshint');
var ngcompile = require('gulp-ngcompile');
var ngtemplates = require('gulp-ngtemplates');
var jade = require('gulp-jade');
var tap = require('gulp-tap');

var es = require('event-stream');

var stylish = require('jshint-stylish');

var config = {
    scripts: __dirname + '/src/**/*.js',
    templates: __dirname + '/src/**/*.jade',
    styles: __dirname + '/src/**/*.styl',
    js_dest: __dirname + '/app/js/client',
    appname: 'app'
};

function logfile(msg, color) {
    color = color || gutil.colors.yellow;
    return tap(function (file) {
        gutil.log(msg, color(file.path.replace(file.base, '')));
    });
}

function angularTask(opts) {
    return function angularTask () {
        opts = opts || {
            prod: false
        };

        var sources = opts.prod ? gulp.src(config.scripts) : watch({glob: config.scripts});
        var templates = opts.prod ? gulp.src(config.templates) : watch({glob: config.templates});

        templates = templates
            .pipe(jade())
            .pipe(ngtemplates());

        var task = es.concat(sources, templates)
            .pipe(ngcompile(config.appname, {continuous: !opts.prod}))
            .pipe(logfile('processing'))

        if (!opts.prod) {
            // in dev, we want to jslint our files.
            task = task
                .pipe(jshint()) // we only jslint the files that are going to be included
                .pipe(jshint.reporter(stylish))
                // write the files independently
                .pipe(gulp.dest(config.js_dest));
        }

        if (opts.prod) {
            task = task
                .pipe(concat('app.js'))
                .pipe(uglify())
                .pipe(logfile('done writing', gutil.colors.green))
                .pipe(gulp.dest(config.js_dest))
        }

        return task;
    }
}

function styleTask(opts) {
    opts = opts || {prod: false};
    return function () {
        return opts.prod ? gulp.src(config.styles) : watch({glob: config.styles})
            .pipe(stylus({
                set: ['compress']
            }));
    };
}

gulp.task('clean', function () {
    return gulp.src([
            config.js_dest
        ], {read: false})
        .pipe(clean());
});

gulp.task('build-angular-app-dev', angularTask({prod: false}));
gulp.task('build-angular-app-prod', angularTask({prod: true}));

gulp.task('style', function () {
    return gulp.src(config.styles)
    .pipe(stylus({
        set: ['compress']
    }));
});

gulp.task('build', ['clean', 'build-angular-app-prod'])
gulp.task('watch', ['build-angular-app-dev']);
gulp.task('default', ['build']);
