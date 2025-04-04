import fs from 'fs';
import { deleteSync } from 'del';
import gulp from 'gulp';
import cache from 'gulp-cached';
import BrowserSync from 'browser-sync';

import orfalius from './orfalius.js';

const browserSync = BrowserSync.create();


const TEMPLATE = 'resources/template.html';
const SOURCE = 'src/**/*.md';
const SOURCE_PRIVATE = 'src_private/**/*.md';
const SNIPPETS = 'src/**/*.mds';
const SNIPPETS_PRIVATE = 'src_private/**/*.mds';
const IMAGES = 'src/**/img/**/*';
const IMAGES_PRIVATE = 'src_private/**/img/**/*';
const STATIC = ['src/**/*', '!src/**/vid/**/*', `!${SOURCE}`, `!${SNIPPETS}`];
const STATIC_PRIVATE = ['src_private/**/*', '!src_private/**/vid/**/*', `!${SOURCE_PRIVATE}`, `!${SNIPPETS_PRIVATE}`];
const ASSETS = ['resources/**/css/*', 'resources/**/fonts/*', 'resources/**/icons/*', 'resources/**/js/*'];


function parse(filename) {
    const ignore = fs.readFileSync(filename).toString();
    return ignore.trim().split(/\s+/).map((word) => `!src/${word}`);
}


function clean(done) {
    deleteSync(['site/*', 'site_private/*']);
    done();
}


function compile() {
    return gulp.src([SOURCE].concat(parse('.orfignore')))
        .pipe(cache('compile'))
        .pipe(orfalius(TEMPLATE))
        .pipe(gulp.dest('site'));
}

function compilePrivate() {
    return gulp.src([SOURCE_PRIVATE])
        .pipe(cache('compile'))
        .pipe(orfalius(TEMPLATE))
        .pipe(gulp.dest('site_private'));
}

function copyStatic() {
    return gulp.src(STATIC.concat(parse('.staignore')), { encoding: false })
        .pipe(cache('copy'))
        .pipe(gulp.dest('site'));
}

function copyStaticPrivate() {
    return gulp.src(STATIC_PRIVATE, { encoding: false })
        .pipe(cache('copy'))
        .pipe(gulp.dest('site_private'));
}

function copyAssets() {
    return gulp.src(ASSETS, { encoding: false })
        .pipe(cache('copy'))
        .pipe(gulp.dest('site'))
        .pipe(gulp.dest('site_private'));
}


function watch() {
    gulp.watch([TEMPLATE, SOURCE, SNIPPETS, IMAGES], compile).on('change', browserSync.reload);
    gulp.watch([TEMPLATE, SOURCE_PRIVATE, SNIPPETS_PRIVATE, IMAGES_PRIVATE], compilePrivate).on('change', browserSync.reload);
    gulp.watch(STATIC, copyStatic).on('change', browserSync.reload);
    gulp.watch(STATIC_PRIVATE, copyStaticPrivate).on('change', browserSync.reload);
    gulp.watch(ASSETS, copyAssets).on('change', browserSync.reload);
}

function serve() {
    browserSync.init({
        server: {
            baseDir: './site',
        },
        open: false,
        reloadDelay: 1000,
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
