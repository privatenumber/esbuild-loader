import path from 'path';
import { testSuite, expect } from 'manten';
import { createFixture } from 'fs-fixture';
import { execa } from 'execa';

const webpackCli = path.resolve('node_modules/webpack-cli/bin/cli.js');
const esbuildLoader = path.resolve('dist/index.cjs');

export default testSuite(({ describe }) => {
	describe('tsconfig', ({ describe }) => {
		describe('loader', ({ test }) => {
			test('finds tsconfig.json and applies strict mode', async () => {
				const fixture = await createFixture({
					src: {
						'index.ts': 'console.log(1)',
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
				expect(code).toMatch('use strict');

				await fixture.rm();
			});
		});

		describe('plugin', ({ test }) => {
			test('finds tsconfig.json and applies strict mode', async () => {
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
				expect(code).toMatch('use strict');

				await fixture.rm();
			});
		});
	});
});
