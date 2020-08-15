const webpack4 = require('webpack4')
const webpack5 = require('webpack5')
const build = require('./build')
const fixtures = require('./fixtures')

describe.each([
  ['Webpack 4', webpack4],
  ['Webpack 5', webpack5],
])('%s', (_name, webpack) => {
  describe('Loader', () => {
    test('js', async () => {
      const stats = await build(webpack, fixtures.js)

      const { assets } = stats.compilation
      expect(assets['index.js'].source()).toMatchSnapshot()
    })

    test('tsx', async () => {
      const stats = await build(webpack, fixtures.tsx, (config) => {
        config.module.rules.push({
          test: /\.tsx$/,
          loader: 'esbuild-loader',
          options: {
            loader: 'tsx',
          },
        })
      })

      const { assets } = stats.compilation
      expect(assets['index.js'].source()).toMatchSnapshot()
    })
  })

  // Targets
  test('target', async () => {
    const stats = await build(webpack, fixtures.target, (config) => {
      config.module.rules[0].options = {
        target: 'es2015',
      }
    })

    const { assets } = stats.compilation
    expect(assets['index.js'].source()).toMatchSnapshot()
  })

  describe('Source-map', () => {
    test('source-map eval', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.devtool = 'eval-source-map'
      })

      const { assets } = stats.compilation
      expect(assets['index.js'].source()).toMatchSnapshot()
    })

    test('source-map inline', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.devtool = 'inline-source-map'
      })

      const { assets } = stats.compilation
      expect(assets['index.js'].source()).toMatchSnapshot()
    })

    test('source-map file', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.devtool = 'source-map'
      })

      const { assets } = stats.compilation
      expect(assets['index.js'].source()).toMatchSnapshot()
      expect(assets['index.js.map'].source()).toMatchSnapshot()
    })

    test('source-map plugin', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        delete config.devtool
        config.plugins.push(new webpack.SourceMapDevToolPlugin({}))
      })

      const { assets } = stats.compilation
      expect(assets['index.js'].source()).toMatchSnapshot()
    })
  })
})
