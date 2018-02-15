var del = require('del');
var gulp = require('gulp');
var cache = require('gulp-cached');
var angelicus = require('./angelicus');
var orfalius = require('./orfalius');

const ASSETS = ['resources/**/css/*', 'resources/**/icons/*', 'resources/**/js/*'];
const STATIC = ['src/**/img/*', 'src/**/*.pdf', 'src/**/*.json'];
const CORES = ['src/**/*.html'];
const SOURCES = ['src/**/*.md'];
const DARK_SOURCES = ['dark-src/**/*.md'];
const TEMPLATE = 'resources/template.html';

gulp.task('clean', function() {
  return del(['site/*', 'bb/*']);
});

gulp.task('copy-assets', function() {
  return gulp.src(ASSETS)
    .pipe(cache('copying'))
    .pipe(gulp.dest('site'))
    .pipe(gulp.dest('bb'));
});

gulp.task('copy-static', function() {
  return gulp.src(STATIC)
    .pipe(cache('copying'))
    .pipe(gulp.dest('site'));
});

gulp.task('angelicus', function() {
  return gulp.src(CORES)
    .pipe(cache('angelicusing'))
    .pipe(angelicus(TEMPLATE))
    .pipe(gulp.dest('site'));
});

gulp.task('orfalius', function() {
  return gulp.src(SOURCES)
    .pipe(cache('orfaliusing'))
    .pipe(orfalius(TEMPLATE))
    .pipe(gulp.dest('site'));
});

gulp.task('dark-orfalius', function() {
  return gulp.src(DARK_SOURCES)
    .pipe(cache('orfaliusing'))
    .pipe(orfalius(TEMPLATE, true))
    .pipe(gulp.dest('bb'));
});

gulp.task('watch', ['copy-assets', 'copy-static', 'angelicus', 'orfalius', 'dark-orfalius'], function() {
  gulp.watch(ASSETS, ['copy-assets']);
  gulp.watch(STATIC, ['copy-static']);
  gulp.watch(CORES, ['angelicus']);
  gulp.watch(SOURCES, ['orfalius']);
  gulp.watch(DARK_SOURCES, ['dark-orfalius']);
  gulp.watch(TEMPLATE, ['angelicus', 'orfalius', 'dark-orfalius']);
});

gulp.task('default', ['watch']);
