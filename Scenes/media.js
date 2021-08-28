const { Markup, Composer, Scenes } = require('telegraf');
const axios = require('axios');
const cheerio = require('cheerio');
// const fs = require('fs-extra');

const link = 'https://rezka.ag';

let allFilms;
let start;
let end;

const getHTML = async (url) => {
  const { data } = await axios.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.164 YaBrowser/21.6.4.787 Yowser/2.5 Safari/537.36' }});
  return cheerio.load(data);
};

const startStep = new Composer();
startStep.on('callback_query', async (ctx) => {
  try {
    await ctx.reply('Ожидайте...');

    const el = ctx.update.callback_query.data;
    console.log(el);

    console.log('Поехали!');

    const $ = await getHTML(link);

    let generKeyboard = [];
    let geners = [];
    await $('ul.left', `li.b-topnav__item.i${el}`)
      .find('li')
      .each(async (index, element) => {
        const text = $(element).find('a').text();
        const data = $(element).find('a').attr('href');
        geners.push({ text: text, data: data });
      });

    for (let i = 0; i < geners.length; i += 2) {
      if (i + 1 < geners.length) {
        generKeyboard.push([
          Markup.button.callback(geners[i].text, geners[i].data),
          Markup.button.callback(geners[i + 1].text, geners[i + 1].data),
        ]);
      } else {
        generKeyboard.push([Markup.button.callback(geners[i].text, geners[i].data)]);
      }
    }

    await ctx.reply('Выбери жанр:', Markup.inlineKeyboard(generKeyboard));
    await ctx.reply('Что бы начать поиск заново отпраьте команду /restart');

    return ctx.wizard.next();
  } catch (e) {
    console.log(e);
  }
});

const generAndFilterStep = new Composer();
generAndFilterStep.on('callback_query', async (ctx) => {
  try {
    await ctx.reply('Ожидайте...');
    await console.log(ctx.update.callback_query.data);
    const link = ctx.update.callback_query.data;

    const $ = await getHTML(`https://rezka.ag${link}`);

    let filterKeyboard = [];

    await $('li.b-content__main_filters_item', 'ul.b-content__main_filters').each(
      (index, element) => {
        const text = $(element).find('a').text();
        const data = $(element).find('a').attr('href');
        filterKeyboard.push([Markup.button.callback(text, data)]);
      }
    );

    await ctx.reply('Выбери фильтр:', Markup.inlineKeyboard(filterKeyboard));
    await ctx.reply('Что бы начать поиск заново отпраьте команду /restart');

    return ctx.wizard.next();
  } catch (error) {
    await ctx.reply(
      'ничего не найдено. Можете выбрать другой жанр или хотите посмотреть что-нибудь другое ?/nДля того что бы начать поиск заново отправьте команду /restart',
      Markup.keyboard(['/restart']).resize().oneTime()
    );
    console.log(error);
  }
});

const parseStep = new Composer();
parseStep.on('callback_query', async (ctx) => {
  allFilms = [];
  try {
    await ctx.reply('Ожидайте...');

    await console.log(ctx.update.callback_query.data);
    const link = ctx.update.callback_query.data;

    const $ = await getHTML(link);

    await $('div.b-content__inline_item', 'div.b-content__inline_items').each((index, element) => {
      const title = $(element).find('div.b-content__inline_item-link').find('a').text().trim();
      const info = $(element).find('div.b-content__inline_item-link').find('div').text().trim();
      const link = $(element).find('div.b-content__inline_item-link').find('a').attr('href');
      const poster = $(element).find('div.b-content__inline_item-cover > a > img').attr('src');
      allFilms.push({
        title: title,
        info: info,
        link: link,
        poster: poster,
      });
    });

    /* for(let i = 0; i < allFilms.length; i++){
      const page = await getHTML(allFilms[i].link)
      const description = await page('div.b-post__description_text').text().trim();
      allFilms[i]['description'] = description;
      console.log(i);
    } */

    /* fs.writeFile('hd-rezka.json', JSON.stringify(allFilms), function (err) {
      if (err) throw err;
      console.log('файл hd-rezka.json успешно сохранен');
    }); */

    if (allFilms.length <= 3) {
      for (let i = 0; i < allFilms.length; i++) {
        await ctx.replyWithMediaGroup([
          {
            type: 'photo',
            media: allFilms[i].poster,
            caption: `
Название: ${allFilms[i].title}
Инфо: ${allFilms[i].info}
Ссылка: ${allFilms[i].link} 
                `,
          },
        ]);
      }
      await ctx.reply(
        'конец. Для того что бы снова начать поиск отправьте команду /restart',
        Markup.keyboard(['/restart']).resize().oneTime()
      );
    } else {
      start = 0;
      end = 3;
      for (let i = start; i < end; i++) {
        await ctx.replyWithMediaGroup([
          {
            type: 'photo',
            media: allFilms[i].poster,
            caption: `
Название: ${allFilms[i].title}
Инфо: ${allFilms[i].info}
Ссылка: ${allFilms[i].link} 
                `,
          },
        ]);
      }
      start = end;
      end += 3;
      await ctx.reply(
        `
показать ещё?
Для того что бы начать поиск заново отправьте команду /restart
      `,
        Markup.keyboard(['показать ещё']).resize()
      );
    }
    return ctx.wizard.next();
  } catch (error) {
    await ctx.reply(
      'ничего не найдено. Можете выбрать другой фильтр или хотите посмотреть что-нибудь другое ?/nДля того что бы начать поиск заново отправьте команду /restart',
      Markup.keyboard(['/restart']).resize().oneTime()
    );
    console.log(error);
  }
});

const more = new Composer();
more.hears('показать ещё', async (ctx) => {
  try {
    for (let i = start; i < end; i++) {
      await ctx.replyWithMediaGroup([
        {
          type: 'photo',
          media: allFilms[i].poster,
          caption: `
Название: ${allFilms[i].title}
Инфо: ${allFilms[i].info}
Ссылка: ${allFilms[i].link} 
              `,
        },
      ]);
    }
  } catch (error) {
    console.log(error);
  }
  if (end >= allFilms.length - 1) {
    await ctx.reply(
      'конец. Для того что бы начать поиск заново отправьте команду /restart',
      Markup.keyboard(['/restart']).resize().oneTime()
    );
  } else {
    await ctx.reply(`
показать ещё?
Для того что бы начать поиск заново отправьте команду /restart
      `);
  }
  start = end;
  end += 3;
});

const mediaScene = new Scenes.WizardScene(
  'mediaScene',
  startStep,
  generAndFilterStep,
  parseStep,
  more
);
mediaScene.enter(async (ctx) => {
  await ctx.reply(
    'Выберите что хотите смотреть: ',
    Markup.inlineKeyboard([
      [Markup.button.callback('Фильмы', '1')],
      [Markup.button.callback('Сериалы', '2')],
      [Markup.button.callback('Мультфильмы', '3')],
      [Markup.button.callback('Аниме', '5')],
    ])
  );
  await ctx.reply('Для того что бы снова начать поиск отправьте команду /restart')
});

module.exports = mediaScene;
