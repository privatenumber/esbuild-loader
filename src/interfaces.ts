import webpack = require('webpack');
import {Service, TransformOptions} from 'esbuild';
import {Except} from 'type-fest';

export type Compiler = webpack.Compiler & {
	$esbuildService?: Service;
};

type Filter = string | RegExp;
type FilterObject = {
	include?: Filter | Filter[];
	exclude?: Filter | Filter[];
};

export type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'>;
export type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'> & FilterObject;
