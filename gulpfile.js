var gulp = require('gulp');
var rename = require("gulp-rename");
var changed = require("gulp-changed");
var imageResize = require('gulp-image-resize');
var parallel = require("concurrent-transform");
var os = require("os");
 
gulp.task('default', function () {
  gulp.src('/Users/ian/Pictures/lol/**/*.{jpg,jpeg,png}')
    // .pipe(changed("thumbnails"))
    .pipe(parallel(
      imageResize({
        width: 300,
        quality: 0.66,
        filter: 'Catrom'
      }),
      os.cpus().length
    ))
    .pipe(rename(function (path) {
      path.basename += "-thumb";
    }))
    .pipe(gulp.dest("thumbnails"));
});
