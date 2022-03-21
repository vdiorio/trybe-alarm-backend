var express = require('express');
var router = express.Router();
const crypto = require('crypto');
require('dotenv').config()
const fs = require('fs/promises');
const postRoutine = require('./postRoutine');
const path = require('path');

console.log();

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
      console.log('The "data to append" was appended to file!');
      }));
    return res.status(200).json(data || { message: 'Calma tryber! Ainda não postaram as agendas de hoje, volte daqui a pouco' });
  } catch (e) {
    return res.status(200).json({ message: 'Turma inexistente!' });
  }
})

router.post('/app', async function(req, res, _next) {
  try {
    const { challenge } = req.body;
    console.log(challenge);
    if (challenge) return res.status(200).json({challenge});
    const { event: {blocks} } = req.body;
    const timestamps = req.headers['x-slack-request-timestamp'];
    const SLACK_SIGNATURE = req.headers['x-slack-signature']
    if (false && Math.abs(new Date().getTime() / 1000) - timestamps > 60 * 5) return res.status(408).json({ message: 'Request Timeout' });
    const signature = 'v0:' + timestamps + ':' + JSON.stringify(req.body);
    const key = 'v0=' + crypto.createHmac('sha256', process.env.SLACK_SECRET).update(signature).digest("hex");
    if (SLACK_SIGNATURE !== SLACK_SIGNATURE) return res.status(401).json({key: req.body});
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
    const data = JSON.stringify({agenda})
    await fs.writeFile(path.join(__dirname, 'agendas/data15a.json'), data, (err) => {
      if (err) throw err;
      console.log(err.message);
      });
    // postRoutine('Os alarmes ja foram atualizados! entre nesse link e não perca nenhum momento: http://localhost:3000')
    return res.status(201).json({agenda});
  } catch (e) {
    return res.status(500).json({ message: e.message + ' writing file' });
  }
})

module.exports = router;
