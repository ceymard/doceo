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
var inject = require('gulp-inject');

var es = require('event-stream');

var stylish = require('jshint-stylish');

var config = {
    main: __dirname + '/src/apptemplates/main.jade',
    scripts: __dirname + '/src/js/**/*.js',
    templates: __dirname + '/src/js/**/*.jade',
    styles: __dirname + '/src/**/style/*.styl',
    apptemplates: __dirname + '/src/apptemplates/**.jade',
    js_dest: __dirname + '/app/js/client',
    appname: 'app'
};

function logfile(msg, color) {
    color = color || gutil.colors.yellow;
    return tap(function (file) {
        gutil.log(msg, color(file.path.replace(__dirname + '/', '')));
    });
}

function log_wrote() { return logfile('wrote', gutil.colors.green); }
function log_processed() { return logfile('processed'); }
function log_removed() { return logfile('removed', gutil.colors.red); }

function angularTask(opts) {
    return function angularTask () {
        opts = opts || {
            prod: false
        };

        var sources = gulp.src(config.scripts);
        var templates = gulp.src(config.templates);

        templates = templates
            .pipe(jade())
            .pipe(ngtemplates());

        var task = es.concat(sources, templates)
            .pipe(ngcompile(config.appname))
            .pipe(log_processed())

        if (!opts.prod) {
            // in dev, we want to jslint our files.
            task = task
                .pipe(jshint()) // we only jslint the files that are going to be included
                .pipe(jshint.reporter(stylish))
                // write the files independently
                .pipe(gulp.dest(config.js_dest))
                .pipe(log_wrote());
        } else {
            task = task
                .pipe(concat('app.js'))
                .pipe(uglify())
                .pipe(log_wrote)
                .pipe(gulp.dest(config.js_dest))
        }

        var main = gulp.src(config.main)
            .pipe(jade())
            .pipe(inject(task))
            .pipe(gulp.dest(__dirname + '/app'))
            .pipe(log_wrote())

        return main;
    }
}

function styleTask(opts) {
    return function () {
        return gulp.src(config.styles)
            .pipe(stylus({set: ['compress']}));
    };
}

gulp.task('clean', function () {
    return gulp.src([
            config.js_dest,
            'app/main.html'
        ], {read: false})
        .pipe(clean())
        .pipe(log_removed());
});

gulp.task('angular:dev', angularTask({prod: false}));
gulp.task('angular:prod', angularTask({prod: true}));

gulp.task('style', function () {
    return gulp.src(config.styles)
    .pipe(stylus({
        set: ['compress']
    }));
});

gulp.task('build', ['clean', 'angular:prod'])
gulp.task('watch', ['clean', 'angular:dev'], function () {
    var srcs = [config.scripts, config.style, config.templates, config.main];
    var i = 0;

    for (i = 0; i < srcs.length; i++) {
        var src = srcs[i];
        gulp.watch(src, ['clean', 'angular:dev']);
    }
});
gulp.task('default', ['build']);
