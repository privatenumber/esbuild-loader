import path from 'path';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';

const esbuildLoaderPath = require.resolve('../src/');

export function configureEsbuildLoader<T extends(webpack4.Configuration | webpack5.Configuration)>(
	config: T) {
	config.resolveLoader = {
		modules: [
			path.join(__dirname, '../node_modules'),
		],
		alias: {
			'esbuild-loader': esbuildLoaderPath,
		},
	};

	config.module.rules.push(
		{
			test: /\.js$/,
			loader: 'esbuild-loader',
		},
		{
			test: /\.css$/,
			use: [
				'css-loader',
			],
		},
	);
}
