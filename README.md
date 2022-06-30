# olx_updates_bot
Finds updates on olx search page and sends message to telegram

##Setup
- Clone this repo
- Don't forget to run "npm install"
- Copy "config.json.sample" to "config.json". Fill parameters

##Notes
When adding url to Olx search page, use
- Desktop urls (olx.ua, not m.olx.ua). Mobile urls were not even tried
- Because only first page of olx results is used, it's better to use "the newest" ordering

Example of olx query:
https://www.olx.ua/d/uk/list/q-notebook-dell/?search%5Border%5D=created_at:desc