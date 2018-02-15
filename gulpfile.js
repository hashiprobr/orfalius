var del = require('del');
var gulp = require('gulp');
var cache = require('gulp-cached');
var orfalius = require('./orfalius');

const ASSETS = ['resources/**/css/*', 'resources/**/icons/*', 'resources/**/js/*'];
const STATIC = ['src/**/img/*', 'src/**/*.json'];
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

gulp.task('watch', ['copy-assets', 'copy-static', 'orfalius', 'dark-orfalius'], function() {
  gulp.watch(ASSETS, ['copy-assets']);
  gulp.watch(STATIC, ['copy-static']);
  gulp.watch(SOURCES, ['orfalius']);
  gulp.watch(DARK_SOURCES, ['dark-orfalius']);
  gulp.watch(TEMPLATE, ['orfalius', 'dark-orfalius']);
});

gulp.task('default', ['watch']);
