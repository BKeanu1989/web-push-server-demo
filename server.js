// require('dotenv').config()
import dotenv from 'dotenv'
dotenv.config()
// const express = require('express');
// const webpush = require('web-push');
// const bodyparser = require('body-parser');
import express from 'express'
import webpush from 'web-push';
import bodyparser from 'body-parser'
import path from 'path'
import { JsonDB, Config } from 'node-json-db';
// const low = require('lowdb');
// const FileSync = require('lowdb/adapters/FileSync');
// const adapter = new FileSync('.data/db.json');
// const db = low(adapter);
var db = new JsonDB(new Config("myDataBase", true, false, '/'));
const dirname = path.resolve('.')


const vapidDetails = {
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
  subject: process.env.VAPID_SUBJECT
};

// db.defaults({
//   subscriptions: []
// }).write();

try {
    const subscriptions = await db.getData('/subscriptions')
    console.log("🚀 ~ file: server.js ~ line 32 ~ subscriptions", subscriptions)
} catch (error) {
    await db.push("/subscriptions", [], true);
}

function sendNotifications(subscriptions) {
  // TODO
    // Create the notification content.
    const notification = JSON.stringify({
        title: "Hello, Notifications!",
        options: {
          body: `ID: ${Math.floor(Math.random() * 100)}`
        }
      });
      // Customize how the push service should attempt to deliver the push message.
      // And provide authentication information.
      const options = {
        TTL: 10000,
        vapidDetails: vapidDetails
      };
      // Send a push message to each client specified in the subscriptions array.
      subscriptions.forEach(subscription => {
        const endpoint = subscription.endpoint;
        const id = endpoint.substr((endpoint.length - 8), endpoint.length);
        webpush.sendNotification(subscription, notification, options)
          .then(result => {
            console.log(`Endpoint ID: ${id}`);
            console.log(`Result: ${result.statusCode}`);
          })
          .catch(error => {
            console.log(`Endpoint ID: ${id}`);
            console.log(`Error: ${error} `);
          });
      });
}

const app = express();
app.use(bodyparser.json());
app.use(express.static('public'));

app.post('/add-subscription', (request, response) => {
  console.log('/add-subscription');
  console.log(request.body);
  console.log(`Subscribing ${request.body.endpoint}`);
  db.getData('/subscriptions')
    .push(request.body)
    .write();
  response.sendStatus(200);
});

app.post('/remove-subscription', (request, response) => {
  console.log('/remove-subscription');
  console.log(request.body);
  console.log(`Unsubscribing ${request.body.endpoint}`);
  db.getData('/subscriptions')
    .remove({endpoint: request.body.endpoint})
    .write();
  response.sendStatus(200);
});

app.post('/notify-me', (request, response) => {
  console.log('/notify-me');
  console.log(request.body);
  console.log(`Notifying ${request.body.endpoint}`);
  const subscription = 
  db.getData('/subscriptions').find({endpoint: request.body.endpoint}).value();
  console.log("🚀 ~ file: server.js ~ line 96 ~ app.post ~ subscription", subscription)
  sendNotifications([subscription]);
  response.sendStatus(200);
});

app.post('/notify-all', (request, response) => {
  console.log('/notify-all');
  console.log('Notifying all subscribers');
  const subscriptions =
      db.getData('/subscriptions').cloneDeep().value();
  if (subscriptions.length > 0) {
    sendNotifications(subscriptions);
    response.sendStatus(200);
  } else {
    response.sendStatus(409);
  }
  response.sendStatus(200);
});

app.get('/', (request, response) => {
    console.log('dirname', dirname)
    
    //   response.sendFile(path.resolve('.') + '/views/index.html');
  response.sendFile(path.join(dirname, 'views/index.html'));
});

const listener = app.listen(process.env.PORT, () => {
  console.log(`Listening on port http://localhost:${listener.address().port}`);
});
