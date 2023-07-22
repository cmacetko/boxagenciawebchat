const exec = require('child_process').exec;

const gulp = require('gulp');
const babel = require('gulp-babel');
const css = require('gulp-clean-css');
const livereload = require('gulp-livereload');

gulp.task('copy', () => {

    return gulp.src('src/assets/**/*').pipe(gulp.dest('app/assets'));
        
});

gulp.task('copy2', () => {

    return gulp.src('assets/**/*').pipe(gulp.dest('app/assets'));
        
});

gulp.task('html', () => {

    return gulp.src('src/index.html').pipe(gulp.dest('app/')).pipe(livereload());

});

gulp.task('css', () => {

    return gulp.src('src/**/*.css').pipe(css()).pipe(gulp.dest('app/')).pipe(livereload());

});

gulp.task('js', () => {

    return gulp.src(['main.js', 'src/**/*.js']).pipe(babel()).pipe(gulp.dest('app/')).pipe(livereload());

});

gulp.task('watch', async function() {

	livereload.listen();

	gulp.watch('src/**/*.html', gulp.series('html'));
	gulp.watch('src/**/*.css', gulp.series('css'));
	gulp.watch('src/**/*.js', gulp.series('js'));

});

gulp.task('build', gulp.series('copy', 'copy2', 'html', 'css', 'js'));