import { transform as defaultEsbuildTransform } from 'esbuild';
import { RawSource, SourceMapSource } from 'webpack-sources';
import webpack from 'webpack';
import type {
	SyncHook, SyncBailHook, AsyncSeriesHook, HookMap,
} from 'tapable';
import type { Source } from 'webpack-sources';
import { matchObject } from 'webpack/lib/ModuleFilenameHelpers.js';
import { MinifyPluginOptions } from './interfaces';

type StatsPrinter = {
	hooks: {
		print: HookMap<SyncBailHook<any, string>>;
	};
};

type Compilation = webpack.compilation.Compilation;

type Wp5Compilation = Compilation & {
	hooks: Compilation['hooks'] & {
		processAssets: AsyncSeriesHook<Record<string, Source>>;
		statsPrinter: SyncHook<StatsPrinter>;
	};
	constructor: {
		PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE: 400;
	};
};

const isWebpack5 = (compilation: Compilation): compilation is Wp5Compilation => ('processAssets' in compilation.hooks);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

const isJsFile = /\.[cm]?js(\?.*)?$/i;
const isCssFile = /\.css(\?.*)?$/i;
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

	apply(compiler: webpack.Compiler): void {
		const meta = JSON.stringify({
			name: 'esbuild-loader',
			version,
			options: this.options,
		});

		compiler.hooks.compilation.tap(pluginName, (compilation) => {
			compilation.hooks.chunkHash.tap(pluginName, (_, hash) => hash.update(meta));

			if (isWebpack5(compilation)) {
				compilation.hooks.processAssets.tapPromise(
					{
						name: pluginName,
						stage: compilation.constructor.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
						// @ts-expect-error TODO: modify type
						additionalAssets: true,
					},
					async () => await this.transformAssets(compilation),
				);

				compilation.hooks.statsPrinter.tap(pluginName, (statsPrinter) => {
					statsPrinter.hooks.print
						.for('asset.info.minimized')
						.tap(
							pluginName,
							(minimized, { green, formatFlag }) => (
								minimized
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
		const { options: { devtool } } = compilation.compiler;

		const sourcemap = (
			// TODO: drop support for esbuild sourcemap in future so it all goes through WP API
			// Might still be necessary when SourceMap plugin is used
			this.options.sourcemap === undefined
				? devtool && (devtool as string).includes('source-map')
				: this.options.sourcemap
		);

		const {
			css: minifyCss,
			include,
			exclude,
			...transformOptions
		} = this.options;

		const assets = compilation.getAssets().filter(asset => (

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
			const { source, map } = asset.source.sourceAndMap();
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

			compilation.updateAsset(
				asset.name,
				(
					sourcemap
						? new SourceMapSource(
							result.code,
							asset.name,
							result.map as any,
							sourceAsString,
							map,
							true,
						)
						: new RawSource(result.code)
				),
				{
					...asset.info,
					minimized: true,
				},
			);
		}));
	}
}

export default ESBuildMinifyPlugin;
