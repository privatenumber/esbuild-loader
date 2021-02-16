const js = {
	'/index.js': `
		export * from './foo.js'
	`,

	'/foo.js': `
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

		export const esnext = (() => {
			let a;
			return [
				class { x = 2; },
				class { static x = 1; },
				class { #x() {} },
				class { #x },
				class { static #x() {} },
				class { static #x },
				a ??= 2,
			];
		})();
	`,
};

const ts = {
	'/index.js': `
		import { foo } from './foo.ts'
		export default foo()
	`,

	'/foo.ts': `
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
	'/index.js': `
		export { default } from './foo.ts'
	`,

	'/foo.ts': `
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
	'/index.js': `
		export { default } from './foo.ts'
	`,

	'/foo.ts': `
		export default () => <a>1</a>/g
	`,
};

const tsx = {
	'/index.js': `
		import Foo, { HelloWorld } from './foo.tsx'
		export default [
			HelloWorld,
			(new Foo()).render(),
		];
	`,

	'/foo.tsx': `
		export const HelloWorld = <><div>hello world</div></>;

		export default class Foo {
			render() {
				return <div className="class-name">content</div>
			}
		}
	`,
};

const tsxAmbiguous = {
	'/index.js': `
		export { default } from './foo.tsx'
	`,

	'/foo.tsx': `
		export default () => <a>1</a>/g
	`,
};

const invalidTsx = {
	'/index.js': `
		import usePrevious from './use-previous.tsx'
		console.log(usePrevious)
	`,

	'/use-previous.tsx': `
		const usePrevious = <T><INVALID TSX>(value: T) => {
			const ref = useRef<T><asdf>();
			return ref.current;
		};

		export default usePrevious;
	`,
};

const tsConfig = {
	'/index.js': `
		export { default } from './foo.ts'
	`,
	'/foo.ts': `
		export default class A { a }
	`,
};

const webpackChunks = {
	'/index.js': `
		const Foo = import(/* webpackChunkName: "named-chunk-foo" */'./foo.js')
		const Bar = import(/* webpackChunkName: "named-chunk-bar" */'./bar.js')

		Foo.then(console.log)
	`,

	'/foo.js': `
	console.log('foo');
	export default 1;
	`,

	'/bar.js': `
	console.log('bar' + 1);
	export default Symbol('bar');
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
};
