import {Service, TransformOptions} from 'esbuild';
import {Compiler as Webpack4Compiler} from 'webpack';
import {Except} from 'type-fest';

export type Compiler = Webpack4Compiler & {
	$esbuildService?: Service;
};

export type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'>;
export type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'>;
