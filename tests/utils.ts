import type webpack4 from 'webpack';
import type webpack5 from 'webpack5';

const esbuildLoaderPath = require.resolve('../src/');

export type Webpack = typeof webpack4 | typeof webpack5;

export type WebpackConfiguration = webpack4.Configuration | webpack5.Configuration;

export const configureEsbuildLoader = <T extends WebpackConfiguration>(
	config: T,
) => {
	config.resolveLoader!.alias = {
		'esbuild-loader': esbuildLoaderPath,
	};

	config.module!.rules!.push(
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
};
