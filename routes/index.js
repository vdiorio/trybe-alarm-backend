var express = require('express');
var router = express.Router();
const crypto = require('crypto');
require('dotenv').config()
const fs = require('fs/promises');
const postRoutine = require('./postRoutine');
const path = require('path');
const axios = require('axios').default;

requestConfig = {
  method: 'Get',
  url: ''
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Trybe Alarm Generator' });
});

const regex = /(\[\*] |)\d{2}h(\d{2}|)\sàs \d{2}h(\d{2}|).+/g;

router.get('/app', async (req, res, _next) => {
  const { turma, tribo } = req.query
  try {
    const data = JSON.parse(await fs.readFile(path.join(__dirname, `agendas/data${turma.toLowerCase()}${tribo.toLowerCase()}.json`), (err) => {
      if (err) return true
      }));
    return res.status(200).json(data || { message: 'Calma tryber! Ainda não postaram as agendas de hoje, volte daqui a pouco' });
  } catch (e) {
    return res.status(200).json({ message: 'Turma inexistente!' });
  }
})

router.post('/app', async function(req, res, _next) {
  try {
    const { challenge } = req.body;
    if (challenge) return res.status(200).json({challenge});
    const { event: { blocks, channel }, token } = req.body;
    const name= (await axios.get(`https://slack.com/api/conversations.info?channel=${channel}&pretty=1`, {
      headers: {'Authorization': process.env.APP_TOKEN},
    })).data.channel.name.replace('sd-', '');
    const [turma, tribo] = name.split('-tribo-');
    await fs.writeFile(path.join(__dirname, `agendas/data${turma}${tribo}.json`), JSON.stringify(req.body), (err) => {
      if (err) throw err;
      });
    if (false && Math.abs(new Date().getTime() / 1000) - timestamps > 60 * 5) return res.status(408).json({ message: 'Request Timeout' });
    if (token !== process.env.SLACK_TOKEN) return res.status(401).json({message: 'Wrong token'});
    if (!blocks[0].elements) return res.status(400).json({ message: 'Wrong format!' })
    const elements = blocks[0].elements.map((e) => e.elements).filter(a => a[0].text.match(regex))[0]
    .filter((m) => m.style).filter(m => m.type !== 'emoji').filter(m => !m.style.italic);
    const agenda = elements.reduce((a, c) => {
      const newArr = a;
      const text = (c.text.startsWith(' ') ? c.text.substring(1) : c.text);
      const filteredText = text.endsWith(' ') ? text : text + ' '
      if (c.text.match(regex) || filteredText.startsWith('[*]')) {
        newArr[a.length] = [filteredText + []];
        return newArr;
      }
      if (c.type === 'link') {
        newArr[a.length - 1].push({ url: c.url, text: filteredText.slice(0, -1) });
      } else {
        newArr[a.length - 1].push(filteredText);
      }
      return newArr;
    }, []);
    const extensionFormat = agenda.map((ev) => {
      return ev.reduce((a, c, i) => {
        const { url } = c
        if (i === 0) return { ...a, schedule: c };
        if (c.text) {
          if (c.text === 'Zoom') return { ...a, zoomLink: url }
          if (c.text === 'Forms de Feedback Diário') return { schedule: a.schedule + c.text, formLink: url }
        }
        return a
      }, {})
    })
    const data = JSON.stringify(extensionFormat)
    await fs.writeFile(path.join(__dirname, `agendas/data${turma}${tribo}.json`), data, (err) => {
      if (err) throw err;
      });
    // postRoutine('Os alarmes ja foram atualizados! entre nesse link e não perca nenhum momento: http://localhost:3000');
    return res.status(201).json(extensionFormat);
  } catch (e) {
    return res.status(500).json({ message: e.message + ' writing file' });
  }
})

module.exports = router;
