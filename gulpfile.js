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
gulp.task('default', [
  'copy-lib',
  'scripts-dist', 
  'copy-sw',
  'copy-html',
  'copy-images',
  'resize-images',
  'copy-styles'], function() {
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

//transpiling for idb promised library

gulp.task('copy-sw', function() {
  gulp.src('sw.js')
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
gulp.task('copy-images', function() {
  gulp.src('src/img/*')
    .pipe(imageMin([
      imageMin.jpegtran({progressive: true}),
    ]))
    .pipe(gulp.dest(DIST_DIR + '/img'))
});

gulp.task('styles', function() {
  gulp.src('css/**/*.scss')
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest(DIST_DIR + '/css'))
    .pipe(browserSync.stream());
});