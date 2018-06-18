/*eslint-env node */

var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var sourceMaps = require('gulp-sourcemaps');
var imageMin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');

//Simple Setup
gulp.task('simple', function() {
  gulp.watch('css/**/*.scss', ['styles-simple']);
  gulp.watch('js/**/*.js').on('change', browserSync.reload);
  gulp.watch('css/**/*.css').on('change', browserSync.reload);
  gulp.watch('./index.html').on('change', browserSync.reload);
  gulp.watch('./restaurant.html').on('change', browserSync.reload);
  browserSync.init({
    server: './'
  });
});

gulp.task('images', function() {
  gulp.src('img/*')
    .pipe(imageMin({
      progressive: true,
      use: [pngquant()]
    }))
    .pipe(gulp.dest('./img/quanted'))
});

//Build Setup
gulp.task('default', ['copy-html', 'copy-images', 'styles', 'scripts-concat', 'scripts-copy'], function() {
	gulp.watch('css/**/*.scss', ['styles']);
	gulp.watch('js/**/*.js', ['scripts-concat']);
	gulp.watch('/index.html', ['copy-html']);
	gulp.watch('./dist/index.html').on('change', browserSync.reload);

	browserSync.init({
		server: './dist'
	});
});

gulp.task('dist', [
	'copy-html',
	'copy-images',
	'styles',
	'scripts-dist',
  'scripts-copy'
]);

gulp.task('scripts-concat', function() {
  gulp.src('js/**/*.js')
    .pipe(babel())
    .pipe(concat('app.js'))
    .pipe(gulp.dest('./dist/js'))
});
gulp.task('scripts-copy', function() {
  gulp.src('sw.js')
    .pipe(gulp.dest('./dist'));
});

gulp.task('scripts-dist', function() {
	gulp.src('js/**/*.js')
    .pipe(sourceMaps.init())
    .pipe(babel())
    .pipe(concat('app.js'))
    .pipe(uglify())
    .pipe(sourceMaps.write())
    .pipe(gulp.dest('./dist/js'))
});

gulp.task('copy-html', function() {
	gulp.src('./*.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function() {
  gulp.src('img/*')
    .pipe(imageMin({
      progressive: true,
      use: [pngquant()]
    }))
    .pipe(gulp.dest('./dist/img'))
});

gulp.task('styles', function() {
  gulp.src('css/**/*.scss')
    .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 2 versions']
    }))
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream());
});