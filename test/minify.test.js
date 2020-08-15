const webpack4 = require('webpack4')
const webpack5 = require('webpack5')
const build = require('./build')
const { ESBuildMinifyPlugin } = require('../src')
const fixtures = require('./fixtures')

describe.each([
  ['Webpack 4', webpack4],
  ['Webpack 5', webpack5],
])('%s Loader + Minification', (_name, webpack) => {
  test('minify', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minifyWhitespace', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifyWhitespace: true,
          }),
        ],
      }
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minifyIdentifiers', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifyIdentifiers: true,
          }),
        ],
      }
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minifySyntax', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            minifySyntax: true,
          }),
        ],
      }
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minify w/ no devtool', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minify w/ devtool inline-source-map', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.devtool = 'inline-source-map'
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minify w/ devtool source-maps', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      config.devtool = 'source-map'
      config.optimization = {
        minimize: true,
        minimizer: [new ESBuildMinifyPlugin()],
      }
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minify w/ sourcemap option', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            sourcemap: true,
          }),
        ],
      }
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minify w/ sourcemap option and source-map plugin inline', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            sourcemap: true,
          }),
        ],
      }
      config.plugins.push(new webpack.SourceMapDevToolPlugin({}))
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  test('minify w/ sourcemap option and source-map plugin external', async () => {
    const stats = await build(webpack, fixtures.js, (config) => {
      delete config.devtool
      config.optimization = {
        minimize: true,
        minimizer: [
          new ESBuildMinifyPlugin({
            sourcemap: true,
          }),
        ],
      }
      config.plugins.push(
        new webpack.SourceMapDevToolPlugin({
          filename: 'index.js.map',
        })
      )
    })

    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
    expect(
      stats.mfs.readFileSync('/dist/index.js.map', 'utf-8')
    ).toMatchSnapshot()
  })
})
