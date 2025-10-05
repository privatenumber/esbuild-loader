import path from 'path';
import {
	transform as defaultEsbuildTransform,
	type TransformOptions,
} from 'esbuild';
import { getOptions } from 'loader-utils';
import type webpack from 'webpack';
import {
	getTsconfig,
	parseTsconfig,
	type TsConfigResult,
} from 'get-tsconfig';
import type { LoaderOptions } from './types.js';

const tsconfigCache = new Map<string, TsConfigResult>();

const tsExtensionsPattern = /\.(?:[cm]?ts|[tj]sx)$/;

async function ESBuildLoader(
	this: webpack.loader.LoaderContext<LoaderOptions>,
	source: string,
): Promise<void> {
	const done = this.async()!;
	const options: LoaderOptions = typeof this.getOptions === 'function' ? this.getOptions() : getOptions(this);
	const {
		implementation,
		tsconfig: tsconfigPath,
		...esbuildTransformOptions
	} = options;

	if (implementation && typeof implementation.transform !== 'function') {
		done(
			new TypeError(
				`esbuild-loader: options.implementation.transform must be an ESBuild transform function. Received ${typeof implementation.transform}`,
			),
		);
		return;
	}
	const transform = implementation?.transform ?? defaultEsbuildTransform;

	const { resourcePath } = this;
	const transformOptions = {
		...esbuildTransformOptions,
		target: options.target ?? 'es2015',
		loader: options.loader ?? 'default',
		sourcemap: this.sourceMap,
		sourcefile: resourcePath,
	};

	const isDependency = resourcePath.includes(`${path.sep}node_modules${path.sep}`);
	if (
		!('tsconfigRaw' in transformOptions)

		// If file is local project, always try to apply tsconfig.json (e.g. allowJs)
		// If file is dependency, only apply tsconfig.json if .ts
		&& (!isDependency || tsExtensionsPattern.test(resourcePath))
	) {
		/**
		 * If a tsconfig.json path is specified, force apply it
		 * Same way a provided tsconfigRaw is applied regardless
		 * of whether it actually matches
		 *
		 * This follows TypeScript behavior: a tsconfig applies to all
		 * files imported by entry files, not just files matching include patterns.
		 * The include/files patterns only determine entry points.
		 */
		if (!isDependency && tsconfigPath) {
			const tsconfigFullPath = path.resolve(tsconfigPath);
			const cacheKey = `esbuild-loader:${tsconfigFullPath}`;
			let tsconfig = tsconfigCache.get(cacheKey);
			if (!tsconfig) {
				tsconfig = {
					config: parseTsconfig(tsconfigFullPath),
					path: tsconfigFullPath,
				};
				tsconfigCache.set(cacheKey, tsconfig);
			}

			transformOptions.tsconfigRaw = tsconfig.config as TransformOptions['tsconfigRaw'];
		} else {
			/* Detect tsconfig file */

			let tsconfig;

			try {
				// Webpack shouldn't be loading the same path multiple times so doesn't need to be cached
				tsconfig = getTsconfig(resourcePath, 'tsconfig.json');
			} catch (error) {
				if (error instanceof Error) {
					const tsconfigError = new Error(`[esbuild-loader] Error parsing tsconfig.json:\n${error.message}`);
					if (isDependency) {
						this.emitWarning(tsconfigError);
					} else {
						return done(tsconfigError);
					}
				}
			}

			if (tsconfig) {
				transformOptions.tsconfigRaw = tsconfig.config as TransformOptions['tsconfigRaw'];
			}
		}
	}

	/**
	 * Enable dynamic import by default to support code splitting in Webpack
	 */
	transformOptions.supported = {
		'dynamic-import': true,
		...transformOptions.supported,
	};

	try {
		const { code, map } = await transform(source, transformOptions);
		done(null, code, map && JSON.parse(map));
	} catch (error: unknown) {
		done(error as Error);
	}
}

export default ESBuildLoader;
