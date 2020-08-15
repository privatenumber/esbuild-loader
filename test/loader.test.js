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

      expect(
        stats.mfs.readFileSync('/dist/index.js', 'utf-8')
      ).toMatchSnapshot()
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

      expect(
        stats.mfs.readFileSync('/dist/index.js', 'utf-8')
      ).toMatchSnapshot()
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
    expect(stats.mfs.readFileSync('/dist/index.js', 'utf-8')).toMatchSnapshot()
  })

  describe('Source-map', () => {
    test('source-map eval', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.devtool = 'eval-source-map'
      })

      const { assets } = stats.compilation
      expect(
        stats.mfs.readFileSync('/dist/index.js', 'utf-8')
      ).toMatchSnapshot()
    })

    test('source-map inline', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.devtool = 'inline-source-map'
      })

      const { assets } = stats.compilation
      expect(
        stats.mfs.readFileSync('/dist/index.js', 'utf-8')
      ).toMatchSnapshot()
    })

    test('source-map file', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        config.devtool = 'source-map'
      })

      const { assets } = stats.compilation
      expect(
        stats.mfs.readFileSync('/dist/index.js', 'utf-8')
      ).toMatchSnapshot()
      expect(
        stats.mfs.readFileSync('/dist/index.js.map', 'utf-8')
      ).toMatchSnapshot()
    })

    test('source-map plugin', async () => {
      const stats = await build(webpack, fixtures.js, (config) => {
        delete config.devtool
        config.plugins.push(new webpack.SourceMapDevToolPlugin({}))
      })

      const { assets } = stats.compilation
      expect(
        stats.mfs.readFileSync('/dist/index.js', 'utf-8')
      ).toMatchSnapshot()
    })
  })

  test('webpack magic comments', async () => {
    const stats = await build(webpack, fixtures.webpackMagicComments)

    const { assets } = stats.compilation
    expect(
      stats.mfs.readFileSync('/dist/index.js', 'utf-8')
    ).toMatchSnapshot()
    expect(assets).toHaveProperty(['named-chunk-foo.js'])
    expect(
      stats.mfs.readFileSync('/dist/named-chunk-foo.js', 'utf-8')
    ).toMatchSnapshot()
    expect(assets).toHaveProperty(['named-chunk-bar.js'])
    expect(
      stats.mfs.readFileSync('/dist/named-chunk-bar.js', 'utf-8')
    ).toMatchSnapshot()
  })
})