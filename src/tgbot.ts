import TelegramBot from 'node-telegram-bot-api'
import DefaultJobs from './jobs'
const conf = require('../config.json') // leave require, import doesn't work with node 14


class ChatState {
  cmd: "add" | "remove" | "" = ""
  step: number = 0
  data: any = {}
}

export class TgBot {
  bot: TelegramBot = new TelegramBot(conf.telegram.bot_token, {polling: true})
  chat_states: { [chat_id: number]: ChatState; } = { };

  start() {
    this.bot.onText(/^\/start/, this.onMsgStart)
    this.bot.onText(/^\/add/, this.onMsgAdd)
    this.bot.onText(/^\/remove/, this.onMsgRemove)
    this.bot.onText(/^\/list/, this.onMsgList)

    // Listen for any kind of message. There are different kinds of
    // messages.
    this.bot.on('message', this.onMsgAny);

    DefaultJobs.onNewItemFounds = (job, items, isFirstStart) => {
      const header = `[${job.id}] ${job.name}`
      if (isFirstStart) {
        this.bot.sendMessage(job.chat_id, `${header}\nFirst start. Found ${items.length} items. (I won't display 'em all!)`)
      }
      else {
        for (let item of items) {
          this.bot.sendMessage(job.chat_id, `${header}\n${item.name}\n${item.price}\n${item.place} - ${item.date}\n${item.url}`)
        }
      }
    }
  }

  onMsgStart = (msg: TelegramBot.Message) => {
    const helpString = `
      Welcome to Olx update tracking bot!
      /start This message
      /add Add new job
      /remove Remove job with specific id
      /list List all your jobs
    `
    this.bot.sendMessage(msg.chat.id, helpString);
  }

  onMsgAdd = async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    let state = this.chat_states[chatId]
    if (!state) {
      this.chat_states[chatId] = { cmd: "add", step: 0, data: {} }
      state = this.chat_states[chatId]
    }
    
    const msgs = [
      "Enter new job name",
      "Enter Olx url with search query"
    ]
    if (state.step === 0) {
      this.bot.sendMessage(chatId, msgs[0]);
    }
    else if (state.step === 1) {
      if (!msg.text) {
        this.bot.sendMessage(chatId, msgs[0]);
        return
      }
      state.data.name = msg.text
      this.bot.sendMessage(chatId, msgs[1]);
    }
    else if (state.step === 2) {
      if (!msg.text) {
        this.bot.sendMessage(chatId, msgs[1]);
        return
      }
      const url = msg.text
      try {
        const jobId = await DefaultJobs.add(chatId, state.data.name, url)
        delete this.chat_states[chatId]
        this.bot.sendMessage(chatId, `Added job id [${jobId}]`);
      }
      catch (e) {
        this.bot.sendMessage(chatId, ""+e);
      }
    }
    state.step++
  }

  onMsgRemove = async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;
    let state = this.chat_states[chatId]
    if (!state) {
      this.chat_states[chatId] = { cmd: "remove", step: 0, data: {} }
      state = this.chat_states[chatId]
    }

    if (state.step === 0) {
      this.bot.sendMessage(chatId, "Enter job id");
    }
    else if (state.step === 1) {
      const jobId = parseInt(msg.text || "")
      if (isNaN(jobId)) {
        this.bot.sendMessage(chatId, "Error. Invalid job id");
        return
      }
      try {
        await DefaultJobs.remove(chatId, jobId)
        delete this.chat_states[chatId]
        this.bot.sendMessage(chatId, `Removed job id [${jobId}]`);
      }
      catch (e) {
        this.bot.sendMessage(chatId, ""+e);
      }
    }
    state.step++
  }

  onMsgList = async (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id
    const resp = DefaultJobs.list(chatId).map(x => `[${x.id}] ${x.name}\n${x.url}`).join('\n\n')
    this.bot.sendMessage(chatId, resp)
  }

  onMsgAny = (msg: TelegramBot.Message) => {
    const chatId = msg.chat.id;

    if (msg.text && msg.text.startsWith('/')) {
      // command detected, clear state
      delete this.chat_states[chatId]
      return
    }
    
    // redirect to command
    const state = this.chat_states[chatId]
    if (!state) {
      this.onMsgStart(msg)
    }
    else if (state.cmd === "add") {
      this.onMsgAdd(msg)
    }
    else if (state.cmd === "remove") {
      this.onMsgRemove(msg)
    }
  }
}
