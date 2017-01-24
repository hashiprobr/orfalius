var gulp = require('gulp');
var orfalius = require('./orfalius');

gulp.task('orfalius', function() {
  return gulp.src('src/**/*.md')
    .pipe(orfalius('src/template.html'))
    .pipe(gulp.dest('site'));
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.md', ['orfalius'])
});

gulp.task('default', ['watch']);
