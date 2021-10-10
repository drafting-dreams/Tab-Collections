const gulp = require('gulp')
const webpack = require('webpack')
const rimraf = require('rimraf')
const path = require('path')
const fs = require('fs')

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
  try {
    const filePath = path.join(__dirname, 'node_modules/@material-ui/styles/esm/withStyles/withStyles.js')
    const data = fs.readFileSync(filePath, 'utf-8')
    const newData = data.replace(/(name)\s*=\s*(options.name)/, (match, $1, $2) => `${$1} = 'Mui' + ${$2} + '-tab-collections'`)
    fs.writeFileSync(filePath, newData)
  } catch (err) {
    console.log('Replacing materialUI withStyle file content error.', err)
    throw err
  }
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

function clean(cb) {
  rimraf(`./${TARGET_FOLDER}`, cb)
}

const build = gulp.series(clean, gulp.parallel(copyManifest, copyFavIcon, packBackground, packContent))

exports.build = build
exports.watch = function () {
  gulp.watch('content/**/*', 'build')
}
