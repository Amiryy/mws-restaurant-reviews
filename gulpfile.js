/*eslint-env node */
var gulp = require('gulp');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var uglify = require('gulp-uglify-es').default;
var babel = require('gulp-babel');
var sourceMaps = require('gulp-sourcemaps');
var imageMin = require('gulp-imagemin');
var resize = require('gulp-image-resize');

// Constants
var JS_SRC_FILES = 'src/js/**/*.js';
var JS_LIB_FILES = 'src/lib/**/*.js';
var CSS_FILES = 'src/css/**/*.css';
var DIST_DIR = './dist';

//Simple Setup
gulp.task('default', ['build-and-serve'], function() {
  gulp.watch(JS_SRC_FILES, ['scripts-dist']);
  gulp.watch(JS_SRC_FILES).on('change', browserSync.reload);
  gulp.watch(CSS_FILES, ['copy-styles']);
  gulp.watch(CSS_FILES).on('change', browserSync.reload);
  gulp.watch('./src/index.html', ['copy-html']);
  gulp.watch('./src/index.html').on('change', browserSync.reload);
  gulp.watch('./src/restaurant.html', ['copy-html']);
  gulp.watch('./src/restaurant.html').on('change', browserSync.reload);
  browserSync.init({
    server: DIST_DIR
  });
});

gulp.task('build-and-serve', [
  'copy-sw',
  'copy-manifest',
  'copy-lib',
  'scripts-dist',
  'copy-html',
  'copy-styles',
  'resize-images',
]);
gulp.task('copy-sw', function() {
  gulp.src('sw.js')
    .pipe(gulp.dest(DIST_DIR));
});
gulp.task('copy-manifest', function() {
  gulp.src('manifest.json')
    .pipe(gulp.dest(DIST_DIR));
});
gulp.task('copy-lib', function() {
  gulp.src(JS_LIB_FILES)
    .pipe(gulp.dest(DIST_DIR + '/lib'));
});
gulp.task('scripts-dist', function() {
	gulp.src(JS_SRC_FILES)
    .pipe(sourceMaps.init())
    .pipe(babel())
    .pipe(uglify())
    .pipe(sourceMaps.write())
    .pipe(gulp.dest(DIST_DIR + '/js'))
});

gulp.task('copy-html', function() {
	gulp.src('src/*.html')
		.pipe(gulp.dest(DIST_DIR));
});
gulp.task('copy-styles', function() {
  gulp.src(CSS_FILES)
    .pipe(gulp.dest(DIST_DIR + '/css'));
});
gulp.task('resize-images', function() {
  gulp.src('src/img/*')
    .pipe(resize({percentage : 50}))
    .pipe(imageMin([
      imageMin.jpegtran({progressive: true}),
    ]))
    .pipe(gulp.dest(DIST_DIR + '/img/thumbnails'))
});
