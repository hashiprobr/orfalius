var fs = require('fs');
var del = require('del');
var gulp = require('gulp');
var cache = require('gulp-cached');
var angelicus = require('./angelicus');
var orfalius = require('./orfalius');

const ASSETS = ['resources/**/css/*', 'resources/**/icons/*', 'resources/**/js/*'];
const STATIC = ['src/**/*', '!src/**/*.core', '!src/**/*.md'];
const CORES = ['src/**/*.core'];
const SOURCES = ['src/**/*.md'];
const DARK_SOURCES = ['dark-src/**/*.md'];
const TEMPLATE = 'resources/template.html';

parseNegatives = function(filename) {
  var ignored = fs.readFileSync(filename).toString();
  return ignored.trim().split(/\s+/).map(word => '!src/' + word);
};

clean = function() {
  return del(['site/*', 'bb/*']);
};

copyAssets = function() {
  return gulp.src(ASSETS)
    .pipe(cache('copying'))
    .pipe(gulp.dest('site'))
    .pipe(gulp.dest('bb'));
};

copyStatic = function() {
  return gulp.src(STATIC.concat(parseNegatives('.staignore')))
    .pipe(cache('copying'))
    .pipe(gulp.dest('site'));
};

runAngelicus = function() {
  return gulp.src(CORES)
    .pipe(cache('angelicusing'))
    .pipe(angelicus(TEMPLATE))
    .pipe(gulp.dest('site'));
};

runOrfalius = function() {
  return gulp.src(SOURCES.concat(parseNegatives('.orfignore')))
    .pipe(cache('orfaliusing'))
    .pipe(orfalius(TEMPLATE))
    .pipe(gulp.dest('site'));
};

runDarkOrfalius = function() {
  return gulp.src(DARK_SOURCES)
    .pipe(cache('orfaliusing'))
    .pipe(orfalius(TEMPLATE))
    .pipe(gulp.dest('bb'));
};

watch = function() {
  gulp.watch(ASSETS, copyAssets);
  gulp.watch(STATIC, copyStatic);
  gulp.watch(CORES, runAngelicus);
  gulp.watch(SOURCES, runOrfalius);
  gulp.watch(DARK_SOURCES, runDarkOrfalius);
  gulp.watch(TEMPLATE, gulp.parallel(runAngelicus, runOrfalius, runDarkOrfalius));
};

gulp.task('clean', clean)
gulp.task('default', gulp.series(gulp.parallel(copyAssets, copyStatic, runAngelicus, runOrfalius, runDarkOrfalius), watch));
