const { Telegraf, Scenes, session, Markup } = require('telegraf');
const { enter, leave } = Scenes.Stage;
const mediaScene = require('./Scenes/media')

require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const stage = new Scenes.Stage([mediaScene]);

bot.use(session());
bot.use(stage.middleware());

bot.start(async(ctx) => {
  await ctx.reply(`
Привет, ${ctx.from.first_name}!

Я помогу найти тебе фильм, мультик или сериальчик, для этого нажми кнопку "начать".
В любой момент ты можешь начать поиск заново, для этого отправь команду /restart.

Удачи! Надеюсь ты найдешь что посмотреть.
  ` ,Markup.keyboard(['начать']).resize().oneTime())
});

bot.hears('начать', async (ctx) => {
    await ctx.scene.enter('mediaScene');
})

bot.command('restart', async (ctx) => {
  await ctx.scene.enter('mediaScene');
})

bot.command('music', async (ctx) => {
  try {
    await ctx.replyWithAudio({url: `https://hitmo1.apporange.space/get/cuts/9d/c5/9dc5fbbc34bf6be58bffa0062db07e77/66751495/Zivert_-_Credo_b128f0d184.mp3`});
  } catch (error) {
    console.log(error);
  }
})

bot.help((ctx) => ctx.reply('Send me a sticker'));
bot.on('sticker', (ctx) => ctx.reply('👍'));
bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.launch();

console.log('Бот запущен!');