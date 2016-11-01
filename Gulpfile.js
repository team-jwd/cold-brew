const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify');
const watch = require('gulp-watch');
const notify = require('gulp-notify');


const paths = {
  babel: "src/rtc.js",
};

function handleErrors() {
  notify.onError({
    title : 'Compile Error',
    message : '<%= error.message %>'
  }).apply(this, arguments);
  this.emit('end'); //keeps gulp from hanging on this task
}

gulp.task('watch', function() {
  gulp.watch(paths.babel, ['babel']);
  gulp.watch(paths.cold_brew, ['build']);
  gulp.watch(paths.cold_brew_bundled, ['uglify'])
});

gulp.task('babel', function() {
  gulp.src(paths.babel)
    .pipe(babel())
    .pipe(gulp.dest('.'));
});

gulp.task('default', ['babel', 'watch']);