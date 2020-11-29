const gulp = require('gulp')
const sass = require('gulp-sass')
const webpack = require('webpack')
const contentWebpackConfig = require('./content/webpack.config')
const backgroundWebpackConfig = require('./background/webpack.config')

function packContent(cb) {
  webpack(contentWebpackConfig, function (err, stats) {
    if (err) {
      throw err
    }
    console.log(stats.toString())
    cb()
  })
}

function copyManifest() {
  return gulp.src('manifest.json').pipe(gulp.dest('./build'))
}

function packBackground(cb) {
  webpack(backgroundWebpackConfig, function (err, stats) {
    if (err) {
      throw err
    }
    console.log(stats.toString())
    cb()
  })
}

function compileCSS() {
  return gulp.src('./content/content.scss').pipe(sass().on('error', sass.logError)).pipe(gulp.dest('./build'))
}

const build = gulp.series(copyManifest, compileCSS, packBackground, packContent)

exports.build = build
exports.watch = function () {
  gulp.watch('content/**/*', 'build')
}
