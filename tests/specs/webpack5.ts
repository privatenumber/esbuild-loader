import { testSuite, expect } from 'manten';
import { build } from 'webpack-test-utils';
import webpack5 from 'webpack5';
import { configureEsbuildMinifyPlugin } from '../utils';

const { RawSource } = webpack5.sources;

export default testSuite(({ describe }) => {
	describe('Webpack 5', ({ test }) => {
		test('Stats', async () => {
			const built = await build({ '/src/index.js': '' }, (config) => {
				configureEsbuildMinifyPlugin(config);
			}, webpack5);

			expect(built.stats.hasWarnings()).toBe(false);
			expect(built.stats.hasErrors()).toBe(false);
			expect(built.stats.toString().includes('[minimized]')).toBe(true);
		});

		test('Minifies new assets', async () => {
			const built = await build({ '/src/index.js': '' }, (config) => {
				configureEsbuildMinifyPlugin(config);

				config.plugins!.push({
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
			expect(asset!.info.minimized).toBe(true);

			const file = built.fs.readFileSync('/dist/test.js', 'utf8');
			expect(file).toBe('const e=1;export default 1;\n');
		});

		test('Doesnt minify minimized assets', async () => {
			let sourceAndMapCalled = false;
			await build({ '/src/index.js': '' }, (config) => {
				configureEsbuildMinifyPlugin(config);

				config.plugins!.push({
					apply(compiler) {
						compiler.hooks.compilation.tap('test', (compilation) => {
							compilation.hooks.processAssets.tap(
								{ name: 'test' },
								() => {
									const asset = new RawSource('');

									// @ts-expect-error overwriting to make sure it's not called
									asset.sourceAndMap = () => {
										sourceAndMapCalled = true;
									};

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

			expect(sourceAndMapCalled).toBe(false);
		});
	});
});
