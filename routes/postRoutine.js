var fetch = require('node-fetch');

const post = (text) => {
  fetch('https://hooks.slack.com/services/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', {
    method: 'POST',
    headers: {
        'Content-type': 'application/json'
    },
    body: JSON.stringify({text})
});
}

module.exports = post;
