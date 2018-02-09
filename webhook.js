'use strict';
const PAGE_ACCESS_TOKEN = 'EAACVTPoAOugBALoWsDbwcsKriQ7OZCZB3oEBFVifUcPFb6qdSCKEv3kj2v0ZCxlhBrUFQqYCC3kwJoiiDcUpdMxWujf1S3vZCo5syZA6XgaiX5oae3jbRZA4YvYup5qsE51D3YT8t07b8KJIoKnefhN3dVcbq6wCNXLoZCJxcLMutWoP7iwZAnAX';
const APIAI_TOKEN = 'fce048ad237d4b259467e727a28933d8';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const apiai = require('apiai');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

const apiaiApp = apiai(APIAI_TOKEN);

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'token123') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

 function sendMessage1(event) {
   let sender = event.sender.id;
   let text = event.message.text;

   console.log('*** RECEIVED ***');
   console.log(event);

   request({
     url: 'https://graph.facebook.com/v2.6/me/messages',
     qs: {access_token: PAGE_ACCESS_TOKEN},
     method: 'POST',
     json: {
       recipient: {id: sender},
       message: {text: text}
     }
   }, function (error, response) {
     if (error) {
         console.log('Error sending message: ', error);
     } else if (response.body.error) {
         console.log('Error: ', response.body.error);
     }
   });
 }


/* GET query from API.ai */

function sendMessage(event) {
  let sender = event.sender.id;
  let text = event.message.text;

  let apiai = apiaiApp.textRequest(text, {
    sessionId: 'tabby_cat'
  });

  apiai.on('response', (response) => {
    console.log(response)
    let aiText = response.result.fulfillment.speech;

    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: sender},
        message: {text: aiText}
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
  });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
});
