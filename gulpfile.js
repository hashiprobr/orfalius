var gulp = require('gulp');
var orfalius = require('./orfalius');

gulp.task('copy', function() {
  return gulp.src('src/**/img/*')
    .pipe(gulp.dest('site'));
});

gulp.task('orfalius', function() {
  return gulp.src('src/**/*.md')
    .pipe(orfalius('src/template.html'))
    .pipe(gulp.dest('site'));
});

gulp.task('watch', function() {
  gulp.watch('src/**/img/*', ['copy']);
  gulp.watch('src/**/*.md', ['orfalius']);
});

gulp.task('default', ['watch']);
