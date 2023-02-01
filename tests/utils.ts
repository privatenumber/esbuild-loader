import type webpack4 from 'webpack';
import type webpack5 from 'webpack5';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { EsbuildPlugin, type EsbuildPluginOptions } from '#esbuild-loader';

const esbuildLoaderPath = require.resolve('../src/');

export type Webpack = typeof webpack4 | typeof webpack5;

export type WebpackConfiguration = webpack4.Configuration | webpack5.Configuration;

type RuleSetUseItem = webpack4.RuleSetUseItem & webpack5.RuleSetUseItem;

export const configureEsbuildLoader = (
	config: WebpackConfiguration,
	options?: any,
) => {
	config.resolveLoader!.alias = {
		'esbuild-loader': esbuildLoaderPath,
	};

	config.module!.rules!.push({
		test: /\.js$/,
		loader: 'esbuild-loader',
		...options,
	});
};

export const configureEsbuildMinifyPlugin = (
	config: WebpackConfiguration,
	options?: EsbuildPluginOptions,
) => {
	config.optimization = {
		minimize: true,
		minimizer: [
			new EsbuildPlugin(options),
		],
	};
};

export const configureCssLoader = (
	config: WebpackConfiguration,
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

export const configureMiniCssExtractPlugin = (
	config: WebpackConfiguration,
) => {
	const cssRule = configureCssLoader(config);
	cssRule.use.unshift(MiniCssExtractPlugin.loader);

	// @ts-expect-error Forcing it to Webpack 5
	config.plugins!.push(new MiniCssExtractPlugin());
};
