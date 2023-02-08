export const exportFile = (
	name: string,
	code: string,
) => ({
	'/src/index.js': `export { default } from "./${name}"`,
	[`/src/${name}`]: code,
});

const trySyntax = (
	name: string,
	code: string,
) => `
(() => {
	try {
		${code}
		return ${JSON.stringify(name)};
	} catch (error) {
		return error;
	}
})()
`;

export const js = exportFile(
	'js.js',
	`export default [${[
		trySyntax(
			'es2016 - Exponentiation operator',
			'10 ** 4',
		),

		trySyntax(
			'es2017 - Async functions',
			'typeof (async () => {})',
		),

		// trySyntax(
		// 	'es2018 - Asynchronous iteration',
		// 	'for await (let x of []) {}',
		// ),

		trySyntax(
			'es2018 - Spread properties',
			'let x = {...Object}',
		),

		trySyntax(
			'es2018 - Rest properties',
			'let {...x} = Object',
		),

		trySyntax(
			'es2019 - Optional catch binding',
			'try {} catch {}',
		),

		trySyntax(
			'es2020 - Optional chaining',
			'Object?.keys',
		),

		trySyntax(
			'es2020 - Nullish coalescing',
			'Object ?? true',
		),

		trySyntax(
			'es2020 - import.meta',
			'import.meta',
		),

		trySyntax(
			'es2021 - Logical assignment operators',
			'let a = false; a ??= true; a ||= true; a &&= true;',
		),

		trySyntax(
			'es2022 - Class instance fields',
			'(class { x })',
		),

		trySyntax(
			'es2022 - Static class fields',
			'(class { static x })',
		),

		trySyntax(
			'es2022 - Private instance methods',
			'(class { #x() {} })',
		),

		trySyntax(
			'es2022 - Private instance fields',
			'(class { #x })',
		),

		trySyntax(
			'es2022 - Private static methods',
			'(class { static #x() {} })',
		),

		trySyntax(
			'es2022 - Private static fields',
			'(class { static #x })',
		),

		// trySyntax(
		// 	'es2022 - Ergonomic brand checks',
		// 	'(class { #brand; static isC(obj) { return try obj.#brand; } })',
		// ),

		trySyntax(
			'es2022 - Class static blocks',
			'(class { static {} })',
		),

		// trySyntax(
		// 	'esnext - Import assertions',
		// 	'import "x" assert {}',
		// ),

	].join(',')}];`,
);

export const ts = exportFile(
	'ts.ts',
	`
	import type {Type} from 'foo'

	interface Foo {}

	type Foo = number

	declare module 'foo' {}

	enum BasicEnum {
		Left,
		Right,
	}

	enum NamedEnum {
		SomeEnum = 'some-value',
	}

	export const a = BasicEnum.Left;

	export const b = NamedEnum.SomeEnum;

	export default function foo(): string {
		return 'foo'
	}

	// For "ts as tsx" test
	const bar = <T>(value: T) => fn<T>();
	`,
);

export const blank = {
	'/src/index.js': '',
};

export const minification = {
	'/src/index.js': 'export default ( stringVal )  =>  { return stringVal }',
};

export const getHelpers = {
	'/src/index.js': 'export default async () => {}',
};

export const legalComments = {
	'/src/index.js': `
		//! legal comment
		globalCall();
	`,
};

export const css = {
	'/src/index.js': 'import "./styles.css"',
	'/src/styles.css': `
	div {
		color: red;
	}
	span {
		margin: 0px 10px;
	}
	`,
};
