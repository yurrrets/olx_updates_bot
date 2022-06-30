import { TgBot } from './tgbot'
import DefaultJobs from './jobs'

// const doWork = async () => {
//   const url = "https://www.olx.ua/d/uk/elektronika/tehnika-dlya-kuhni/kiev/q-%D0%BF%D0%BB%D0%B8%D1%82%D0%B0-%D0%B3%D0%B0%D0%B7%D0%BE%D0%B2%D0%B0/?currency=UAH&search%5Border%5D=created_at:desc&search%5Bfilter_float_price:from%5D=500&search%5Bfilter_float_price:to%5D=2000"
//   console.log("making request to", url)
//   const olxAnsw = await parseOlxPage(url)
//   console.log(olxAnsw)
// }

const main = async () => {
  await DefaultJobs.start()

  const tgbot = new TgBot()
  tgbot.start()
}

// main()

export {main}