import fs from 'fs';
import path from 'path';
import { transform as defaultEsbuildTransform } from 'esbuild';
import { getOptions } from 'loader-utils';
import webpack from 'webpack';
import JoyCon, { LoadResult } from 'joycon';
import JSON5 from 'json5';
import type { LoaderOptions } from './types';

const joycon = new JoyCon();

joycon.addLoader({
	test: /\.json$/,
	async load(filePath) {
		try {
			const config = fs.readFileSync(filePath, 'utf8');
			return JSON5.parse(config);
		} catch (error: any) {
			throw new Error(
				`Failed to parse tsconfig at ${path.relative(process.cwd(), filePath)}: ${error.message as string}`,
			);
		}
	},
});

let tsConfig: LoadResult;

async function ESBuildLoader(
	this: webpack.loader.LoaderContext,
	source: string,
): Promise<void> {
	const done = this.async()!;
	const options: LoaderOptions = getOptions(this);
	const {
		implementation,
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
		if (!tsConfig) {
			tsConfig = await joycon.load(['tsconfig.json']);
		}

		if (tsConfig.data) {
			transformOptions.tsconfigRaw = tsConfig.data;
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
