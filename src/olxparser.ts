import { reqGet } from "./tools"
import { ElementType, parseDocument } from 'htmlparser2'
import url from 'url'

export type OlxItem = {
  url: string,
  // img?: string, // no sense, most of them are no_thumbnail.15f456ec5.svg images
  name: string,
  price: string,
  place?: string,
  date?: string
}

const equalsOlxItem = (a: OlxItem, b: OlxItem) => {
  if (!a || !b) {
    return false // if both null, also false
  }
  return a.url === b.url && a.name === b.name && a.price === b.price && a.place === b.place && a.date === b.date
}

const parseOlxPage = async (olxurl: string) => {
  let ret: OlxItem[] = []
  let urlObjReq = url.parse(olxurl)
  urlObjReq.query = null

  const respHtml = (await reqGet(olxurl)).toString()
  const dom = parseDocument(respHtml, {
    xmlMode: true,
    withStartIndices: true,
    withEndIndices: true
  })
  // console.log(dom.children)
  const anchorAll = findElements(dom.children, "a")
  for (let anchor of anchorAll) {
    const innerHeader6s = findElements(anchor.children, "h6")
    const innerParagraphs = findElements(anchor.children, "p")
    const innerImgs = findElements(anchor.children, "img")
    if (innerHeader6s.length === 0) {
      continue
    }
    const placeprice: string | undefined = (innerParagraphs.length > 1 && getElementText(innerParagraphs[1])) || undefined
    const placeprice_parts = (placeprice && placeprice.split('-')) || []
    // console.log(anchor.attribs.href, innerImgs[0].attribs.src, getElementText(innerHeader6s[0]), getElementText(innerParagraphs[0]))
    // urlObjReq.pathname = anchor.attribs.href
    ret.push({
      url: `${urlObjReq.protocol}//${urlObjReq.host}${anchor.attribs.href}`,
      // img: innerImgs.length > 0 ? innerImgs[0].attribs.src : undefined,
      name: getElementText(innerHeader6s[0]),
      price: getElementText(innerParagraphs[0]),
      place: placeprice_parts[0] && placeprice_parts[0].trim(),
      date: placeprice_parts[1] && placeprice_parts[1].trim(),
    })
  }

  return ret
}

function getOuterHtml(htmlStr: string, elem: any) {
  return htmlStr.substring(elem.startIndex, elem.endIndex+1)
}

function getElementText(elem: any) {
  let ret: string[] = []
  for (let x of elem.children) {
    if (x.type === ElementType.Text) {
      ret.push(x.data)
    }
  }
  return ret.join('')
}

// problems with types import, so use any
function findElements(elems: any, tagName: string) {
  let ret: any = []
  for (const e of elems) {
    // console.log(e.name, e.type, e instanceof Element)
    if (e.type === ElementType.Tag && e.name.toLowerCase() === tagName.toLowerCase()) {
      ret.push(e)
    }
    if (e.children) {
      const found = findElements(e.children, tagName)
      ret.push(...found)
    }
  }
  return ret
}


export { equalsOlxItem, parseOlxPage }
