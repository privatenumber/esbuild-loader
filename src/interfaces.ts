import webpack = require('webpack');
import {Service, TransformOptions} from 'esbuild';
import {Except} from 'type-fest';

export type Compiler = webpack.Compiler & {
	$esbuildService?: Service;
};

export type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'>;
export type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'>;
