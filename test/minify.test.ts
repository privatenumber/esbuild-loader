import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { RawSource } from 'webpack-sources';
import * as esbuild from 'esbuild';
import { MinifyPluginOptions } from '../src/interfaces';
import { ESBuildMinifyPlugin } from '../src/index';
import { build, getFile } from './utils';
import * as fixtures from './fixtures';

describe.each([
	['Webpack 4', webpack4],
	['Webpack 5', webpack5],
])('%s Loader + Minification', (_name, webpack) => {
	describe('Error handling', () => {
		test('invalid implementation option', async () => {
			const runWithImplementation = async (implementation: MinifyPluginOptions['implementation']) => {
				await build(webpack, fixtures.js, (config) => {
					config.optimization = {
						minimize: true,
						minimizer: [
							new ESBuildMinifyPlugin({
								implementation,
							}),
						],
					};
				});
			};

			await expect(
				// @ts-expect-error testing invalid type
				runWithImplementation({}),
			).rejects.toThrow(
				'ESBuildMinifyPlugin: implementation.transform must be an ESBuild transform function. Received undefined',
			);

			await expect(
				// @ts-expect-error testing invalid type
				runWithImplementation({ transform: 123 }),
			).rejects.toThrow(
				'ESBuildMinifyPlugin: implementation.transform must be an ESBuild transform function. Received number',
			);
		});
	});

	test('minify', async () => {
		const statsUnminified = await build(webpack, fixtures.js);
		const stats = await build(webpack, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						target: 'es2019',
					}),
				],
			};
		});
		expect(statsUnminified.hash).not.toBe(stats.hash);

		const file = getFile(stats, '/dist/index.js');

		expect(file.content).toMatchSnapshot();
		expect(file.execute()).toMatchSnapshot();
	});

	test('minifyWhitespace', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						minifyWhitespace: true,
					}),
				],
			};
		});
		const file = getFile(stats, '/dist/index.js');

		expect(file.content).toMatchSnapshot();
		expect(file.execute()).toMatchSnapshot();
	});

	test('minifyIdentifiers', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						minifyIdentifiers: true,
					}),
				],
			};
		});
		const file = getFile(stats, '/dist/index.js');

		expect(file.content).toMatchSnapshot();
		expect(file.execute()).toMatchSnapshot();
	});

	test('minifySyntax', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						target: 'es2019',
						minifySyntax: true,
					}),
				],
			};
		});
		const file = getFile(stats, '/dist/index.js');

		expect(file.content).toMatchSnapshot();
		expect(file.execute()).toMatchSnapshot();
	});

	test('minify chunks', async () => {
		const stats = await build(webpack, fixtures.webpackChunks, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin()],
			};
		});

		expect(getFile(stats, '/dist/index.js').content).toMatchSnapshot();
		expect(getFile(stats, '/dist/named-chunk-foo.js').content).toMatchSnapshot();
		expect(getFile(stats, '/dist/named-chunk-bar.js').content).toMatchSnapshot();
	});

	test('minify chunks filtered using "include"', async () => {
		const stats = await build(webpack, fixtures.webpackChunks, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin({
					include: /(index|bar)/,
				})],
			};
		});

		// The string "__webpack_require__" is only present in unminified chunks
		expect(getFile(stats, '/dist/index.js').content).not.toContain('__webpack_require__');
		expect(getFile(stats, '/dist/named-chunk-foo.js').content).toContain('__webpack_require__');
		expect(getFile(stats, '/dist/named-chunk-bar.js').content).not.toContain('__webpack_require__');

		expect(getFile(stats, '/dist/index.js').content).toMatchSnapshot();
		expect(getFile(stats, '/dist/named-chunk-foo.js').content).toMatchSnapshot();
		expect(getFile(stats, '/dist/named-chunk-bar.js').content).toMatchSnapshot();
	});

	test('minify chunks filtered using "exclude"', async () => {
		const stats = await build(webpack, fixtures.webpackChunks, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						exclude: /bar/,
					}),
				],
			};
		});

		// The string "__webpack_require__" is only present in unminified chunks
		expect(getFile(stats, '/dist/index.js').content).not.toContain('__webpack_require__');
		expect(getFile(stats, '/dist/named-chunk-foo.js').content).not.toContain('__webpack_require__');
		expect(getFile(stats, '/dist/named-chunk-bar.js').content).toContain('__webpack_require__');

		expect(getFile(stats, '/dist/index.js').content).toMatchSnapshot();
		expect(getFile(stats, '/dist/named-chunk-foo.js').content).toMatchSnapshot();
		expect(getFile(stats, '/dist/named-chunk-bar.js').content).toMatchSnapshot();
	});

	test('minify w/ no devtool', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			delete config.devtool;
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin({
					target: 'es2015',
				})],
			};
		});
		const file = getFile(stats, '/dist/index.js');

		expect(file.content).toMatchSnapshot();
		expect(file.content).not.toContain('//# sourceURL');
		expect(file.execute()).toMatchSnapshot();
	});

	test('minify w/ devtool inline-source-map', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			config.devtool = 'inline-source-map';
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin(),
				],
			};
		});

		const file = getFile(stats, '/dist/index.js');
		expect(file.content).toContain('//# sourceMappingURL=data:application/');
		expect(file.content).toMatchSnapshot();
	});

	test('minify w/ devtool source-map', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			config.devtool = 'source-map';
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin()],
			};
		});

		const file = getFile(stats, '/dist/index.js');
		expect(file.content).toContain('//# sourceMappingURL=index.js.map');
		expect(getFile(stats, '/dist/index.js').content).toMatchSnapshot();
	});

	test('minify w/ source-map option', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			delete config.devtool;
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						sourcemap: true,
					}),
				],
			};
		});

		expect(getFile(stats, '/dist/index.js').content).toMatchSnapshot();
	});

	test('minify w/ source-map option and source-map plugin inline', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			delete config.devtool;
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						sourcemap: true,
					}),
				],
			};

			config.plugins.push(new webpack.SourceMapDevToolPlugin({}));
		});

		expect(getFile(stats, '/dist/index.js').content).toMatchSnapshot();
	});

	test('minify w/ source-map option and source-map plugin external', async () => {
		const stats = await build(webpack, fixtures.js, (config) => {
			delete config.devtool;
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						sourcemap: true,
					}),
				],
			};

			config.plugins.push(
				new webpack.SourceMapDevToolPlugin({
					filename: 'index.js.map',
				}),
			);
		});

		expect(getFile(stats, '/dist/index.js').content).toMatchSnapshot();
		expect(getFile(stats, '/dist/index.js.map').content).toMatchSnapshot();
	});

	test('minify w/ query strings', async () => {
		const statsUnminified = await build(webpack, fixtures.js, (config) => {
			config.output.filename = '[name].js?foo=bar';
			config.output.chunkFilename = '[name].js?foo=bar';
		});
		const stats = await build(webpack, fixtures.js, (config) => {
			config.output.filename = '[name].js?foo=bar';
			config.output.chunkFilename = '[name].js?foo=bar';
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						target: 'es2019',
					}),
				],
			};
		});
		expect(statsUnminified.hash).not.toBe(stats.hash);

		// Note: the actual file name does not include the query string
		const file = getFile(stats, '/dist/index.js');

		expect(file.content).toMatchSnapshot();
		expect(file.execute()).toMatchSnapshot();
	});

	test('minify w/ legalComments - default is inline', async () => {
		const statsDefault = await build(webpack, fixtures.legalComments, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin(),
				],
			};
		});

		const statsInline = await build(webpack, fixtures.legalComments, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						legalComments: 'inline',
					}),
				],
			};
		});

		const fileInline = getFile(statsInline, '/dist/index.js');
		const fileDefault = getFile(statsDefault, '/dist/index.js');

		expect(fileDefault.content).toMatch('//! legal comment');
		expect(fileDefault.content).toBe(fileInline.content);
	});

	test('minify w/ legalComments - eof', async () => {
		const stats = await build(webpack, fixtures.legalComments, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						legalComments: 'eof',
					}),
				],
			};
		});

		const file = getFile(stats, '/dist/index.js');
		expect(file.content.trim().endsWith('//! legal comment')).toBe(true);
	});

	test('minify w/ legalComments - none', async () => {
		const stats = await build(webpack, fixtures.legalComments, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						legalComments: 'none',
					}),
				],
			};
		});

		const file = getFile(stats, '/dist/index.js');
		expect(file.content).not.toMatch('//! legal comment');
	});

	test('minify with custom implementation', async () => {
		const statsUnminified = await build(webpack, fixtures.js);
		const stats = await build(webpack, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						implementation: {
							transform: async () => ({
								code: 'export function foo() { return "MY_CUSTOM_ESBUILD_IMPLEMENTATION"; }',
								map: '',
								warnings: [],
							}),
						},
					}),
				],
			};
		});
		expect(statsUnminified.hash).not.toBe(stats.hash);

		const { content } = getFile(stats, '/dist/index.js');
		expect(content).toContain('MY_CUSTOM_ESBUILD_IMPLEMENTATION');
		expect(content).toMatchSnapshot();
	});

	test('minify with custom implementation - real', async () => {
		const statsUnminified = await build(webpack, fixtures.js);
		const stats = await build(webpack, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						implementation: esbuild,
					}),
				],
			};
		});
		expect(statsUnminified.hash).not.toBe(stats.hash);

		const file = getFile(stats, '/dist/index.js');
		expect(file.execute()).toMatchSnapshot();
	});

	describe('CSS', () => {
		test('minify via loader', async () => {
			const stats = await build(webpack, fixtures.css, (config) => {
				config.module.rules[1].use.push({
					loader: 'esbuild-loader',
					options: {
						loader: 'css',
						minify: true,
					},
				});
			});

			const file = getFile(stats, '/dist/index.js');
			expect(file.content).toContain('div{color:red}');
		});

		test('minify', async () => {
			const stats = await build(webpack, fixtures.css, (config) => {
				config.optimization = {
					minimize: true,
					minimizer: [
						new ESBuildMinifyPlugin({
							css: true,
						}),
					],
				};

				config.module.rules[1].use.unshift(MiniCssExtractPlugin.loader);
				config.plugins.push(new MiniCssExtractPlugin());
			});

			const file = getFile(stats, '/dist/index.css');
			expect(file.content.trim()).not.toMatch(/\s{2,}/);
		});

		test('exclude css', async () => {
			const stats = await build(webpack, fixtures.css, (config) => {
				config.optimization = {
					minimize: true,
					minimizer: [
						new ESBuildMinifyPlugin({
							css: true,
							exclude: /\.css$/,
						}),
					],
				};

				config.module.rules[1].use.unshift(MiniCssExtractPlugin.loader);
				config.plugins.push(new MiniCssExtractPlugin());
			});

			const file = getFile(stats, '/dist/index.css');
			expect(file.content.trim()).toMatch(/\s{2,}/);
		});

		test('minify w/ source-map', async () => {
			const stats = await build(webpack, fixtures.css, (config) => {
				config.devtool = 'source-map';
				config.optimization = {
					minimize: true,
					minimizer: [
						new ESBuildMinifyPlugin({
							css: true,
						}),
					],
				};

				config.module.rules[1].use.unshift(MiniCssExtractPlugin.loader);
				config.plugins.push(new MiniCssExtractPlugin());
			});

			const cssFile = getFile(stats, '/dist/index.css');
			const css = cssFile.content.trim().split('\n');
			expect(css[0]).not.toMatch(/\s{2,}/);
			expect(css[2]).toMatch(/sourceMappingURL/);

			const sourcemapFile = getFile(stats, '/dist/index.css.map');
			expect(sourcemapFile.content).toMatch(/styles\.css/);
		});
	});
});

