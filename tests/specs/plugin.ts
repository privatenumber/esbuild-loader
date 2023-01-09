import { testSuite, expect } from 'manten';
import { build } from 'webpack-test-utils';
import webpack4 from 'webpack';
import webpack5 from 'webpack5';
import * as esbuild from 'esbuild';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { MinifyPluginOptions } from '../../dist/interfaces.js';
import { configureEsbuildLoader, type WebpackConfiguration } from '../utils';
import { ESBuildMinifyPlugin } from '../../dist/index.js';

const minifyCode = 'export default ( stringVal )  =>  { return stringVal }';

const assertMinified = (code: string) => {
	expect(code).not.toMatch(/\s{2,}/);
	expect(code).not.toMatch('stringVal');
	expect(code).not.toMatch('return ');
};

export default testSuite(({ describe }, webpack: typeof webpack4 | typeof webpack5) => {
	describe('Plugin', ({ test, describe }) => {
		describe('Minify JS', ({ test }) => {
			test('minify', async () => {
				const built = await build({
					'/src/index.js': minifyCode,
				}, (config) => {
					configureEsbuildLoader(config);

					config.optimization = {
						minimize: true,
						minimizer: [
							new ESBuildMinifyPlugin(),
						],
					};
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');
				assertMinified(exportedFunction.toString());
			});

			test('minifyWhitespace', async () => {
				const built = await build(
					{
						'/src/index.js': minifyCode,
					},
					(config) => {
						configureEsbuildLoader(config);

						config.optimization = {
							minimize: true,
							minimizer: [
								new ESBuildMinifyPlugin({
									minifyWhitespace: true,
								}),
							],
						};
					},
					webpack,
				);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');

				const code = exportedFunction.toString();
				expect(code).not.toMatch(/\s{2,}/);
				expect(code).toMatch('stringVal');
				expect(code).toMatch('return ');
			});

			test('minifyIdentifiers', async () => {
				const built = await build({
					'/src/index.js': minifyCode,
				}, (config) => {
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

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');

				const code = exportedFunction.toString();
				expect(code).toMatch(/\s{2,}/);
				expect(code).not.toMatch('stringVal');
				expect(code).toMatch('return ');
			});

			test('minifySyntax', async () => {
				const built = await build({
					'/src/index.js': minifyCode,
				}, (config) => {
					configureEsbuildLoader(config);

					config.optimization = {
						minimize: true,
						minimizer: [
							new ESBuildMinifyPlugin({
								minifySyntax: true,
							}),
						],
					};
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');

				const code = exportedFunction.toString();
				expect(code).toMatch(/\s/);
				expect(code).toMatch('stringVal');
				expect(code).not.toMatch('return ');
			});

			test('minify chunks & filter using include/exclude', async () => {
				const built = await build({
					'/src/index.js': `
						const foo = import(/* webpackChunkName: "named-chunk-foo" */'./foo.js')
						const bar = import(/* webpackChunkName: "named-chunk-bar" */'./bar.js')
						const baz = import(/* webpackChunkName: "named-chunk-baz" */'./baz.js')
						export default [foo, bar, baz];
					`,
					'/src/foo.js': minifyCode,
					'/src/bar.js': minifyCode,
					'/src/baz.js': minifyCode,
				}, (config) => {
					config.optimization = {
						minimize: true,
						minimizer: [new ESBuildMinifyPlugin({
							include: /ba./,
							exclude: /baz/,
						})],
					};
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const chunkFoo = built.fs.readFileSync('/dist/named-chunk-foo.js', 'utf8').toString();

				// The string "__webpack_require__" is only present in unminified chunks
				expect(chunkFoo).toContain('__webpack_require__');

				const chunkBar = built.fs.readFileSync('/dist/named-chunk-bar.js', 'utf8').toString();
				expect(chunkBar).not.toContain('__webpack_require__');
				assertMinified(chunkBar);

				const chunkBaz = built.fs.readFileSync('/dist/named-chunk-baz.js', 'utf8').toString();
				expect(chunkBaz).toContain('__webpack_require__');
			});

			describe('devtool', ({ test }) => {
				test('minify w/ no devtool', async () => {
					const built = await build({
						'/src/index.js': '',
					}, (config) => {
						configureEsbuildLoader(config);

						delete config.devtool;
						config.optimization = {
							minimize: true,
							minimizer: [
								new ESBuildMinifyPlugin(),
							],
						};
					}, webpack);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets).length,
					).toBe(1);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).not.toContain('//# sourceURL');
				});

				test('minify w/ devtool inline-source-map', async () => {
					const built = await build({
						'/src/index.js': '',
					}, (config) => {
						configureEsbuildLoader(config);

						config.devtool = 'inline-source-map';
						config.optimization = {
							minimize: true,
							minimizer: [
								new ESBuildMinifyPlugin(),
							],
						};
					}, webpack);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets).length,
					).toBe(1);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).toContain('//# sourceMappingURL=data:application/');
				});

				test('minify w/ devtool source-map', async () => {
					const built = await build({
						'/src/index.js': '',
					}, (config) => {
						configureEsbuildLoader(config);

						config.devtool = 'source-map';
						config.optimization = {
							minimize: true,
							minimizer: [
								new ESBuildMinifyPlugin(),
							],
						};
					}, webpack);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets),
					).toStrictEqual([
						'index.js',
						'index.js.map',
					]);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).toContain('//# sourceMappingURL=index.js.map');
				});

				// test('minify w/ source-map option', async () => {
				// 	const built = await build({
				// 		'/src/index.js': '',
				// 	}, (config) => {
				// 		configureEsbuildLoader(config);

				// 		delete config.devtool;
				// 		config.optimization = {
				// 			minimize: true,
				// 			minimizer: [
				// 				new ESBuildMinifyPlugin({
				// 					sourcemap: true,
				// 				}),
				// 			],
				// 		};
				// 	}, webpack);

				// 	const { stats } = built;
				// 	expect(stats.hasWarnings()).toBe(false);
				// 	expect(stats.hasErrors()).toBe(false);
				// 	expect(
				// 		Object.keys(stats.compilation.assets),
				// 	).toStrictEqual([
				// 		'index.js',
				// 		// 'index.js.map',
				// 	]);

				// 	const file = built.fs.readFileSync('/dist/index.js', 'utf8');
				// 	expect(file).toContain('//# sourceMappingURL=index.js.map');
				// });

				test('minify w/ source-map option and source-map plugin inline', async () => {
					const built = await build({
						'/src/index.js': '',
					}, (config) => {
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

						// @ts-expect-error webpack types are wrong
						config.plugins!.push(new webpack.SourceMapDevToolPlugin({}));
					}, webpack);

					const { stats } = built;
					expect(stats.hasWarnings()).toBe(false);
					expect(stats.hasErrors()).toBe(false);
					expect(
						Object.keys(stats.compilation.assets).length,
					).toBe(1);

					const file = built.fs.readFileSync('/dist/index.js', 'utf8');
					expect(file).toContain('//# sourceMappingURL=data:application/');
				});
			});
			// test('minify w/ source-map option and source-map plugin external', async () => {
			// 	const built = await build(fixtures.js, (config) => {
			// 		configureEsbuildLoader(config);

			// 		delete config.devtool;
			// 		config.optimization = {
			// 			minimize: true,
			// 			minimizer: [
			// 				new ESBuildMinifyPlugin({
			// 					sourcemap: true,
			// 				}),
			// 			],
			// 		};

			// 		config.plugins.push(
			// 			new webpack.SourceMapDevToolPlugin({
			// 				filename: 'index.js.map',
			// 			}),
			// 		);
			// 	}, webpack);

			// 	expect(built.stats.hasWarnings()).toBe(false);
			// 	expect(built.stats.hasErrors()).toBe(false);

			// 	expect(built.fs.readFileSync('/dist/index.js', 'utf8')).toMatchSnapshot();
			// 	expect(built.fs.readFileSync('/dist/index.js.map', 'utf8')).toMatchSnapshot();
			// });

			// test('minify w/ query strings', async () => {
			// 	const builtUnminified = await build(fixtures.js, (config) => {
			// 		config.output.filename = '[name].js?foo=bar';
			// 		config.output.chunkFilename = '[name].js?foo=bar';
			// 	}, webpack);
			// 	const built = await build(fixtures.js, (config) => {
			// 		configureEsbuildLoader(config);

			// 		config.output.filename = '[name].js?foo=bar';
			// 		config.output.chunkFilename = '[name].js?foo=bar';
			// 		config.optimization = {
			// 			minimize: true,
			// 			minimizer: [
			// 				new ESBuildMinifyPlugin({
			// 					target: 'es2019',
			// 				}),
			// 			],
			// 		};
			// 	}, webpack);

			// 	expect(built.stats.hasWarnings()).toBe(false);
			// 	expect(built.stats.hasErrors()).toBe(false);

			// 	expect(builtUnminified.stats.hash).not.toBe(built.stats.hash);

			// 	// Note: the actual file name does not include the query string
			// 	const file = built.fs.readFileSync('/dist/index.js', 'utf8');

			// 	expect(file).toMatchSnapshot();
			// 	expect(built.require('/dist')).toMatchSnapshot();
			// });

			// test('minify w/ legalComments - default is inline', async () => {
			// 	const builtDefault = await build(fixtures.legalComments, (config) => {
			// 		config.optimization = {
			// 			minimize: true,
			// 			minimizer: [
			// 				new ESBuildMinifyPlugin(),
			// 			],
			// 		};
			// 	}, webpack);

			// 	const builtInline = await build(fixtures.legalComments, (config) => {
			// 		config.optimization = {
			// 			minimize: true,
			// 			minimizer: [
			// 				new ESBuildMinifyPlugin({
			// 					legalComments: 'inline',
			// 				}),
			// 			],
			// 		};
			// 	}, webpack);

			// 	const fileInline = builtInline.fs.readFileSync('/dist/index.js', 'utf8');
			// 	const fileDefault = builtDefault.fs.readFileSync('/dist/index.js', 'utf8');

			// 	expect(fileDefault).toMatch('//! legal comment');
			// 	expect(fileDefault).toBe(fileInline);
			// });

			// test('minify w/ legalComments - eof', async () => {
			// 	const built = await build(fixtures.legalComments, (config) => {
			// 		config.optimization = {
			// 			minimize: true,
			// 			minimizer: [
			// 				new ESBuildMinifyPlugin({
			// 					legalComments: 'eof',
			// 				}),
			// 			],
			// 		};
			// 	}, webpack);

			// 	expect(built.stats.hasWarnings()).toBe(false);
			// 	expect(built.stats.hasErrors()).toBe(false);

			// 	const file = built.fs.readFileSync('/dist/index.js').toString();
			// 	expect(file.trim().endsWith('//! legal comment')).toBe(true);
			// });

			// test('minify w/ legalComments - none', async () => {
			// 	const built = await build(fixtures.legalComments, (config) => {
			// 		config.optimization = {
			// 			minimize: true,
			// 			minimizer: [
			// 				new ESBuildMinifyPlugin({
			// 					legalComments: 'none',
			// 				}),
			// 			],
			// 		};
			// 	}, webpack);

			// 	expect(built.stats.hasWarnings()).toBe(false);
			// 	expect(built.stats.hasErrors()).toBe(false);

			// 	const file = built.fs.readFileSync('/dist/index.js', 'utf8');
			// 	expect(file).not.toMatch('//! legal comment');
			// });
		});

		describe('implementation', ({ test }) => {
			test('error', async () => {
				const runWithImplementation = async (implementation: MinifyPluginOptions['implementation']) => {
					await build(
						{ '/src/index.js': '' },
						(config) => {
							config.optimization = {
								minimize: true,
								minimizer: [
									new ESBuildMinifyPlugin({
										implementation,
									}),
								],
							};
						},
						webpack,
					);
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

			test('customizable', async () => {
				const code = 'export function foo() { return "CUSTOM_ESBUILD_IMPLEMENTATION"; }';
				const built = await build({
					'/src/index.js': minifyCode,
				}, (config) => {
					configureEsbuildLoader(config);

					config.optimization = {
						minimize: true,
						minimizer: [
							new ESBuildMinifyPlugin({
								implementation: {
									transform: async () => ({
										code,
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
				expect(
					built.fs.readFileSync('/dist/index.js', 'utf8'),
				).toBe(code);
			});

			test('customize with real esbuild', async () => {
				const built = await build({
					'/src/index.js': minifyCode,
				}, (config) => {
					configureEsbuildLoader(config);

					config.optimization = {
						minimize: true,
						minimizer: [
							new ESBuildMinifyPlugin({
								implementation: esbuild,
							}),
						],
					};
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const exportedFunction = built.require('/dist/');
				expect(exportedFunction('hello world')).toBe('hello world');
				assertMinified(exportedFunction.toString());
			});
		});

		describe('CSS', () => {
			const cssFixture = {
				'/src/index.js': 'import "./styles.css"',
				'/src/styles.css': `
				div {
					color: red;
				}
				span {
					margin: 0px 10px;
				}
				`,
			};

			const setupMiniCssExtractPlugin = (config: WebpackConfiguration) => {
				const { rules } = config.module!;
				// @ts-expect-error strange type error on .find
				const cssRule = Array.isArray(rules) && rules.find(rule => rule.use?.[0] === 'css-loader');

				cssRule.use.unshift(MiniCssExtractPlugin.loader);
				config.plugins!.push(new MiniCssExtractPlugin());
			};

			test('minify CSS asset', async () => {
				const built = await build(cssFixture, (config) => {
					configureEsbuildLoader(config);

					config.optimization = {
						minimize: true,
						minimizer: [
							new ESBuildMinifyPlugin({
								css: true,
							}),
						],
					};

					setupMiniCssExtractPlugin(config);
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const file = built.fs.readFileSync('/dist/index.css').toString();
				expect(file.trim()).not.toMatch(/\s{2,}/);
			});

			test('exclude', async () => {
				const built = await build(cssFixture, (config) => {
					configureEsbuildLoader(config);

					config.optimization = {
						minimize: true,
						minimizer: [
							new ESBuildMinifyPlugin({
								css: true,
								exclude: /index\.css$/,
							}),
						],
					};

					setupMiniCssExtractPlugin(config);
				}, webpack);

				expect(built.stats.hasWarnings()).toBe(false);
				expect(built.stats.hasErrors()).toBe(false);

				const file = built.fs.readFileSync('/dist/index.css').toString();
				expect(file.trim()).toMatch(/\s{2,}/);
			});

			test('minify w/ source-map', async () => {
				const built = await build(cssFixture, (config) => {
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

					setupMiniCssExtractPlugin(config);
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

	// describe('Webpack 5', () => {
	// 	test('Stats', async () => {
	// 		const built = await build(fixtures.js, (config) => {
	// 			configureEsbuildLoader(config);

	// 			config.optimization = {
	// 				minimize: true,
	// 				minimizer: [new ESBuildMinifyPlugin()],
	// 			};
	// 		}, webpack5);

	// 		expect(built.stats.hasWarnings()).toBe(false);
	// 		expect(built.stats.hasErrors()).toBe(false);

	// 		expect(built.stats.toString().includes('[minimized]')).toBe(true);
	// 	});

	// 	test('Minifies new assets', async () => {
	// 		const built = await build(fixtures.js, (config) => {
	// 			configureEsbuildLoader(config);

	// 			config.optimization = {
	// 				minimize: true,
	// 				minimizer: [new ESBuildMinifyPlugin()],
	// 			};

	// 			config.plugins.push({
	// 				apply(compiler) {
	// 					compiler.hooks.compilation.tap('test', (compilation) => {
	// 						compilation.hooks.processAssets.tap(
	// 							{ name: 'test' },
	// 							() => {
	// 								compilation.emitAsset(
	// 									'test.js',
	// 									new RawSource('const value = 1;\n\nexport default value;'),
	// 								);
	// 							},
	// 						);
	// 					});
	// 				},
	// 			});
	// 		}, webpack5);

	// 		expect(built.stats.hasWarnings()).toBe(false);
	// 		expect(built.stats.hasErrors()).toBe(false);

	// 		const asset = built.stats.compilation.getAsset('test.js');

	// 		expect(asset.info.minimized).toBe(true);

	// 		const file = built.fs.readFileSync('/dist/test.js', 'utf8');
	// 		expect(file).toBe('const e=1;export default 1;\n');
	// 	});

	// 	test('Doesn\'t minify minimized assets', async () => {
	// 		const sourceAndMap = jest.fn();

	// 		await build(fixtures.js, (config) => {
	// 			config.optimization = {
	// 				minimize: true,
	// 				minimizer: [new ESBuildMinifyPlugin()],
	// 			};

	// 			config.plugins.push({
	// 				apply(compiler) {
	// 					compiler.hooks.compilation.tap('test', (compilation) => {
	// 						compilation.hooks.processAssets.tap(
	// 							{ name: 'test' },
	// 							() => {
	// 								const asset = new RawSource('');

	// 								asset.sourceAndMap = sourceAndMap;

	// 								compilation.emitAsset(
	// 									'test.js',
	// 									asset,
	// 									{ minimized: true },
	// 								);
	// 							},
	// 						);
	// 					});
	// 				},
	// 			});
	// 		}, webpack5);

	// 		expect(sourceAndMap).not.toBeCalled();
	// 	});
	// });
});
