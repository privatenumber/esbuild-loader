# esbuild-loader <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/v/esbuild-loader"></a> <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/dm/esbuild-loader"></a> <a href="https://packagephobia.now.sh/result?p=esbuild-loader"><img src="https://packagephobia.now.sh/badge?p=esbuild-loader"></a>

Speed up your Webpack build with [esbuild](https://github.com/evanw/esbuild)! 🔥

[_esbuild_](https://github.com/evanw/esbuild) is a JavaScript bundler written in Go that supports blazing fast ESNext & TypeScript transpilation and [JS minification](https://github.com/privatenumber/minification-benchmarks/).

[_esbuild-loader_](https://github.com/privatenumber/esbuild-loader) lets you harness the speed of esbuild in your Webpack build by offering faster alternatives for transpilation (eg. babel-loader/ts-loader) and minification (eg. Terser)!

Curious how much faster your build will be? See [what users are saying](https://github.com/privatenumber/esbuild-loader/discussions/138).

<sub>Support this project by ⭐️ starring and sharing it. [Follow me](https://github.com/privatenumber) to see what other cool projects I'm working on! ❤️</sub>

## 🚀 Install

```bash
npm i -D esbuild-loader
```

## 🚦 Quick Setup

### Javascript & JSX transpilation (eg. Babel)
In `webpack.config.js`:

```diff
  module.exports = {
    module: {
      rules: [
-       {
-         test: /\.js$/,
-         use: 'babel-loader',
-       },
+       {
+         test: /\.js$/,
+         loader: 'esbuild-loader',
+         options: {
+           loader: 'jsx',  // Remove this if you're not using JSX
+           target: 'es2015'  // Syntax to compile to (see options below for possible values)
+         }
+       },

        ...
      ],
    },
  }
```

### TypeScript & TSX
In `webpack.config.js`:

```diff
  module.exports = {
    module: {
      rules: [
-       {
-         test: /\.tsx?$/,
-         use: 'ts-loader'
-       },
+       {
+         test: /\.tsx?$/,
+         loader: 'esbuild-loader',
+         options: {
+           loader: 'tsx',  // Or 'ts' if you don't need tsx
+           target: 'es2015'
+         }
+       },

        ...
      ]
    },
  }
```

#### Configuration
If you have a `tsconfig.json` file, esbuild-loader will automatically detect it.

Alternatively, you can also pass it in directly via the [`tsconfigRaw` option](https://esbuild.github.io/api/#tsconfig-raw):
```diff
  {
      test: /\.tsx?$/,
      loader: 'esbuild-loader',
      options: {
          loader: 'tsx',
          target: 'es2015',
+         tsconfigRaw: require('./tsconfig.json')
      }
  }
```

⚠️ esbuild only supports a subset of `tsconfig` options [(see `TransformOptions` interface)](https://github.com/evanw/esbuild/blob/88821b7e7d46737f633120f91c65f662eace0bcf/lib/shared/types.ts#L159-L165) and does not do type-checks. It's recommended to use a type-aware IDE or `tsc --noEmit` for type-checking instead. It is also recommended to enable [`isolatedModules`](https://www.typescriptlang.org/tsconfig#isolatedModules) and [`esModuleInterop`](https://www.typescriptlang.org/tsconfig/#esModuleInterop) options in your `tsconfig` by the [esbuild docs](https://esbuild.github.io/content-types/#typescript-caveats).


### JS Minification (eg. Terser)
You can replace JS minifiers like Terser or UglifyJs. Checkout the [benchmarks](https://github.com/privatenumber/minification-benchmarks) to see how much faster esbuild is. The `target` option tells esbuild that it can use newer JS syntax to perform better minification.

In `webpack.config.js`:

```diff
+ const { ESBuildMinifyPlugin } = require('esbuild-loader')

  module.exports = {
    ...,

+   optimization: {
+     minimizer: [
+       new ESBuildMinifyPlugin({
+         target: 'es2015'  // Syntax to compile to (see options below for possible values)
+       })
+     ]
+   },
  }
```

#### _💁‍♀️ Protip: Use the minify plugin in-place of the loader to transpile the JS_
If you're not using TypeScript, JSX, or any syntax unsupported by Webpack, you can also leverage the minifier for transpilation (as an alternative to Babel). It will be faster because there's less files to work on and will produce a smaller output because the polyfills will only be bundled once for the entire build instead of per file. Simply set the `target` option on the minifier to specify which support level you want.


### CSS Minification

There are two ways to minify CSS, depending on your setup. You should already have CSS setup in your build using [`css-loader`](https://github.com/webpack-contrib/css-loader).

#### CSS assets
If your CSS is extracted and emitted as a CSS file, you can replace CSS minification plugins like [`css-minimizer-webpack-plugin`](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) or [`optimize-css-assets-webpack-plugin`](https://github.com/NMFR/optimize-css-assets-webpack-plugin) with the same `ESBuildMinifyPlugin` by enabling the `css` option.

Assuming the CSS is extracted using something like [MiniCssExtractPlugin](https://github.com/webpack-contrib/mini-css-extract-plugin), in `webpack.config.js`:

```diff
  const { ESBuildMinifyPlugin } = require('esbuild-loader')
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');

  module.exports = {
    ...,

    optimization: {
      minimizer: [
        new ESBuildMinifyPlugin({
          target: 'es2015',
+         css: true  // Apply minification to CSS assets
        })
      ]
    },

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        }
      ]
    },

    plugins: [
      new MiniCssExtractPlugin()
    ]
  }
```


#### CSS in JS

If your CSS is not emitted as a CSS file, but rather loaded via JS using something like [`style-loader`](https://github.com/webpack-contrib/style-loader), you can use the loader for minification.


In `webpack.config.js`:

```diff
  module.exports = {
    ...,

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            'style-loader',
            'css-loader',
+           {
+             loader: 'esbuild-loader',
+             options: {
+               loader: 'css',
+               minify: true
+             }
+           }
          ]
        }
      ]
    }
  }
```

### Examples
If you'd like to see working Webpack builds that use esbuild-loader for basic JS, React, TypeScript, or Next.js, check out the [examples repo](https://github.com/privatenumber/esbuild-loader-examples).

### Bring your own esbuild (Advanced)

esbuild-loader comes with a version of esbuild it has been tested to work with. However, [esbuild has a frequent release cadence](https://github.com/evanw/esbuild/releases), and while we try to keep up with the important releases, it can easily go out of date.

Use the `implementation` option in the loader or the minify plugin to pass in your own version of esbuild (eg. a newer one).

⚠️ esbuild is not stable yet and can have dramatic differences across releases. Using a different version of esbuild is not guaranteed to work.


```diff
+ const esbuild = require('esbuild')

  ...

  module.exports = {
    ...,

    module: {
      rules: [
        {
          test: ...,
          loader: 'esbuild-loader',
          options: {
            ...,
+           implementation: esbuild
          }
        }
      ]
    }
  }
```

_The `implementation` option will be removed once esbuild reaches a stable release. Instead esbuild will become a peerDependency so you always provide your own._


## ⚙️ Options

### Loader
The loader supports [all Transform options from esbuild](https://github.com/evanw/esbuild/blob/88821b7e7d46737f633120f91c65f662eace0bcf/lib/shared/types.ts#L158-L172).

Note:
- Source-maps are automatically configured for you via [`devtool`](https://webpack.js.org/configuration/devtool/).  `sourcemap`/`sourcefile` options are ignored.
- The root `tsconfig.json` is automatically detected for you. You don't need to pass in [`tsconfigRaw`](https://esbuild.github.io/api/#tsconfig-raw) unless it's in a different path.


Here are some common configurations and custom options:

#### target
Type: `string | Array<string>`

Default: `'es2015'`

The target environment (e.g. `es2016`, `chrome80`, `esnext`).

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#target).

#### loader
Type: `'js' | 'jsx' | 'ts' | 'tsx' | 'css' | 'json' | 'text' | 'base64' | 'file' | 'dataurl' | 'binary' | 'default'`

Default: `'js'`

The loader to use to handle the file. See the type for [possible values](https://github.com/evanw/esbuild/blob/88821b7e7d46737f633120f91c65f662eace0bcf/lib/shared/types.ts#L3).


Read more about it in the [esbuild docs](https://esbuild.github.io/api/#loader).

#### jsxFactory
Type: `string`

Default: `React.createElement`

Customize the JSX factory function name to use.

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#jsx-factory).

#### jsxFragment
Type: `string`

Default: `React.Fragment`

Customize the JSX fragment function name to use.


Read more about it in the [esbuild docs](https://esbuild.github.io/api/#jsx-fragment).

#### implementation
Type: `{ transform: Function }`

_Custom esbuild-loader option._

Use it to pass in a [different esbuild version](#bring-your-own-esbuild-advanced).

### MinifyPlugin

The loader supports [all Transform options from esbuild](https://github.com/evanw/esbuild/blob/88821b7e7d46737f633120f91c65f662eace0bcf/lib/shared/types.ts#L158-L172).

#### target
Type: `string | Array<string>`

Default: `'esnext'`

Target environment (e.g. `'es2016'`, `['chrome80', 'esnext']`)

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#target).

Here are some common configurations and custom options:

#### minify
Type: `boolean`

Default: `true`

Enable JS minification. Enables all `minify*` flags below.

To have nuanced control over minification, disable this and enable the specific minification you want below.

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#minify).

#### minifyWhitespace
Type: `boolean`

Minify JS by removing whitespace.

#### minifyIdentifiers
Type: `boolean`

Minify JS by shortening identifiers.

#### minifySyntax
Type: `boolean`

Minify JS using equivalent but shorter syntax.

#### legalComments
Type: `'none' | 'inline' | 'eof'`

Default: `'inline'`

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#legal-comments).

#### sourcemap
Type: `boolean`

Default: Webpack `devtool` configuration

Whether to emit sourcemaps.

#### css
Type: `boolean`

Default: `false`

_Custom esbuild-loader option._

Whether to minify CSS files.

#### include
Type: `string | RegExp | Array<string | RegExp>`

_Custom esbuild-loader option._

Filter assets to include in minification

#### exclude
Type: `string | RegExp | Array<string | RegExp>`

_Custom esbuild-loader option._

Filter assets to exclude from minification

#### implementation
Type: `{ transform: Function }`

_Custom esbuild-loader option._

Use it to pass in a [different esbuild version](#bring-your-own-esbuild-advanced).

## 🙋‍♀️ FAQ

### Is it possible to use esbuild plugins?
No. esbuild plugins are [only available in the build API](https://esbuild.github.io/plugins/#:~:text=plugins%20can%20also%20only%20be%20used%20with%20the%20build%20api%2C%20not%20with%20the%20transform%20api.). And esbuild-loader uses the transform API instead of the build API for two reasons:
1. The build API is for creating JS bundles, which is what Webpack does. If you want to use esbuild's build API, consider using esbuild directly instead of Webpack.

2. The build API reads directly from the file-system, but Webpack loaders operate in-memory. Webpack loaders are essentially just functions that are called with the source-code as the input. Not reading from the file-system allows loaders to be chainable. For example, using `vue-loader` to compile Single File Components (`.vue` files), then using `esbuild-loader` to transpile just the JS part of the SFC.

### Is it possible to use esbuild's [inject](https://esbuild.github.io/api/#inject) option?

No. The `inject` option is only available in the build API. And esbuild-loader uses the transform API.

However, you can use the Webpack equivalent [ProvidePlugin](https://webpack.js.org/plugins/provide-plugin/) instead.

If you're using React, check out [this example](https://github.com/privatenumber/esbuild-loader-examples/blob/52ca91b8cb2080de5fc63cc6e9371abfefe1f823/examples/react/webpack.config.js#L39-L41) on how to auto-import React in your components.

### Is it possible to use Babel plugins?
No. If you really need them, consider porting them over to a Webpack loader.

And please don't chain `babel-loader` and `esbuild-loader`. The speed gains come from replacing `babel-loader`.

### Why am I not getting a [100x speed improvement](https://esbuild.github.io/faq/#benchmark-details) as advertised?
Running esbuild as a standalone bundler vs esbuild-loader + Webpack are completely different:
- esbuild is highly optimized, written in Go, and compiled to native code. Read more about it [here](https://esbuild.github.io/faq/#why-is-esbuild-fast).
- esbuild-loader is handled by Webpack in a JS runtime, which applies esbuild transforms per file. On top of that, there's likely other loaders & plugins in a Webpack config that slow it down.

Using any JS bundler introduces a bottleneck that makes reaching those speeds impossible. However, esbuild-loader can still speed up your build by removing the bottlenecks created by [`babel-loader`](https://twitter.com/wSokra/status/1316274855042584577?s=20), `ts-loader`, Terser, etc.

### Will there be type-checking support?
According to the [esbuild FAQ](https://esbuild.github.io/faq/#:~:text=typescript%20type%20checking%20(just%20run%20tsc%20separately)), it will not be supported.

Consider these type-checking alternatives:
- Using an IDEs like [VSCode](https://code.visualstudio.com/docs/languages/typescript) or [WebStorm](https://www.jetbrains.com/help/webstorm/typescript-support.html) that has live type-checking built in
- Running `tsc --noEmit` to type check
- Integrating type-checking to your Webpack build as a separate process using [`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin)

## 🌱 Other Webpack plugins

#### [instant-mocha](https://github.com/privatenumber/instant-mocha)
Webpack-integrated Mocha test-runner with Webpack 5 support.


#### [webpack-localize-assets-plugin](https://github.com/privatenumber/webpack-localize-assets-plugin)
Localize/i18nalize your Webpack build. Optimized for multiple locales!
