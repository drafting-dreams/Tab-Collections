const gulp = require('gulp')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const webpack = require('webpack')
const rimraf = require('rimraf')
const path = require('path')

const contentWebpackConfig = require('./content/webpack.config')
const backgroundWebpackConfig = require('./background/webpack.config')

const DEV = process.argv[3] === '--dev'
let TARGET_FOLDER = 'build'

if (DEV) {
  TARGET_FOLDER = 'dist'
  contentWebpackConfig.mode = backgroundWebpackConfig.mode = 'development'
  contentWebpackConfig.devtool = backgroundWebpackConfig.devtool = 'source-map'
  contentWebpackConfig.output.path = backgroundWebpackConfig.output.path = path.resolve(process.cwd(), TARGET_FOLDER)
}

function packContent(cb) {
  webpack(contentWebpackConfig, function (err, stats) {
    if (err) {
      console.error(err)
      throw err
    }
    console.log(stats.toString())
    cb()
  })
}

function copyManifest() {
  return gulp.src('manifest.json').pipe(gulp.dest(`./${TARGET_FOLDER}`))
}

function copyFavIcon() {
  return gulp.src(['./logo/logo16.png', './logo/logo48.png', './logo/logo128.png']).pipe(gulp.dest(`./${TARGET_FOLDER}`))
}

function packBackground(cb) {
  webpack(backgroundWebpackConfig, function (err, stats) {
    if (err) {
      console.error(err)
      throw err
    }
    console.log(stats.toString())
    cb()
  })
}

function compileCSS() {
  return gulp
    .src('./content/content.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer())
    .pipe(gulp.dest(`./${TARGET_FOLDER}`))
}

function clean(cb) {
  rimraf(`./${TARGET_FOLDER}`, cb)
}

const build = gulp.series(clean, gulp.parallel(copyManifest, copyFavIcon, compileCSS, packBackground, packContent))

exports.build = build
exports.watch = function () {
  gulp.watch('content/**/*', 'build')
}
