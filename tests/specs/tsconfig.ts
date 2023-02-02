import path from 'path';
import { createRequire } from 'node:module';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { execa } from 'execa';

const webpackCli = path.resolve('node_modules/webpack-cli/bin/cli.js');
const esbuildLoader = path.resolve('dist/index.cjs');

const detectStrictMode = `
(function (isStrict) {
    arguments[0] = false;
    return isStrict;
})(true)
`;

export default testSuite(({ describe }) => {
	describe('tsconfig', ({ describe }) => {
		describe('loader', ({ test }) => {
			test('finds tsconfig.json and applies strict mode', async () => {
				const fixture = await createFixture({
					src: {
						'index.ts': `module.exports = [${detectStrictMode}, require("./strict.ts")];`,
						'strict.ts': `module.exports = ${detectStrictMode}`,
					},
					'webpack.config.js': `
					module.exports = {
						mode: 'production',
	
						optimization: {
							minimize: false,
						},
	
						resolveLoader: {
							alias: {
								'esbuild-loader': ${JSON.stringify(esbuildLoader)},
							},
						},
	
						module: {
							rules: [{
								test: /\\.ts$/,
								loader: 'esbuild-loader',
							}],
						},
	
						entry: './src/index.ts',

						output: {
							libraryTarget: 'commonjs2',
						},
					};
					`,
					'tsconfig.json': JSON.stringify({
						compilerOptions: {
							strict: true,
						},
						include: [
							'src/strict.ts',
						],
					}),
				});

				await execa(webpackCli, {
					cwd: fixture.path,
				});

				const require = createRequire(import.meta.url);
				expect(
					require(path.join(fixture.path, 'dist/main.js')),
				).toStrictEqual([false, true]);

				await fixture.rm();
			});

			test('accepts custom tsconfig.json path', async () => {
				const fixture = await createFixture({
					src: {
						'index.ts': `module.exports = [${detectStrictMode}, require("./strict.ts")];`,
						'strict.ts': `module.exports = ${detectStrictMode}`,
					},
					'webpack.config.js': `
					module.exports = {
						mode: 'production',
	
						optimization: {
							minimize: false,
						},
	
						resolveLoader: {
							alias: {
								'esbuild-loader': ${JSON.stringify(esbuildLoader)},
							},
						},
	
						module: {
							rules: [{
								test: /\\.ts$/,
								loader: 'esbuild-loader',
								options: {
									tsconfig: './tsconfig.custom.json',
								}
							}],
						},
	
						entry: './src/index.ts',

						output: {
							libraryTarget: 'commonjs2',
						},
					};
					`,
					'tsconfig.custom.json': JSON.stringify({
						compilerOptions: {
							strict: true,
						},
						include: [
							'src/strict.ts',
						],
					}),
				});

				await execa(webpackCli, {
					cwd: fixture.path,
				});

				const require = createRequire(import.meta.url);
				expect(
					require(path.join(fixture.path, 'dist/main.js')),
				).toStrictEqual([false, true]);

				await fixture.rm();
			});
		});

		describe('plugin', ({ test }) => {
			/**
			 * Since the plugin applies on distribution assets, it should not apply
			 * any tsconfig settings.
			 */
			test('should not detect tsconfig.json and apply strict mode', async () => {
				const fixture = await createFixture({
					src: {
						'index.js': 'console.log(1)',
					},
					'webpack.config.js': `
					const { EsbuildPlugin } = require(${JSON.stringify(esbuildLoader)});
					module.exports = {
						mode: 'production',
						optimization: {
							minimizer: [
								new EsbuildPlugin(),
							],
						},
						entry: './src/index.js',
					};
					`,
					'tsconfig.json': JSON.stringify({
						compilerOptions: {
							strict: true,
						},
					}),
				});

				await execa(webpackCli, {
					cwd: fixture.path,
				});

				const code = await fixture.readFile('dist/main.js', 'utf8');
				expect(code).not.toMatch('use strict');

				await fixture.rm();
			});
		});
	});
});
