import fs from 'fs';
import path from 'path';
import { transform as defaultEsbuildTransform } from 'esbuild';
import { getOptions } from 'loader-utils';
import webpack from 'webpack';
import JoyCon, { LoadResult } from 'joycon';
import JSON5 from 'json5';
import { LoaderOptions, TransformImports } from './interfaces';

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

const isTsExtensionPtrn = /\.ts$/i;
let tsConfig: LoadResult;

async function ESBuildLoader(
	this: webpack.loader.LoaderContext,
	source: string,
): Promise<void> {
	const done = this.async();
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
		loader: options.loader ?? 'js',
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

	// https://github.com/privatenumber/esbuild-loader/pull/107
	if (
		transformOptions.loader === 'tsx'
		&& isTsExtensionPtrn.test(this.resourcePath)
	) {
		transformOptions.loader = 'ts';
	}

	try {
		if (options.transformImports) {
			source = replaceTransformImports(source, options.transformImports);
		}
		const { code, map } = await transform(source, transformOptions);
		done(null, code, map && JSON.parse(map));
	} catch (error: unknown) {
		done(error as Error);
	}
}

function replaceTransformImports(source: string, config: TransformImports) {
	// Match import statement, e.g.
	//	 import { bindingA, bindingB } from 'module';
	//	 import moduleName, { bindingC, bindingD } from 'module';
	//	 import * as name from 'module';
	const regImport = /import(\s+(\w+|\*\s+as\s+\w+),?)?(\s*\{([^}]+)\})?\s+from\s+(['"])(.*)\5(;)?/g;

	return source.replace(regImport, (...args: string[]) => {
		const matches = args[0];
		const defaultName = args[2];
		const importedBindings = args[4];
		const quote = args[5];
		const importFrom = args[6];
		const lineEnd = args[7];

		const replacements: string[] = [];
		Object.keys(config).forEach((key: string) => {
			const configItem = config[key];
			const moduleMatches = new RegExp(key).exec(importFrom);

			if (!moduleMatches) {
				return;
			}

			// Throw full import error when preventFullImport is true, e.g.
			//	 import * as name from 'module';
			//	 import name from 'module';
			if (configItem.preventFullImport && defaultName) {
				throw new Error(
					`esbuild-loader: import of entire module ${importFrom} not allowed due to preventFullImport setting`,
				);
			}

			// Add defaultName import, e.g.
			// transform this:
			//	 import name, { bindingA } from 'module';
			// into this:
			//	 import name from 'module';
			if (defaultName) {
				replacements.push(
					`import ${defaultName} from ${quote}${importFrom}${quote}${
						lineEnd || ''
					}`,
				);
			}

			if (importedBindings) {
				// Add import bindings, e.g.
				// transform this:
				//	 import name, { bindingA } from 'module';
				//	 import { bindingB, xx as bindingC } from 'module';
				// into this:
				//	 import bindingA from 'module/lib/bindingA';
				//	 import bindingB from 'module/lib/bindingB';
				//	 import bindingC from 'module/lib/bindingC';
				importedBindings
					.split(',')
					.map((name: string) => name.trim())
					.filter(Boolean)
					.map((name: string) => (/as\s+/.test(name) ? name.split(/as\s+/) : [name]))
					.forEach(([importName, asName]) => {
						importName = importName.trim();
						asName = asName && asName.trim();
						const newFrom = typeof config[key].transform === 'string'
							? config[key].transform
							: config[key].transform(importName, moduleMatches);
						replacements.push(
							`import ${asName || importName} from ${quote}${newFrom}${quote}${
								lineEnd || ''
							}`,
						);
					});
			}
		});
		return replacements.length > 0 ? replacements.join('\n') : matches;
	});
}

export default ESBuildLoader;
