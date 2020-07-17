# esbuild-loader

[esbuild](https://github.com/evanw/esbuild) is by far one of the fastest TS/ESNext to ES6 compilers, so it makes sense to use it over Babel/TSC with webpack to take advantage of both worlds (Speed and the webpack ecosytem).

You might also like [maho](https://github.com/egoist/maho), a React framework powered by esbuild.

## Install

```bash
yarn add esbuild-loader --dev
```

## Usage

In `webpack.config.js`:

```js
const { ESBuildPlugin } = require('esbuild-loader')

module.exports = {
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loader: 'esbuild-loader',
        options: {
          // All options are optional
          target: 'es2015', // default, or 'es20XX', 'esnext'
          jsxFactory: 'React.createElement',
          jsxFragment: 'React.Fragment',
          sourceMap: false // Enable sourcemap
        },
      },
    ],
  },
  plugins: [new ESBuildPlugin()],
}
```

## License

MIT &copy; [EGOIST (Kevin Titor)](https://github.com/sponsors/egoist)
