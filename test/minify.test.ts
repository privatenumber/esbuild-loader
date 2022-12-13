import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { RawSource } from 'webpack-sources';
import * as esbuild from 'esbuild';
import { build } from 'webpack-test-utils';
import { MinifyPluginOptions } from '../dist/interfaces.js';
import { ESBuildMinifyPlugin } from '../dist/index.js';
// import { build, getFile } from './utils';
import * as fixtures from './fixtures';
import { configureEsbuildLoader } from './utils';

describe.each([
	['Webpack 4', webpack4],
	['Webpack 5', webpack5],
])('%s Loader + Minification', (_name, webpack) => {
	describe('Error handling', () => {
		test('invalid implementation option', async () => {
			const runWithImplementation = async (implementation: MinifyPluginOptions['implementation']) => {
				await build(fixtures.js, (config) => {
					config.optimization = {
						minimize: true,
						minimizer: [
							new ESBuildMinifyPlugin({
								implementation,
							}),
						],
					};
				}, webpack);
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
		const builtUnminified = await build(fixtures.js, null, webpack);
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						target: 'es2019',
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(builtUnminified.stats.hash).not.toBe(built.stats.hash);
		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
		expect(built.require('/dist')).toMatchSnapshot();
	});

	test('minifyWhitespace', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						minifyWhitespace: true,
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
		expect(built.require('/dist')).toMatchSnapshot();
	});

	test('minifyIdentifiers', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						minifyIdentifiers: true,
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
		expect(built.require('/dist')).toMatchSnapshot();
	});

	test('minifySyntax', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						target: 'es2019',
						minifySyntax: true,
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
		expect(built.require('/dist')).toMatchSnapshot();
	});

	test('minify chunks', async () => {
		const built = await build(fixtures.webpackChunks, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin()],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
		expect(built.fs.readFileSync('/dist/named-chunk-foo.js', 'utf8')).toMatchSnapshot();
		expect(built.fs.readFileSync('/dist/named-chunk-bar.js', 'utf8')).toMatchSnapshot();
	});

	test('minify chunks filtered using "include"', async () => {
		const built = await build(fixtures.webpackChunks, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin({
					include: /(index|bar)/,
				})],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		// The string "__webpack_require__" is only present in unminified chunks
		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).not.toContain('__webpack_require__');
		expect(built.fs.readFileSync('/dist/named-chunk-foo.js', 'utf8')).toContain('__webpack_require__');
		expect(built.fs.readFileSync('/dist/named-chunk-bar.js', 'utf8')).not.toContain('__webpack_require__');

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
		expect(built.fs.readFileSync('/dist/named-chunk-foo.js', 'utf8')).toMatchSnapshot();
		expect(built.fs.readFileSync('/dist/named-chunk-bar.js', 'utf8')).toMatchSnapshot();
	});

	test('minify chunks filtered using "exclude"', async () => {
		const built = await build(fixtures.webpackChunks, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						exclude: /bar/,
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		// The string "__webpack_require__" is only present in unminified chunks
		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).not.toContain('__webpack_require__');
		expect(built.fs.readFileSync('/dist/named-chunk-foo.js', 'utf8')).not.toContain('__webpack_require__');
		expect(built.fs.readFileSync('/dist/named-chunk-bar.js', 'utf8')).toContain('__webpack_require__');

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
		expect(built.fs.readFileSync('/dist/named-chunk-foo.js', 'utf8')).toMatchSnapshot();
		expect(built.fs.readFileSync('/dist/named-chunk-bar.js', 'utf8')).toMatchSnapshot();
	});

	test('minify w/ no devtool', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			delete config.devtool;
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin({
					target: 'es2015',
				})],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		const file = built.fs.readFileSync('/dist/index.js', 'utf8');

		expect(file).toMatchSnapshot();
		expect(file).not.toContain('//# sourceURL');
		expect(built.require('/dist')).toMatchSnapshot();
	});

	test('minify w/ devtool inline-source-map', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.devtool = 'inline-source-map';
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin(),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		const file = built.fs.readFileSync('/dist/index.js', 'utf8');
		expect(file).toContain('//# sourceMappingURL=data:application/');
		expect(file).toMatchSnapshot();
	});

	test('minify w/ devtool source-map', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.devtool = 'source-map';
			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin()],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		const file = built.fs.readFileSync('/dist/index.js', 'utf8');
		expect(file).toContain('//# sourceMappingURL=index.js.map');
		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
	});

	test('minify w/ source-map option', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			delete config.devtool;
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						sourcemap: true,
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
	});

	test('minify w/ source-map option and source-map plugin inline', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

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
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
	});

	test('minify w/ source-map option and source-map plugin external', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

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
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
		expect(built.fs.readFileSync('/dist/index.js.map', 'utf8')).toMatchSnapshot();
	});

	test('minify w/ query strings', async () => {
		const builtUnminified = await build(fixtures.js, (config) => {
			config.output.filename = '[name].js?foo=bar';
			config.output.chunkFilename = '[name].js?foo=bar';
		}, webpack);
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

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
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(builtUnminified.stats.hash).not.toBe(built.stats.hash);

		// Note: the actual file name does not include the query string
		const file = built.fs.readFileSync('/dist/index.js', 'utf8');

		expect(file).toMatchSnapshot();
		expect(built.require('/dist')).toMatchSnapshot();
	});

	test('minify w/ legalComments - default is none', async () => {
		const builtDefault = await build(fixtures.legalComments, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin(),
				],
			};
		}, webpack);

		const builtInline = await build(fixtures.legalComments, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						legalComments: 'inline',
					}),
				],
			};
		}, webpack);

		const fileInline = builtInline.fs.readFileSync('/dist/index.js', 'utf8');
		const fileDefault = builtDefault.fs.readFileSync('/dist/index.js', 'utf8');

		expect(fileDefault).not.toMatch('//! legal comment');
		expect(fileDefault).not.toBe(fileInline);
	});

	test('minify w/ legalComments - eof', async () => {
		const built = await build(fixtures.legalComments, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						legalComments: 'eof',
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		const file = built.fs.readFileSync('/dist/index.js').toString();
		expect(file.trim().endsWith('//! legal comment')).toBe(true);
	});

	test('minify w/ legalComments - none', async () => {
		const built = await build(fixtures.legalComments, (config) => {
			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						legalComments: 'none',
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		const file = built.fs.readFileSync('/dist/index.js', 'utf8');
		expect(file).not.toMatch('//! legal comment');
	});

	test('minify with custom implementation', async () => {
		const builtUnminified = await build(fixtures.js);
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

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
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(builtUnminified.stats.hash).not.toBe(built.stats.hash);

		const content = built.fs.readFileSync('/dist/index.js', 'utf8');
		expect(content).toContain('MY_CUSTOM_ESBUILD_IMPLEMENTATION');
		expect(content).toMatchSnapshot();
	});

	test('minify with custom implementation - real', async () => {
		const builtUnminified = await build(fixtures.js);
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.optimization = {
				minimize: true,
				minimizer: [
					new ESBuildMinifyPlugin({
						target: 'es2019',
						implementation: esbuild,
					}),
				],
			};
		}, webpack);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(builtUnminified.stats.hash).not.toBe(built.stats.hash);
		expect(built.require('/dist')).toMatchSnapshot();
	});

	describe('CSS', () => {
		test('minify via loader', async () => {
			const built = await build(fixtures.css, (config) => {
				configureEsbuildLoader(config);

				config.module.rules[1].use.push({
					loader: 'esbuild-loader',
					options: {
						loader: 'css',
						minify: true,
					},
				});
			}, webpack);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			const file = built.fs.readFileSync('/dist/index.js', 'utf8');
			expect(file).toContain('div{color:red}');
		});

		test('minify', async () => {
			const built = await build(fixtures.css, (config) => {
				configureEsbuildLoader(config);

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
			}, webpack);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			const file = built.fs.readFileSync('/dist/index.css').toString();
			expect(file.trim()).not.toMatch(/\s{2,}/);
		});

		test('exclude css', async () => {
			const built = await build(fixtures.css, (config) => {
				configureEsbuildLoader(config);

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
			}, webpack);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			const file = built.fs.readFileSync('/dist/index.css').toString();
			expect(file.trim()).toMatch(/\s{2,}/);
		});

		test('minify w/ source-map', async () => {
			const built = await build(fixtures.css, (config) => {
				configureEsbuildLoader(config);

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
			}, webpack);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);

			const cssFile = built.fs.readFileSync('/dist/index.css').toString();
			const css = cssFile.trim().split('\n');
			expect(css[0]).not.toMatch(/\s{2,}/);
			expect(css[2]).toMatch(/sourceMappingURL/);

			const sourcemapFile = built.fs.readFileSync('/dist/index.css.map', 'utf8');
			expect(sourcemapFile).toMatch(/styles\.css/);
		});
	});
});

describe('Webpack 5', () => {
	test('Stats', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

			config.optimization = {
				minimize: true,
				minimizer: [new ESBuildMinifyPlugin()],
			};
		}, webpack5);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		expect(built.stats.toString().includes('[minimized]')).toBe(true);
	});

	test('Minifies new assets', async () => {
		const built = await build(fixtures.js, (config) => {
			configureEsbuildLoader(config);

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
		}, webpack5);

		expect(built.stats.hasWarnings()).toBe(false);
		expect(built.stats.hasErrors()).toBe(false);

		const asset = built.stats.compilation.getAsset('test.js');

		expect(asset.info.minimized).toBe(true);

		const file = built.fs.readFileSync('/dist/test.js', 'utf8');
		expect(file).toBe('const e=1;export default 1;\n');
	});

	test('Doesn\'t minify minimized assets', async () => {
		const sourceAndMap = jest.fn();

		await build(fixtures.js, (config) => {
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
		}, webpack5);

		expect(sourceAndMap).not.toBeCalled();
	});
});
