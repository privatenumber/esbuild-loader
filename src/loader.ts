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
	type TsConfigResult,
	type FileMatcher,
} from 'get-tsconfig';
import type { LoaderOptions } from './types.js';

let foundTsconfig: TsConfigResult | null;
let fileMatcher: FileMatcher;

async function ESBuildLoader(
	this: webpack.loader.LoaderContext,
	source: string,
): Promise<void> {
	const done = this.async()!;
	const options: LoaderOptions = getOptions(this);
	const {
		implementation,
		tsconfig,
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
		if (!fileMatcher) {
			const tsconfigPath = tsconfig && path.resolve(tsconfig);
			foundTsconfig = (
				tsconfigPath
					? {
						config: parseTsconfig(tsconfigPath),
						path: tsconfigPath,
					}
					: getTsconfig()
			);
			if (foundTsconfig) {
				fileMatcher = createFilesMatcher(foundTsconfig);
			}
		}

		if (fileMatcher) {
			transformOptions.tsconfigRaw = fileMatcher(
				// Doesn't include query
				this.resourcePath,
			) as TransformOptions['tsconfigRaw'];
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
