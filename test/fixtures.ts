export const js = {
	'/index.js': `
		import Foo from './foo.js'
		import Bar from './bar.js'
		console.log(Foo)
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

export const ts = {
	'/index.js': `
		import usePrevious from './use-previous.ts'
		console.log(usePrevious)
	`,

	'/use-previous.ts': `
	class Foo { foo }

	const usePrevious = <T>(value: T) => {
		const ref = useRef<T>();
		useEffect(() => {
			ref.current = value;
		});
		return ref.current;
	};

	export default usePrevious;
	`,
};

export const tsx = {
	'/index.js': `
		import Foo from './foo.tsx'
		console.log(Foo)
	`,

	'/foo.tsx': `

	const HelloWorld = <><div>hello world</div></>;
	console.log(HelloWorld);

	export default class Foo {
		render() {
			return <div className="hehe">hello there!!!</div>
		}
	}
	`,
};

export const invalidTsx = {
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

export const target = {
	'/index.js': `
		// es2016
		console.log(10 ** 4)

		// es2017
		async () => {}

		// 2018
		const y = { a: 1 };
		let x = {...y}
		let {...z} = y
	`,
};

export const webpackChunks = {
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
