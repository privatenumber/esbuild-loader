const js = {
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

const tsx = {
	'/index.js': `
    import Foo from './foo.tsx'
    console.log(Foo)
  `,

	'/foo.tsx': `
  export default class Foo {
    render() {
      return <div className="hehe">hello there!!!</div>
    }
  }
  `,
};

const target = {
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

module.exports = {
	js,
	tsx,
	target,
	webpackChunks,
};
