import {TransformOptions} from 'esbuild';
import {Except} from 'type-fest';

type Filter = string | RegExp;
type FilterObject = {
	include?: Filter | Filter[];
	exclude?: Filter | Filter[];
};

type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'>;
type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'> & FilterObject;

export {
	LoaderOptions,
	MinifyPluginOptions,
};
