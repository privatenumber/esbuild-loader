import {TransformOptions} from 'esbuild';
import {Except} from 'type-fest';

type Filter = string | RegExp;

type LoaderOptions = Except<TransformOptions, 'sourcemap' | 'sourcefile'>;
type MinifyPluginOptions = Except<TransformOptions, 'sourcefile'> & {
	include?: Filter | Filter[];
	exclude?: Filter | Filter[];
	css?: boolean;
};

export {
	LoaderOptions,
	MinifyPluginOptions,
};
