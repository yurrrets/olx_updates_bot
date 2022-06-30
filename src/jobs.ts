import { equalsOlxItem, OlxItem, parseOlxPage } from './olxparser'
import { Storage } from './storage'
import { sleep } from './tools'

interface Job {
  id: number,
  chat_id: number, // tg chat id
  name: string,    // job name 
  url: string      // olx url
}

const MaxJobsPerChatId = 5

class JobsData {
  jobs: Job[] = []
  last_id = 1
}

class Jobs {
  jobs_storage = new Storage("jobs")
  jobs_data = new JobsData()

  onNewItemFounds: ((job: Job, olxItems: OlxItem[], isFirstStart: boolean) => void) | null = null

  async start() {
    try{
      const jobs_data = await this.jobs_storage.load()
      this.jobs_data = jobs_data || this.jobs_data
    } catch(e) { }
    console.log(this.jobs_data)

    for (let job of this.jobs_data.jobs) {
      this._start_job(job.id)
    }
  }

  async add(chat_id: number, name: string, url: string) {
    const job_cnt = this.jobs_data.jobs.filter(x => (x.chat_id === chat_id)).length
    if (job_cnt+1 > MaxJobsPerChatId) {
      throw new Error(`Max limit of jobs reached (${job_cnt}/${MaxJobsPerChatId}). Delete another job before adding this one`)
    }
    const job = {id: this.jobs_data.last_id, chat_id, name, url}
    this.jobs_data.jobs.push(job)
    this.jobs_data.last_id++
    await this.jobs_storage.save(this.jobs_data)

    this._start_job(job.id)
    return job.id
  }

  async remove(chat_id: number, id: number) {
    const job = this.jobs_data.jobs.find(x => x.chat_id === chat_id && x.id === id)
    if (!job) {
      throw new Error("Can't find job with specified id")
    }
    const idx = this.jobs_data.jobs.indexOf(job)
    if (idx > -1) { // should always be true
      this.jobs_data.jobs.splice(idx, 1); // remove one item only
      await this.jobs_storage.save(this.jobs_data)
    }
  }

  list(chat_id: number) {
    return this.jobs_data.jobs.filter(x => x.chat_id == chat_id)
  }

  _start_job = async (id: number) => {
    const job = this.jobs_data.jobs.find(x => x.id === id)
    if (!job) {
      return
    }

    try {
      const olxAnsw = await parseOlxPage(job.url)
      const job_storage = new Storage(`job_${id}`)
      let trackNewItems = true
      
      const storageContent = await job_storage.load()
      if (storageContent === undefined) {
        trackNewItems = false // new job - all items will be new
      }
      const prevOlxAnsw: OlxItem[] = storageContent || []

      // find new items
      let newItems: OlxItem[] = []
      for (let item of olxAnsw) {
        const prevItem = prevOlxAnsw.find(x => { return equalsOlxItem(item, x)})
        if (prevItem) {
          continue
        }
        newItems.push(item)
      }
      // add them to list and fire events
      if (newItems.length) {
        prevOlxAnsw.push(...newItems)
        await job_storage.save(prevOlxAnsw)
      }

      if (this.onNewItemFounds) {
        this.onNewItemFounds(job, newItems, !trackNewItems)
      }
    }
    catch(e) {
      console.log(`Error running job id ${job.id}.` + e)
    }

    sleep(60 * 1000).then(() => { this._start_job(id) })
  }
}

const DefaultJobs = new Jobs()

export default DefaultJobs