import path from 'path';
import fs from 'fs';
import {ufs} from 'unionfs';
import {Volume, DirectoryJSON} from 'memfs';
import {runInNewContext} from 'vm';
import {
	Configuration as Wp4Configuration,
	Stats,
} from 'webpack';
import {
	Configuration as Wp5Configuration,
	ModuleOptions,
} from 'webpack5';
import {SetRequired} from 'type-fest';

const esbuildLoaderPath = require.resolve('esbuild-loader');

type Wp4TestBuildConfig = SetRequired<Wp4Configuration, 'module' | 'plugins'>;

type Wp5TestBuildConfig = SetRequired<Wp5Configuration, 'plugins'> & {
	module: SetRequired<ModuleOptions, 'rules'>;
};

type WpBuildConfig = Wp4TestBuildConfig | Wp5TestBuildConfig;

export async function build(
	webpack: any,
	volJson: DirectoryJSON,
	configure?: (config: WpBuildConfig) => void,
): Promise<Stats> {
	return new Promise((resolve, reject) => {
		const mfs = Volume.fromJSON(volJson);

		(mfs as typeof mfs & {join: typeof path.join}).join = path.join.bind(path);

		const config: WpBuildConfig = {
			mode: 'development',
			devtool: false,
			bail: true,
			cache: false,
			context: '/',
			entry: {
				index: '/index.js',
			},
			output: {
				path: '/dist',
				filename: '[name].js',
				chunkFilename: '[name].js',
				libraryTarget: 'commonjs2',
			},

			resolveLoader: {
				alias: {
					'esbuild-loader': esbuildLoaderPath,
				},
			},

			module: {
				rules: [
					{
						test: /\.js$/,
						loader: 'esbuild-loader',
					},
				],
			},
			plugins: [],
		};

		configure?.(config);

		const compiler = webpack(config);

		compiler.inputFileSystem = ufs.use(fs).use(mfs as any);
		compiler.outputFileSystem = mfs;

		compiler.run((error: Error, stats: Stats) => {
			if (error) {
				reject(error);
				return;
			}

			if (stats.compilation.errors.length > 0) {
				reject(new Error(stats.compilation.errors[0]));
				return;
			}

			if (stats.compilation.warnings.length > 0) {
				reject(new Error(stats.compilation.warnings[0]));
				return;
			}

			resolve(stats);
		});
	});
}

export const getFile = (stats: Stats, filePath: string) => {
	const content: string = (stats.compilation.compiler.outputFileSystem as any).readFileSync(filePath, 'utf-8');

	return {
		content,
		execute(prefixCode = ''): any {
			const context = {
				module: {
					exports: {},
				},
			};
			runInNewContext(`${prefixCode}${content}`, context);
			return context.module.exports;
		},
	};
};
