import { getTsconfig } from 'get-tsconfig';
import type { TransformOptions } from 'esbuild';

const foundTsconfig = getTsconfig();

export const tsconfig = foundTsconfig?.config as (TransformOptions['tsconfigRaw'] | undefined);
