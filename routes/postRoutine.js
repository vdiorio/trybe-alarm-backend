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
