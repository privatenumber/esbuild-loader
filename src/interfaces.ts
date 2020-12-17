import webpack = require('webpack');
import {Service, TransformOptions} from 'esbuild';
import {Except} from 'type-fest';

export type Compiler = webpack.Compiler & {
	$esbuildService?: Service;
};

type FilterObject = {
	test?: string | RegExp | string[] | RegExp[];
	include?: string | RegExp | string[] | RegExp[];
	exclude?: string | RegExp | string[] | RegExp[];
};

export type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'>;
export type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'> & FilterObject;
