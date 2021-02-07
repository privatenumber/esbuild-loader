import {Service, TransformOptions} from 'esbuild';
import {Except} from 'type-fest';
import webpack from 'webpack';

type Compiler = webpack.Compiler & {
	$esbuildService?: Service;
};

type Filter = string | RegExp;
type FilterObject = {
	include?: Filter | Filter[];
	exclude?: Filter | Filter[];
};

type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'>;
type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'> & FilterObject;

export {
	Compiler,
	LoaderOptions,
	MinifyPluginOptions,
};
