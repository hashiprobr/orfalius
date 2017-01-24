var gulp = require('gulp');
var orfalius = require('./orfalius');

gulp.task('orfalius', function() {
  return gulp.src('src/**/*.md')
    .pipe(orfalius('src/template.html'))
    .pipe(gulp.dest('site'));
});

gulp.task('default', ['orfalius']);
