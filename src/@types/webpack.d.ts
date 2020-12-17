
declare module 'webpack/lib/ModuleFilenameHelpers' {
	type FilterObject = {
		test?: string | RegExp | string[] | RegExp[];
		include?: string | RegExp | string[] | RegExp[];
		exclude?: string | RegExp | string[] | RegExp[];
	};

	export const matchObject: (filterObject: FilterObject, stringToCheck: string) => boolean;
}
