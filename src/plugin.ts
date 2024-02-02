import { transform as defaultEsbuildTransform } from 'esbuild';
import {
	RawSource as WP4RawSource,
	SourceMapSource as WP4SourceMapSource,
} from 'webpack-sources';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import ModuleFilenameHelpers from 'webpack/lib/ModuleFilenameHelpers.js';
import { version } from '../package.json';
import type { EsbuildPluginOptions } from './types.js';

type Compiler = webpack4.Compiler | webpack5.Compiler;
type Compilation = webpack4.compilation.Compilation | webpack5.Compilation;
type Asset = webpack4.compilation.Asset | Readonly<webpack5.Asset>;
type EsbuildTransform = typeof defaultEsbuildTransform;

const isJsFile = /\.[cm]?js(?:\?.*)?$/i;
const isCssFile = /\.css(?:\?.*)?$/i;
const pluginName = 'EsbuildPlugin';

const transformAssets = async (
	options: EsbuildPluginOptions,
	transform: EsbuildTransform,
	compilation: Compilation,
	useSourceMap: boolean,
) => {
	const { compiler } = compilation;
	const sources = 'webpack' in compiler && compiler.webpack.sources;
	const SourceMapSource = (sources ? sources.SourceMapSource : WP4SourceMapSource);
	const RawSource = (sources ? sources.RawSource : WP4RawSource);

	const {
		css: minifyCss,
		include,
		exclude,
		implementation,
		...transformOptions
	} = options;

	const minimized = (
		transformOptions.minify
		|| transformOptions.minifyWhitespace
		|| transformOptions.minifyIdentifiers
		|| transformOptions.minifySyntax
	);

	const assets = (compilation.getAssets() as Asset[]).filter(asset => (

		// Filter out already minimized
		!asset.info.minimized

		// Filter out by file type
		&& (
			isJsFile.test(asset.name)
			|| (minifyCss && isCssFile.test(asset.name))
		)
		&& ModuleFilenameHelpers.matchObject(
			{
				include,
				exclude,
			},
			asset.name,
		)
	));

	await Promise.all(assets.map(async (asset) => {
		const assetIsCss = isCssFile.test(asset.name);
		let source: string | Buffer | ArrayBuffer;
		let map = null;
		if (useSourceMap) {
			if (asset.source.sourceAndMap) {
				const sourceAndMap = asset.source.sourceAndMap();
				source = sourceAndMap.source;
				map = sourceAndMap.map;
			} else {
				source = asset.source.source();
				if (asset.source.map) {
					map = asset.source.map();
				}
			}
		} else {
			source = asset.source.source();
		}
		const sourceAsString = source.toString();
		const result = await transform(sourceAsString, {
			...transformOptions,
			loader: (
				assetIsCss
					? 'css'
					: transformOptions.loader
			),
			sourcemap: useSourceMap,
			sourcefile: asset.name,
		});

		if (result.legalComments) {
			compilation.emitAsset(
				`${asset.name}.LEGAL.txt`,
				new RawSource(result.legalComments) as webpack5.sources.Source,
			);
		}

		compilation.updateAsset(
			asset.name,
			// @ts-expect-error complex webpack union type for source
			(
				result.map
					? new SourceMapSource(
						result.code,
						asset.name,
						// @ts-expect-error it accepts strings
						result.map,
						sourceAsString,
						map,
						true,
					)
					: new RawSource(result.code)
			),
			{
				...asset.info,
				minimized,
			},
		);
	}));
};

export default class EsbuildPlugin {
	options: EsbuildPluginOptions;

	constructor(
		options: EsbuildPluginOptions = {},
	) {
		const { implementation } = options;
		if (
			implementation
			&& typeof implementation.transform !== 'function'
		) {
			throw new TypeError(
				`[${pluginName}] implementation.transform must be an esbuild transform function. Received ${typeof implementation.transform}`,
			);
		}

		this.options = options;
	}

	apply(compiler: Compiler) {
		const {
			implementation,
			...options
		} = this.options;
		const transform = implementation?.transform ?? defaultEsbuildTransform;

		if (!('format' in options)) {
			const { target } = compiler.options;
			const isWebTarget = (
				Array.isArray(target)
					? target.includes('web')
					: target === 'web'
			);
			const wontGenerateHelpers = !options.target || (
				Array.isArray(options.target)
					? (
						options.target.length === 1
						&& options.target[0] === 'esnext'
					)
					: options.target === 'esnext'
			);

			if (isWebTarget && !wontGenerateHelpers) {
				options.format = 'iife';
			}
		}

		/**
		 * Enable minification by default if used in the minimizer array
		 * unless further specified in the options
		 */
		const usedAsMinimizer = compiler.options.optimization?.minimizer?.includes?.(this);
		if (
			usedAsMinimizer
			&& !(
				'minify' in options
				|| 'minifyWhitespace' in options
				|| 'minifyIdentifiers' in options
				|| 'minifySyntax' in options
			)
		) {
			options.minify = compiler.options.optimization?.minimize;
		}

		compiler.hooks.compilation.tap(pluginName, (compilation) => {
			const meta = JSON.stringify({
				name: 'esbuild-loader',
				version,
				options,
			});

			compilation.hooks.chunkHash.tap(
				pluginName,
				(_, hash) => hash.update(meta),
			);

			/**
			 * Check if sourcemaps are enabled
			 * Webpack 4: https://github.com/webpack/webpack/blob/v4.46.0/lib/SourceMapDevToolModuleOptionsPlugin.js#L20
			 * Webpack 5: https://github.com/webpack/webpack/blob/v5.75.0/lib/SourceMapDevToolModuleOptionsPlugin.js#LL27
			 */
			let useSourceMap = false;

			/**
			 * `finishModules` hook is called after all the `buildModule` hooks are called,
			 * which is where the `useSourceMap` flag is set
			 * https://webpack.js.org/api/compilation-hooks/#finishmodules
			 */
			compilation.hooks.finishModules.tap(
				pluginName,
				(modules) => {
					const firstModule = (
						Array.isArray(modules)
							? modules[0]
							: (modules as Set<webpack5.Module>).values().next().value as webpack5.Module
					);
					if (firstModule) {
						useSourceMap = firstModule.useSourceMap;
					}
				},
			);

			// Webpack 5
			if ('processAssets' in compilation.hooks) {
				compilation.hooks.processAssets.tapPromise(
					{
						name: pluginName,
						// @ts-expect-error undefined on Function type
						stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
						additionalAssets: true,
					},
					() => transformAssets(options, transform, compilation, useSourceMap),
				);

				compilation.hooks.statsPrinter.tap(pluginName, (statsPrinter) => {
					statsPrinter.hooks.print
						.for('asset.info.minimized')
						.tap(
							pluginName,
							(
								minimized,
								{ green, formatFlag },
							// @ts-expect-error type incorrectly doesn't accept undefined
							) => (
								minimized
									// @ts-expect-error type incorrectly doesn't accept undefined
									? green(formatFlag('minimized'))
									: undefined
							),
						);
				});
			} else {
				compilation.hooks.optimizeChunkAssets.tapPromise(
					pluginName,
					() => transformAssets(options, transform, compilation, useSourceMap),
				);
			}
		});
	}
}
