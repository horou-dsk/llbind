var gulp = require('gulp'),
    notify = require('gulp-notify'),
    plumber = require('gulp-plumber'),
    babel = require('gulp-babel'),
    jsmin = require('gulp-uglify'),
    rename = require('gulp-rename');

gulp.task("es",function(){
    gulp.src('src/scripts/*.js')
        .pipe(plumber({errorHandler: notify.onError('Error: <%= error.message %>')}))
        .pipe(babel({
            presets:['es2015']
        }))
        .pipe(gulp.dest('dist/javascripts'))
        .pipe(rename({suffix:".min"}))
        .pipe(jsmin())
        .pipe(gulp.dest('dist/javascripts'))
})

gulp.task('w',function(){
    gulp.watch('src/scripts/*.js',['es']);
})