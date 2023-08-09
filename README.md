# esbuild-loader <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/v/esbuild-loader"></a> <a href="https://npm.im/esbuild-loader"><img src="https://badgen.net/npm/dm/esbuild-loader"></a> <a href="https://packagephobia.now.sh/result?p=esbuild-loader"><img src="https://packagephobia.now.sh/badge?p=esbuild-loader"></a>

Speed up your Webpack build with [esbuild](https://github.com/evanw/esbuild)! 🔥

[_esbuild_](https://github.com/evanw/esbuild) is a JavaScript bundler written in Go that supports blazing fast ESNext & TypeScript transpilation and [JS minification](https://github.com/privatenumber/minification-benchmarks/).

[_esbuild-loader_](https://github.com/esbuild-kit/esbuild-loader) lets you harness the speed of esbuild in your Webpack build by offering faster alternatives for transpilation (eg. `babel-loader`/`ts-loader`) and minification (eg. Terser)!

Curious how much faster your build will be? See [what users are saying](https://github.com/esbuild-kit/esbuild-loader/discussions/138).


> **💡 Protip: Enhance your Node.js DX with `tsx`**
>
> If you're interested in supercharging your Node.js runtime with esbuild, take a look at our new project [`tsx`](https://github.com/esbuild-kit/tsx). It's an esbuild-enhanced Node.js runtime that can run TypeScript instantly!

<br>

<p align="center">
	<a href="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=platinum">
		<picture>
			<source width="830" media="(prefers-color-scheme: dark)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=platinum&image=dark">
			<source width="830" media="(prefers-color-scheme: light)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=platinum&image">
			<img width="830" src="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=platinum&image" alt="Premium sponsor banner">
		</picture>
	</a>
</p>

## 🚀 Install

```bash
npm i -D esbuild-loader
```

## 🚦 Quick Setup

To leverage `esbuild-loader` in your Webpack configuration, add a new rule for `esbuild-loader` matching the files you want to transform, such as `.js`, `.jsx`, `.ts`, or `.tsx`. Make sure to remove any other loaders you were using before (e.g. `babel-loader`/`ts-loader`).

Here's an example of how to set it up in your `webpack.config.js`:

```diff
  module.exports = {
      module: {
          rules: [
-             // Transpile JavaScript
-             {
-                 test: /\.js$/,
-                 use: 'babel-loader'
-             },
-
-             // Compile TypeScript
-             {
-                 test: /\.tsx?$/,
-                 use: 'ts-loader'
-             },
+             // Use esbuild to compile JavaScript & TypeScript
+             {
+                 // Match `.js`, `.jsx`, `.ts` or `.tsx` files
+                 test: /\.[jt]sx?$/,
+                 loader: 'esbuild-loader',
+                 options: {
+                     // JavaScript version to compile to
+                     target: 'es2015'
+                 }
+             },

              // Other rules...
          ],
      },
  }
```

In this setup, esbuild will automatically determine how to handle each file based on its extension:
- `.js` files will be treated as JS (no JSX allowed)
- `.jsx` & `.tsx` files as JSX
- `.ts` as TS (no JSX allowed)
- `.tsx` as TSX


If you want to force a specific handler on different file extensions (e.g. to allow JSX in `.js` files), you can use the [`loader`](https://github.com/esbuild-kit/esbuild-loader/#loader) option:

```diff
 {
     test: /\.js$/,
     loader: 'esbuild-loader',
     options: {
+        // Treat `.js` files as `.jsx` files
+        loader: 'jsx',

         // JavaScript version to transpile to
         target: 'es2015'
     }
 }
```


## Loader

### JavaScript

You can replace `babel-loader` with `esbuild-loader` to transpile new JavaScript syntax into code compatible with older JavaScript engines.

While this ensures your code can run smoothly across various environments, note that it can bloat your output code (like Babel).

By default, the target to `esnext`, which means it doesn't perform any transpilations.

To specify a target JavaScript engine that only supports ES2015, use the following configuration in your `webpack.config.js`:

```diff
 {
     test: /\.jsx?$/,
     loader: 'esbuild-loader',
     options: {
+        target: 'es2015',
     },
 }
```

For a detailed list of supported transpilations and versions, refer to [the esbuild documentation](https://esbuild.github.io/content-types/#javascript).

### TypeScript

`esbuild-loader` can be used in-place of `ts-loader` to compile TypeScript.

```json5
{
    // `.ts` or `.tsx` files
    test: /\.tsx?$/,
    loader: 'esbuild-loader',
}
```

> Note: You cannot use the `tsx` loader for `*.ts` files as it has incompatible syntax with the `ts` loader.
>
> [→ Read more](https://esbuild.github.io/content-types/#ts-vs-tsx)

#### `tsconfig.json`
If you have a `tsconfig.json` file in your project, `esbuild-loader` will automatically load it.

If it's under a custom name, you can pass in the path via `tsconfig` option:
```diff
 {
     test: /\.tsx?$/,
     loader: 'esbuild-loader',
     options: {
+        tsconfig: './tsconfig.custom.json',
     },
 },
```

> Behind the scenes: [`get-tsconfig`](https://github.com/privatenumber/get-tsconfig) is used to load the tsconfig, and to also resolve the `extends` property if it exists.

You can also use the `tsconfigRaw` option to pass in a raw `tsconfig` object, but it will not resolve the `extends` property.


##### Caveats
- esbuild only supports a subset of `tsconfig` options [(see `TransformOptions` interface)](https://github.com/evanw/esbuild/blob/88821b7e7d46737f633120f91c65f662eace0bcf/lib/shared/types.ts#L159-L165).

- Enable [`isolatedModules`](https://www.typescriptlang.org/tsconfig#isolatedModules) to avoid mis-compilation with features like re-exporting types.

- Enable [`esModuleInterop`](https://www.typescriptlang.org/tsconfig/#esModuleInterop) to make TypeScript's type system compatible with ESM imports.

- Features that require type interpretation, such as `emitDecoratorMetadata` and declaration, are not supported.

[→ Read more about TypeScript Caveats](https://esbuild.github.io/content-types/#typescript-caveats)

#### `tsconfig.json` Paths
Use [tsconfig-paths-webpack-plugin](https://github.com/dividab/tsconfig-paths-webpack-plugin) to add support for [`tsconfig.json#paths`](https://www.typescriptlang.org/tsconfig/paths.html).

Since `esbuild-loader` only transforms code, it cannot aid Webpack with resolving paths.


#### Type-checking

esbuild **does not** type check your code. And according to the [esbuild FAQ](https://esbuild.github.io/faq/#:~:text=typescript%20type%20checking%20(just%20run%20tsc%20separately)), it will not be supported.

Consider these type-checking alternatives:
- Using an IDEs like [VSCode](https://code.visualstudio.com/docs/languages/typescript) or [WebStorm](https://www.jetbrains.com/help/webstorm/typescript-support.html) that has live type-checking built in
- Running `tsc --noEmit` to type check
- Integrating type-checking to your Webpack build as a separate process using [`fork-ts-checker-webpack-plugin`](https://github.com/TypeStrong/fork-ts-checker-webpack-plugin)

## EsbuildPlugin

### Minification
You can replace JS minifiers like Terser or UglifyJs. Checkout the [benchmarks](https://github.com/privatenumber/minification-benchmarks) to see how much faster esbuild is. The `target` option tells esbuild that it can use newer JS syntax to perform better minification.

In `webpack.config.js`:

```diff
+ const { EsbuildPlugin } = require('esbuild-loader')

  module.exports = {
      ...,

+     optimization: {
+         minimizer: [
+             new EsbuildPlugin({
+                 target: 'es2015'  // Syntax to transpile to (see options below for possible values)
+             })
+         ]
+     },
  }
```

### Defining constants

You can replace the [`DefinePlugin`](https://webpack.js.org/plugins/define-plugin/) to define global constants. The parsing cost of the DefinePlugin is often overlooked so replacing it with esbuild can speed up the build.

In `webpack.config.js`:

```diff
- const { DefinePlugin } = require('webpack')
+ const { EsbuildPlugin } = require('esbuild-loader')

  module.exports = {
      // ...,

      plugins:[
-         new DefinePlugin({
-             'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
-         })
+         new EsbuildPlugin({
+             options: {
+                 define: {
+                     'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
+                 },
+             },
+         }),
      ]
  }
```

### Transpilation

If you're not using TypeScript, JSX, or any syntax unsupported by Webpack, you can also leverage the minifier for transpilation (as an alternative to Babel).

It will be faster because there's less files to work on and will produce a smaller output because the polyfills will only be bundled once for the entire build instead of per file.

Simply set the `target` option on the minifier to specify which support level you want.



## CSS Minification

Depending on your setup, there are two ways to minify CSS. You should already have CSS loading setup using [`css-loader`](https://github.com/webpack-contrib/css-loader).

### CSS assets
If the CSS is extracted and emitted as `.css` file, you can replace CSS minification plugins like [`css-minimizer-webpack-plugin`](https://github.com/webpack-contrib/css-minimizer-webpack-plugin) with the `EsbuildPlugin`.

Assuming the CSS is extracted using something like [MiniCssExtractPlugin](https://github.com/webpack-contrib/mini-css-extract-plugin), in `webpack.config.js`:

```diff
  const { EsbuildPlugin } = require('esbuild-loader')
  const MiniCssExtractPlugin = require('mini-css-extract-plugin');

  module.exports = {
      // ...,

      optimization: {
          minimizer: [
              new EsbuildPlugin({
                  target: 'es2015',
+                 css: true  // Apply minification to CSS assets
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
          ],
      },

      plugins: [
          new MiniCssExtractPlugin()
      ]
  }
```


### CSS in JS

If your CSS is not emitted as a `.css` file, but rather inserted from the JavaScript using something like [`style-loader`](https://github.com/webpack-contrib/style-loader), you can use the loader for minification.


In `webpack.config.js`:

```diff
  module.exports = {
      // ...,

      module: {
          rules: [
              {
                  test: /\.css$/i,
                  use: [
                      'style-loader',
                      'css-loader',
+                     {
+                         loader: 'esbuild-loader',
+                         options: {
+                             minify: true,
+                         },
+                     },
                  ],
              },
          ],
      },
  }
```

## Bring your own esbuild (Advanced)

esbuild-loader comes with a version of esbuild it has been tested to work with. However, [esbuild has a frequent release cadence](https://github.com/evanw/esbuild/releases), and while we try to keep up with the important releases, it can get outdated.

To work around this, you can use the `implementation` option in the loader or the plugin to pass in your own version of esbuild (eg. a newer one).

⚠️ esbuild is not stable yet and can have dramatic differences across releases. Using a different version of esbuild is not guaranteed to work.


```diff
+ const esbuild = require('esbuild')

  module.exports = {
      // ...,

      module: {
          rules: [
              {
                  test: ...,
                  loader: 'esbuild-loader',
                  options: {
                      // ...,
+                     implementation: esbuild,
                  },
              },
          ],
      },
  }
```

_The `implementation` option will be removed once esbuild reaches a stable release. Instead esbuild will become a peerDependency so you always provide your own._


## Setup examples
If you'd like to see working Webpack builds that use esbuild-loader for basic JS, React, TypeScript, Next.js, etc. check out the examples repo:

[→ esbuild-loader examples](https://github.com/esbuild-kit/esbuild-loader-examples)

<br>

<p align="center">
	<a href="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=gold">
		<picture>
			<source width="830" media="(prefers-color-scheme: dark)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=gold&image=dark">
			<source width="830" media="(prefers-color-scheme: light)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=gold&image">
			<img width="830" src="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=gold&image" alt="Premium sponsor banner">
		</picture>
	</a>
</p>

## ⚙️ Options

### Loader
The loader supports [all Transform options from esbuild](https://github.com/evanw/esbuild/blob/88821b7e7d46737f633120f91c65f662eace0bcf/lib/shared/types.ts#L158-L172).

Note:
- Source-maps are automatically configured for you via [`devtool`](https://webpack.js.org/configuration/devtool/).  `sourcemap`/`sourcefile` options are ignored.
- The root `tsconfig.json` is automatically detected for you. You don't need to pass in [`tsconfigRaw`](https://esbuild.github.io/api/#tsconfig-raw) unless it's in a different path.


Here are some common configurations and custom options:

#### tsconfig

Type: `string`

Pass in the file path to a **custom** tsconfig file. If the file name is `tsconfig.json`, it will automatically detect it.

#### target
Type: `string | Array<string>`

Default: `'es2015'`

The target environment (e.g. `es2016`, `chrome80`, `esnext`).

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#target).

#### loader
Type: `'js' | 'jsx' | 'ts' | 'tsx' | 'css' | 'json' | 'text' | 'base64' | 'file' | 'dataurl' | 'binary' | 'default'`

Default: `'default'`

The loader to use to handle the file. See the type for [possible values](https://github.com/evanw/esbuild/blob/88821b7e7d46737f633120f91c65f662eace0bcf/lib/shared/types.ts#L3).

By default, it automatically detects the loader based on the file extension.

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

### EsbuildPlugin

The loader supports [all Transform options from esbuild](https://github.com/evanw/esbuild/blob/88821b7e7d46737f633120f91c65f662eace0bcf/lib/shared/types.ts#L158-L172).

#### target
Type: `string | Array<string>`

Default: `'esnext'`

Target environment (e.g. `'es2016'`, `['chrome80', 'esnext']`)

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#target).

Here are some common configurations and custom options:

#### format
Type: `'iife' | 'cjs' | 'esm'`

Default:
  - `iife` if both of these conditions are met:
    - Webpack's [`target`](https://webpack.js.org/configuration/target/) is set to `web`
    - esbuild's [`target`](#target-1) is not `esnext`
  - `undefined` (no format conversion) otherwise

The default is `iife` when esbuild is configured to support a low target, because esbuild injects helper functions at the top of the code. On the web, having functions declared at the top of a script can pollute the global scope. In some cases, this can lead to a variable collision error. By setting `format: 'iife'`, esbuild wraps the helper functions in an [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE) to prevent them from polluting the global.

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#format).

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
Type: `'none' | 'inline' | 'eof' | 'external'`

Default: `'inline'`

Read more about it in the [esbuild docs](https://esbuild.github.io/api/#legal-comments).

#### css
Type: `boolean`

Default: `false`

Whether to minify CSS files.

#### include
Type: `string | RegExp | Array<string | RegExp>`

To only apply the plugin to certain assets, pass in filters include

#### exclude
Type: `string | RegExp | Array<string | RegExp>`

To prevent the plugin from applying to certain assets, pass in filters to exclude

#### implementation
Type: `{ transform: Function }`

Use it to pass in a [different esbuild version](#bring-your-own-esbuild-advanced).

## 🙋‍♀️ FAQ

### Is it possible to use esbuild plugins?
No. esbuild plugins are [only available in the build API](https://esbuild.github.io/plugins/#:~:text=plugins%20can%20also%20only%20be%20used%20with%20the%20build%20api%2C%20not%20with%20the%20transform%20api.). And esbuild-loader uses the transform API instead of the build API for two reasons:
1. The build API is for creating JS bundles, which is what Webpack does. If you want to use esbuild's build API, consider using esbuild directly instead of Webpack.

2. The build API reads directly from the file-system, but Webpack loaders operate in-memory. Webpack loaders are essentially just functions that are called with the source-code as the input. Not reading from the file-system allows loaders to be chainable. For example, using `vue-loader` to compile Single File Components (`.vue` files), then using `esbuild-loader` to transpile just the JS part of the SFC.

### Is it possible to use esbuild's [inject](https://esbuild.github.io/api/#inject) option?

No. The `inject` option is only available in the build API. And esbuild-loader uses the transform API.

However, you can use the Webpack equivalent [ProvidePlugin](https://webpack.js.org/plugins/provide-plugin/) instead.

If you're using React, check out [this example](https://github.com/esbuild-kit/esbuild-loader-examples/blob/52ca91b8cb2080de5fc63cc6e9371abfefe1f823/examples/react/webpack.config.js#L39-L41) on how to auto-import React in your components.

### Is it possible to use Babel plugins?
No. If you really need them, consider porting them over to a Webpack loader.

And please don't chain `babel-loader` and `esbuild-loader`. The speed gains come from replacing `babel-loader`.

### Why am I not getting a [100x speed improvement](https://esbuild.github.io/faq/#benchmark-details) as advertised?
Running esbuild as a standalone bundler vs esbuild-loader + Webpack are completely different:
- esbuild is highly optimized, written in Go, and compiled to native code. Read more about it [here](https://esbuild.github.io/faq/#why-is-esbuild-fast).
- esbuild-loader is handled by Webpack in a JS runtime, which applies esbuild transforms per file. On top of that, there's likely other loaders & plugins in a Webpack config that slow it down.

Using any JS bundler introduces a bottleneck that makes reaching those speeds impossible. However, esbuild-loader can still speed up your build by removing the bottlenecks created by [`babel-loader`](https://twitter.com/wSokra/status/1316274855042584577?s=20), `ts-loader`, Terser, etc.


## 💞 Related

#### [tsx](https://github.com/esbuild-kit/tsx)
Node.js enhanced with esbuild to run TypeScript and ESM.

#### [instant-mocha](https://github.com/privatenumber/instant-mocha)
Webpack-integrated Mocha test-runner with Webpack 5 support.

#### [webpack-localize-assets-plugin](https://github.com/privatenumber/webpack-localize-assets-plugin)
Localize/i18nalize your Webpack build. Optimized for multiple locales!

## Sponsors

<p align="center">
	<a href="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver1">
		<picture>
			<source width="410" media="(prefers-color-scheme: dark)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver1&image=dark">
			<source width="410" media="(prefers-color-scheme: light)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver1&image">
			<img width="410" src="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver1&image" alt="Premium sponsor banner">
		</picture>
	</a>
	<a href="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver2">
		<picture>
			<source width="410" media="(prefers-color-scheme: dark)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver2&image=dark">
			<source width="410" media="(prefers-color-scheme: light)" srcset="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver2&image">
			<img width="410" src="https://privatenumber-sponsors.vercel.app/api/sponsor?tier=silver2&image" alt="Premium sponsor banner">
		</picture>
	</a>
</p>


<p align="center">
	<a href="https://github.com/sponsors/privatenumber">
		<img src="https://cdn.jsdelivr.net/gh/privatenumber/sponsors/sponsorkit/sponsors.svg">
	</a>
</p>

