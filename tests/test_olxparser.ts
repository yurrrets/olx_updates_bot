var m = require('../dist/olxparser')


const main = async () => {
    const r = await m.parseOlxPage('https://www.olx.ua/uk/list/q-notebook-dell/?search%5Border%5D=created_at:desc')
    console.log('parse result: ', r)
}

main().then(() => {})