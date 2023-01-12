import type webpack4 from 'webpack';
import type webpack5 from 'webpack5';
import { ESBuildMinifyPlugin } from '../dist/index.js';
import type { MinifyPluginOptions } from '../dist/interfaces.js';

const esbuildLoaderPath = require.resolve('../src/');

export type Webpack = typeof webpack4 | typeof webpack5;

export type WebpackConfiguration = webpack4.Configuration | webpack5.Configuration;

export type SourceMapDevToolPlugin =
	| webpack4.SourceMapDevToolPlugin
	| webpack5.SourceMapDevToolPlugin;

type RuleSetUseItem = webpack4.RuleSetUseItem & webpack5.RuleSetUseItem;

export const configureEsbuildLoader = <T extends WebpackConfiguration>(
	config: T,
) => {
	config.resolveLoader!.alias = {
		'esbuild-loader': esbuildLoaderPath,
	};

	config.module!.rules!.push({
		test: /\.js$/,
		loader: 'esbuild-loader',
	});
};

export const configureEsbuildMinifyPlugin = <T extends WebpackConfiguration>(
	config: T,
	options?: MinifyPluginOptions,
) => {
	config.optimization = {
		minimize: true,
		minimizer: [
			new ESBuildMinifyPlugin(options),
		],
	};
};

export const configureCssLoader = <T extends WebpackConfiguration>(
	config: T,
) => {
	const cssRule = {
		test: /\.css$/,
		use: [
			'css-loader',
		] as RuleSetUseItem[],
	};
	config.module!.rules!.push(cssRule);
	return cssRule;
};
