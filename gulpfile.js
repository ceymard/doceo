var fs = require('fs');

var gulp = require('gulp');

var _clean = require('gulp-clean');
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
var zip = require('gulp-zip');

var es = require('event-stream');

var stylish = require('jshint-stylish');

var config = {
    debug: false,
    main: __dirname + '/src/apptemplates/main.jade',
    scripts: __dirname + '/src/js/**/*.js',
    templates: __dirname + '/src/js/**/*.jade',
    styles: __dirname + '/src/style/doceo.styl',
    apptemplates: __dirname + '/src/apptemplates/**.jade',
    js_dest: __dirname + '/app/js/client',
    css_dest: __dirname + '/app/css',
    appname: 'app'
};

function logfile(msg, color) {
    color = color || gutil.colors.yellow;
    return tap(function (file) {
        gutil.log(msg, color(file.path.replace(__dirname + '/', '')));
    });
}

var package = JSON.parse(fs.readFileSync(__dirname + '/package.json'));
config.package = package;

function log_wrote() { return logfile('wrote', gutil.colors.green); }
function log_processed() { return logfile('processed'); }
function log_removed() { return logfile('removed', gutil.colors.red); }
function clean() {
    var args = Array.prototype.slice.call(arguments, 0);
    return gulp.src(args, {read: false})
        .pipe(_clean())
        .pipe(log_removed());
}

function angularTask(opts) {
    return function angularTask () {
    }
}

function styleTask(opts) {
    return function () {
        return gulp.src(config.styles)
            .pipe(stylus({set: ['compress']}));
    };
}

gulp.task('clean:js', function () { return clean(config.js_dest); });
gulp.task('clean:main', function () { return clean('app/main.html'); });
gulp.task('clean:css', function () { return clean(config.css_dest); });



gulp.task('angular', ['clean:js'], function () {
    var sources = gulp.src(config.scripts);
    var templates = gulp.src(config.templates);

    templates = templates
        .pipe(jade())
        .pipe(ngtemplates());

    var task = es.concat(sources, templates)
        .pipe(ngcompile(config.appname))
        .pipe(log_processed())

    if (config.debug) {
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
            .pipe(log_wrote())
            .pipe(gulp.dest(config.js_dest))
    }

    return task;
});

gulp.task('style', ['clean:css'], function () {
    return gulp.src(config.styles)
        .pipe(stylus({
            use: ['nib'],
            set: ['compress']
        }))
        .pipe(gulp.dest(config.css_dest))
        .pipe(log_wrote());
});

gulp.task('main', ['clean:main', 'angular', 'style'], function () {
    return gulp.src(config.main)
        .pipe(jade({data: config}))
        .pipe(inject(gulp.src([
                config.js_dest + '/**/*.js',
                config.css_dest + '**/*.css'
            ]), {addRootSlash: false, addPrefix: '.', ignorePath: 'app'}))
        .pipe(gulp.dest(__dirname + '/app'))
        .pipe(log_wrote())
});

gulp.task('zip', ['main', 'style', 'angular'], function () {
    return gulp.src('./app/**/*')
        .pipe(logfile('adding to zip', gutil.colors.green))
        .pipe(zip('app.nw'))
        .pipe(gulp.dest('build'));
})

// config.debug = true;

gulp.task('build', ['main', 'style', 'angular'])

gulp.task('watch', ['style', 'angular'], function () {
    gulp.watch(config.scripts, ['angular']);
    gulp.watch(config.templates, ['angular']);
    gulp.watch(config.main, ['angular']);
    gulp.watch(config.styles, ['style']);
});

gulp.task('default', ['build']);
