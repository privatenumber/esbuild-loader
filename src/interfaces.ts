import {Service, TransformOptions} from 'esbuild';
import {Compiler as Webpack4Compiler} from 'webpack';

export type Compiler = Webpack4Compiler & {
	$esbuildService?: Service;
}
export type LoaderOptions = Omit<TransformOptions, 'sourcemap' | 'sourcefile'>;
export type MinifyPluginOptions = Omit<TransformOptions, 'sourcefile'>;
