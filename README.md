# esbuild-loader

[esbuild](https://github.com/evanw/esbuild) is by far one of the fastest TS/ESNext to ES6 compilers, so it makes sense to use it over Babel/TSC with webpack to take advantage of both worlds (Speed and the webpack ecosytem).

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
          loader: 'tsx', // default value is current transpinling file ext
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