describe('Webpack 5', () => {
	test('Stats', async () => {
		const stats = await build(webpack5, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin()],
			};
		});

		expect(stats.toString().includes('[minimized]')).toBe(true);
	});

	test('Minifies new assets', async () => {
		const stats = await build(webpack5, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin()],
			};

			config.plugins.push({
				apply(compiler) {
					compiler.hooks.compilation.tap('test', (compilation) => {
						compilation.hooks.processAssets.tap(
							{ name: 'test' },
							() => {
								compilation.emitAsset(
									'test.js',
									new RawSource('const value = 1;\n\nexport default value;'),
								);
							},
						);
					});
				},
			});
		});

		const asset = stats.compilation.getAsset('test.js');

		expect(asset.info.minimized).toBe(true);

		const file = getFile(stats, '/dist/test.js');
		expect(file.content).toBe('const e=1;export default e;\n');
	});

	test('Doesn\'t minify minimized assets', async () => {
		const sourceAndMap = jest.fn();

		await build(webpack5, fixtures.js, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin()],
			};

			config.plugins.push({
				apply(compiler) {
					compiler.hooks.compilation.tap('test', (compilation) => {
						compilation.hooks.processAssets.tap(
							{ name: 'test' },
							() => {
								const asset = new RawSource('');

								asset.sourceAndMap = sourceAndMap;

								compilation.emitAsset(
									'test.js',
									asset,
									{ minimized: true },
								);
							},
						);
					});
				},
			});
		});

		expect(sourceAndMap).not.toBeCalled();
	});
});
