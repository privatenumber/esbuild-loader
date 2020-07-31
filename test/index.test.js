const { build } = require('./utils')

test('simple', async () => {

  const stats = await build({
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
  });

  const assets = stats.compilation.assets

  expect(Object.keys(assets)).toMatchInlineSnapshot(`
    Array [
      "index.js",
    ]
  `)
  expect(assets['index.js'].source()).toMatchSnapshot()
})
