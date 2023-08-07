import path from 'path';
import {
	transform as defaultEsbuildTransform,
	type TransformOptions,
} from 'esbuild';
import { getOptions } from 'loader-utils';
import webpack from 'webpack';
import {
	getTsconfig,
	parseTsconfig,
	createFilesMatcher,
} from 'get-tsconfig';
import type { LoaderOptions } from './types.js';

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

	const transformOptions = {
		...esbuildTransformOptions,
		target: options.target ?? 'es2015',
		loader: options.loader ?? 'default',
		sourcemap: this.sourceMap,
		sourcefile: this.resourcePath,
	};

	if (!('tsconfigRaw' in transformOptions)) {
		const { resourcePath } = this;
		/**
		 * If a tsconfig.json path is specified, force apply it
		 * Same way a provided tsconfigRaw is applied regardless
		 * of whether it actually matches
		 *
		 * However in this case, we also warn if it doesn't match
		 */
		if (tsconfigPath) {
			const tsconfigFullPath = path.resolve(tsconfigPath);
			const tsconfig = {
				config: parseTsconfig(tsconfigFullPath),
				path: tsconfigFullPath,
			};

			const filesMatcher = createFilesMatcher(tsconfig);
			const matches = filesMatcher(resourcePath);

			if (!matches) {
				this.emitWarning(
					new Error(`[esbuild-loader] The specified tsconfig at "${tsconfigFullPath}" was applied to the file "${resourcePath}" but does not match its "include" patterns`),
				);
			}

			transformOptions.tsconfigRaw = tsconfig.config as TransformOptions['tsconfigRaw'];
		} else {
			// Detect tsconfig file
			const foundTsconfig = getTsconfig(resourcePath);
			if (foundTsconfig) {
				const fileMatcher = createFilesMatcher(foundTsconfig);
				transformOptions.tsconfigRaw = fileMatcher(resourcePath) as TransformOptions['tsconfigRaw'];
			}
		}
	}

	try {
		const { code, map } = await transform(source, transformOptions);
		done(null, code, map && JSON.parse(map));
	} catch (error: unknown) {
		done(error as Error);
	}
}

export default ESBuildLoader;
