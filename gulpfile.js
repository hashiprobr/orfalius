const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const cache = require('gulp-cached');
const orfalius = require('./orfalius');


const ASSETS = ['resources/**/css/*', 'resources/**/icons/*', 'resources/**/js/*'];
const IMAGES = ['src/**/img/**/*'];
const IMAGES_PRIVATE = ['src_private/**/img/**/*'];
const STATIC = ['src/**/*', '!src/**/*.md'];
const STATIC_PRIVATE = ['src_private/**/*', '!src_private/**/*.md'];
const SOURCE = ['src/**/*.md'];
const SOURCE_PRIVATE = ['src_private/**/*.md'];
const TEMPLATE = 'resources/template.html';


function parse(filename) {
    let ignore = fs.readFileSync(filename).toString();
    return ignore.trim().split(/\s+/).map(word => '!src/' + word);
}

function clean() {
    return del(['site/*', 'site_private/*']);
}


function copyAssets() {
    return gulp.src(ASSETS).
        pipe(cache('copy')).
        pipe(gulp.dest('site')).
        pipe(gulp.dest('site_private'));
}

function copyStatic() {
    return gulp.src(STATIC.concat(parse('.staignore'))).
        pipe(cache('copy')).
        pipe(gulp.dest('site'));
}

function copyStaticPrivate() {
    return gulp.src(STATIC_PRIVATE).
        pipe(cache('copy')).
        pipe(gulp.dest('site_private'));
}

function compile() {
    return gulp.src(SOURCE.concat(parse('.orfignore'))).
        pipe(cache('compile')).
        pipe(orfalius(TEMPLATE)).
        pipe(gulp.dest('site'));
}

function compilePrivate() {
    return gulp.src(SOURCE_PRIVATE).
        pipe(cache('compile')).
        pipe(orfalius(TEMPLATE)).
        pipe(gulp.dest('site_private'));
}

function watch() {
    gulp.watch(ASSETS, copyAssets);
    gulp.watch(IMAGES, compile);
    gulp.watch(IMAGES_PRIVATE, compilePrivate);
    gulp.watch(STATIC, copyStatic);
    gulp.watch(STATIC_PRIVATE, copyStaticPrivate);
    gulp.watch(SOURCE, compile);
    gulp.watch(SOURCE_PRIVATE, compilePrivate);
    gulp.watch([TEMPLATE], gulp.parallel(compile, compilePrivate));
}


gulp.task('clean', clean);

gulp.task('default', gulp.series(
    gulp.parallel(
        copyAssets,
        copyStatic,
        copyStaticPrivate,
        compile,
        compilePrivate),
    watch
));
