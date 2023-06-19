import path from 'path';
import type webpack4 from 'webpack';
import type webpack5 from 'webpack5';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { EsbuildPlugin, type EsbuildPluginOptions } from '#esbuild-loader';

const esbuildLoaderPath = path.resolve('./src/index.ts');

type Webpack4 = typeof webpack4;

export type Webpack = Webpack4 | typeof webpack5;

export type WebpackConfiguration = webpack4.Configuration | webpack5.Configuration;

type RuleSetUseItem = webpack4.RuleSetUseItem & webpack5.RuleSetUseItem;

export const isWebpack4 = (webpack: Webpack): webpack is Webpack4 => Boolean(webpack.version?.startsWith('4.'));

export const configureEsbuildLoader = (
	config: WebpackConfiguration,
	rulesConfig?: any,
) => {
	config.resolveLoader!.alias = {
		'esbuild-loader': esbuildLoaderPath,
	};

	config.module!.rules!.push({
		test: /\.js$/,
		loader: 'esbuild-loader',
		...rulesConfig,
		options: {
			tsconfigRaw: undefined,
			...rulesConfig?.options,
		},
	});
};

export const configureEsbuildMinifyPlugin = (
	config: WebpackConfiguration,
	options?: EsbuildPluginOptions,
) => {
	config.optimization = {
		minimize: true,
		minimizer: [
			new EsbuildPlugin({
				tsconfigRaw: undefined,
				...options,
			}),
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

	config.plugins!.push(
		// @ts-expect-error Forcing it to Webpack 5
		new MiniCssExtractPlugin(),
	);
};
