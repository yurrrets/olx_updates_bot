import https from 'https'
import queryString, { ParsedQuery } from 'query-string'


export async function sleep(timeoutMs: number) {
  return new Promise((resolve) => {
      setTimeout(() => resolve(undefined), timeoutMs)
  })
}

// Requests

class HttpError extends Error {
  answer?: Buffer
}

export function reqGet(url: string, params: ParsedQuery = {}): Promise<Buffer> {
  const urlJoined = queryString.stringifyUrl({ url, query: params })
  return new Promise((resolve, reject) => {
    let req = https.get(urlJoined, (res) => {
      let buffers: Buffer[] = []

      res.on('data', (d) => {
        buffers.push(d);
      });

      res.on('end', () => {
        const answer = Buffer.concat(buffers)
        if (res.statusCode && res.statusCode >= 400) {
          const err = new HttpError(`${res.statusCode} ${res.statusMessage}`)
          err.answer = answer
          reject(err)
        }
        else {
          resolve(answer)
        }
      })
    });
    req.on('error', reject)
  })
}
