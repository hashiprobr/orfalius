const fs = require('fs');
const del = require('del');
const gulp = require('gulp');
const cache = require('gulp-cached');
const orfalius = require('./orfalius');
const browserSync = require('browser-sync').create();


const TEMPLATE = 'resources/template.html';
const SOURCE = 'src/**/*.md';
const SOURCE_PRIVATE = 'src_private/**/*.md';
const SNIPPETS = 'src/**/*.mds';
const SNIPPETS_PRIVATE = 'src_private/**/*.mds';
const IMAGES = 'src/**/img/**/*';
const IMAGES_PRIVATE = 'src_private/**/img/**/*';
const STATIC = ['src/**/*', '!' + SOURCE, '!' + SNIPPETS];
const STATIC_PRIVATE = ['src_private/**/*', '!' + SOURCE_PRIVATE, '!' + SNIPPETS_PRIVATE];
const ASSETS = ['resources/**/css/*', 'resources/**/fonts/*', 'resources/**/icons/*', 'resources/**/js/*'];


function parse(filename) {
    let ignore = fs.readFileSync(filename).toString();
    return ignore.trim().split(/\s+/).map(word => '!src/' + word);
}


function clean() {
    return del(['site/*', 'site_private/*']);
}


function compile() {
    return gulp.src([SOURCE].concat(parse('.orfignore'))).
        pipe(cache('compile')).
        pipe(orfalius(TEMPLATE)).
        pipe(gulp.dest('site'));
}

function compilePrivate() {
    return gulp.src([SOURCE_PRIVATE]).
        pipe(cache('compile')).
        pipe(orfalius(TEMPLATE)).
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

function copyAssets() {
    return gulp.src(ASSETS).
        pipe(cache('copy')).
        pipe(gulp.dest('site')).
        pipe(gulp.dest('site_private'));
}


function watch() {
    gulp.watch([
        TEMPLATE,
        SOURCE,
        SNIPPETS,
        IMAGES], compile).on('change', browserSync.reload);
    gulp.watch([
        TEMPLATE,
        SOURCE_PRIVATE,
        SNIPPETS_PRIVATE,
        IMAGES_PRIVATE], compilePrivate);
    gulp.watch(STATIC, copyStatic).on('change', browserSync.reload);
    gulp.watch(STATIC_PRIVATE, copyStaticPrivate);
    gulp.watch(ASSETS, copyAssets).on('change', browserSync.reload);
}

function serve() {
    browserSync.init({
        server: {
            baseDir: './site',
        },
        open: false,
        reloadDelay: 10,
    });
    watch();
}


gulp.task('clean', clean);

gulp.task('default', gulp.series(
    gulp.parallel(
        compile,
        compilePrivate,
        copyStatic,
        copyStaticPrivate,
        copyAssets),
    serve
));
