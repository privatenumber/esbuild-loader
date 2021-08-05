// These files cannot be at the root and must be in a directory
// Webpack v4 uses the directory name for the entry variable
// https://github.com/webpack/webpack/blob/v4.46.0/lib/optimize/ConcatenatedModule.js#L1048

const js = {
	'/src/index.js': `
		export * from './foo.js'
	`,

	'/src/foo.js': `
		export const es2016 = 10 ** 4;

		export const es2017 = typeof (async () => {});

		export const es2018 = (() => {
			const y = { a: 1 }
			let x = {...y}
			let {...z} = y
			return z;
		})();

		export const es2019 = (() => {
			try {
				return 'try'
			} catch {}
		})();

		export const es2020 = (() => {
			const obj = {
				property: 1,
			};
			return [
				obj?.property,
				obj.prop ?? 2,
				import.meta,
			];
		})();

		export const es2021 = (() => {
			let a;
			let x = 0;
			const y = 3;
			return [
				a ??= 2,
				x ||= y,
			];
		})();

		export const esnext = (() => {
			class PrivateStatic {
				static #x() {}
			}
			return [
				class { x = 2; },
				class { static x = 1; },
				class { #x() {} },
				class { #x },
				class { static #x },
				1_000_000_000,
			];
		})();
	`,
};

const ts = {
	'/src/index.js': `
		import { foo } from './foo.ts'
		export default foo()
	`,

	'/src/foo.ts': `
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

		export function foo(): string {
			return 'foo'
		}

		// For "ts as tsx" test
		const bar = <T>(value: T) => fn<T>();
	`,
};

const ts2 = {
	'/src/index.js': `
		export { default } from './foo.ts'
	`,

	'/src/foo.ts': `
		const testFn = <V>(
			l: obj,
			options: { [key in obj]: V },
		): V => {
			return options[l];
		};

		export default testFn;
	`,
};

const tsAmbiguous = {
	'/src/index.js': `
		export { default } from './foo.ts'
	`,

	'/src/foo.ts': `
		export default () => <a>1</a>/g
	`,
};

const tsx = {
	'/src/index.js': `
		import Foo, { HelloWorld } from './foo.tsx'
		export default [
			HelloWorld,
			(new Foo()).render(),
		];
	`,

	'/src/foo.tsx': `
		export const HelloWorld = <><div>hello world</div></>;

		export default class Foo {
			render() {
				return <div className="class-name">content</div>
			}
		}
	`,
};

const tsxAmbiguous = {
	'/src/index.js': `
		export { default } from './foo.tsx'
	`,

	'/src/foo.tsx': `
		export default () => <a>1</a>/g
	`,
};

const invalidTsx = {
	'/src/index.js': `
		import usePrevious from './use-previous.tsx'
		console.log(usePrevious)
	`,

	'/src/use-previous.tsx': `
		const usePrevious = <T><INVALID TSX>(value: T) => {
			const ref = useRef<T><asdf>();
			return ref.current;
		};

		export default usePrevious;
	`,
};

const tsConfig = {
	'/src/index.js': `
		export { default } from './foo.ts'
	`,
	'/src/foo.ts': `
		export default class A { a }
	`,
};

const webpackChunks = {
	'/src/index.js': `
		const Foo = import(/* webpackChunkName: "named-chunk-foo" */'./foo.js')
		const Bar = import(/* webpackChunkName: "named-chunk-bar" */'./bar.js')

		Foo.then(console.log)
	`,

	'/src/foo.js': `
	console.log('foo');
	export default 1;
	`,

	'/src/bar.js': `
	console.log('bar' + 1);
	export default Symbol('bar');
	`,
};

const css = {
	'/src/index.js': `
		import './styles.css';
	`,

	'/src/styles.css': `
	div {
		color: red;
	}

	span {
		margin: 0px 10px;
	}
	`,
};

const legalComments = {
	'/src/index.js': `
		//! legal comment
		globalCall();
	`,
};

export {
	js,
	ts,
	ts2,
	tsAmbiguous,
	tsx,
	tsxAmbiguous,
	invalidTsx,
	tsConfig,
	webpackChunks,
	css,
	legalComments,
};
