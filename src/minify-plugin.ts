import { transform as defaultEsbuildTransform } from 'esbuild';
import {
	RawSource as WP4RawSource,
	SourceMapSource as WP4SourceMapSource,
} from 'webpack-sources';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import { matchObject } from 'webpack/lib/ModuleFilenameHelpers.js';
import type { MinifyPluginOptions } from './types';

type Compiler = webpack4.Compiler | webpack5.Compiler;
type Compilation = webpack4.compilation.Compilation | webpack5.Compilation;
type Asset = webpack4.compilation.Asset | Readonly<webpack5.Asset>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

const isJsFile = /\.[cm]?js(?:\?.*)?$/i;
const isCssFile = /\.css(?:\?.*)?$/i;
const pluginName = 'esbuild-minify';

const granularMinifyConfigs = ['minifyIdentifiers', 'minifySyntax', 'minifyWhitespace'] as const;
class ESBuildMinifyPlugin {
	private readonly options: MinifyPluginOptions;

	private readonly transform: typeof defaultEsbuildTransform;

	constructor(options: MinifyPluginOptions = {}) {
		const { implementation, ...remainingOptions } = options;
		if (implementation && typeof implementation.transform !== 'function') {
			throw new TypeError(
				`ESBuildMinifyPlugin: implementation.transform must be an ESBuild transform function. Received ${typeof implementation.transform}`,
			);
		}

		this.transform = implementation?.transform ?? defaultEsbuildTransform;

		this.options = remainingOptions;

		const hasGranularMinificationConfig = granularMinifyConfigs.some(
			minifyConfig => minifyConfig in options,
		);

		if (!hasGranularMinificationConfig) {
			this.options.minify = true;
		}
	}

	apply(compiler: Compiler): void {
		const meta = JSON.stringify({
			name: 'esbuild-loader',
			version,
			options: this.options,
		});

		compiler.hooks.compilation.tap(pluginName, (compilation) => {
			compilation.hooks.chunkHash.tap(pluginName, (_, hash) => hash.update(meta));

			if ('processAssets' in compilation.hooks) {
				compilation.hooks.processAssets.tapPromise(
					{
						name: pluginName,
						// @ts-expect-error undefined on Function type
						stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
						additionalAssets: true,
					},
					async () => await this.transformAssets(compilation),
				);

				compilation.hooks.statsPrinter.tap(pluginName, (statsPrinter) => {
					statsPrinter.hooks.print
						.for('asset.info.minimized')
						.tap(
							pluginName,
							(minimized, { green, formatFlag }) => 
								// @ts-expect-error type incorrectly doesn't accept undefined
								(
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
					async () => await this.transformAssets(compilation),
				);
			}
		});
	}

	private async transformAssets(
		compilation: Compilation,
	): Promise<void> {
		const { compiler } = compilation;
		const { options: { devtool } } = compiler;

		const sources = 'webpack' in compiler && compiler.webpack.sources;
		const SourceMapSource = (sources ? sources.SourceMapSource : WP4SourceMapSource);
		const RawSource = (sources ? sources.RawSource : WP4RawSource);

		const sourcemap = (
			// TODO: drop support for esbuild sourcemap in future so it all goes through WP API
			// Might still be necessary when SourceMap plugin is used
			this.options.sourcemap === undefined
				? Boolean(devtool && (devtool as string).includes('source-map'))
				: this.options.sourcemap
		);

		const {
			css: minifyCss,
			include,
			exclude,
			...transformOptions
		} = this.options;

		const assets = (compilation.getAssets() as Asset[]).filter((asset) => (

			// Filter out already minimized
			!asset.info.minimized

			// Filter out by file type
			&& (
				isJsFile.test(asset.name)
				|| (minifyCss && isCssFile.test(asset.name))
			)
			&& matchObject({ include, exclude }, asset.name)
		));

		await Promise.all(assets.map(async (asset) => {
			const assetIsCss = isCssFile.test(asset.name);
			let source: string | Buffer | ArrayBuffer;
			let map = null;

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

			const sourceAsString = source.toString();
			const result = await this.transform(sourceAsString, {
				...transformOptions,
				loader: (
					assetIsCss
						? 'css'
						: transformOptions.loader
				),
				sourcemap,
				sourcefile: asset.name,
			});

			if (result.legalComments) {
				compilation.emitAsset(
					`${asset.name}.LEGAL.txt`,
					new RawSource(result.legalComments) as any,
				);
			}

			compilation.updateAsset(
				asset.name,
				(
					sourcemap
						? new SourceMapSource(
							result.code,
							asset.name,
							result.map as any,
							sourceAsString,
							map as any,
							true,
						)
						: new RawSource(result.code)
				) as any,
				{
					...asset.info,
					minimized: true,
				},
			);
		}));
	}
}

export default ESBuildMinifyPlugin;
