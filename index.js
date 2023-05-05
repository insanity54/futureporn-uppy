#!/usr/bin/env node

import dotenv from 'dotenv'
dotenv.config()
import express from 'express'
import bodyParser from 'body-parser'
import session from 'express-session'
import companion from '@uppy/companion'
import cuid from '@bugsnag/cuid'
import $MemoryStore from 'memorystore'
import cors from 'cors'
import jwt from 'jsonwebtoken'



const appEnv = new Array(
  'SESSION_SECRET',
  'PORT',
  'FILEPATH',
  'UPLOAD_URLS',
  'SECRET',
  'B2_KEY',
  'B2_SECRET',
  'B2_BUCKET',
  'B2_ENDPOINT',
  'DRIVE_KEY',
  'DRIVE_SECRET',
  'DROPBOX_KEY',
  'DROPBOX_SECRET',
  'JWT_SECRET',
)

const appContext = {
  env: appEnv.reduce((acc, ev) => {
    if (typeof process.env[ev] === 'undefined') throw new Error(`${ev} is undefined in env`);
    acc[ev] = process.env[ev];
    return acc;
  }, {})
};

const isDev = process.env.NODE_ENV !== 'production'

const MemoryStore = $MemoryStore(session)


const corsOptions = {
  origin: isDev ? 'http://localhost:8080' : 'https://futureporn.net',
  methods: ['POST','OPTIONS'],
  allowedHeaders: ['Authorization', 'X-Easter-Egg', 'Content-Type', 'Uppy-Versions', 'Accept'],
  exposedHeaders: ['Access-Control-Allow-Headers']
}


const app = express();
app.use(cors(corsOptions))
app.use(bodyParser.json())
app.use(
  session({
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    resave: false,
  })
)

function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
}


const config = {
  debug: true,
  secret: process.env.SECRET,
  filePath: process.env.FILEPATH,
  server: {
    host: process.env.HOST
  },
  uploadUrls: process.env.UPLOAD_URLS,
  s3: {
    key: process.env.B2_KEY,
    secret: process.env.B2_SECRET,
    bucket: process.env.B2_BUCKET,
    endpoint: process.env.B2_ENDPOINT,
  },
  providerOptions: {
    drive: {
      key: process.env.DRIVE_KEY,
      secret: process.env.DRIVE_SECRET,
    },
    dropbox: {
      key: process.env.DROPBOX_KEY,
      secret: process.env.DROPBOX_SECRET,
    },
  }
}


const { emitter, app: companionApp } = companion.app(config);
const copyPasta = 'Hello 👋 everyone 👥! I’m Scott 👦, President 🇺🇸 of Dominos Pizza 🍕. Have you 👉🏻 heard 👂💌 of Hatsune Miku? Today 📅 I 👁 would like 💖 to announce 📣 a new 👌 collaborative project 🎢 featuring 🙃 Hatsune Miku: Dominos App 💰 Featuring 🎥 Hatsune Miku. Hatsune Miku exists 💁 in a software 💻🚨 called 📞 volaloid. Vocaloid enables 😺 you 👈 to produce 🏭 songs 🎶. A character 🔣 named 📛 Hatsune Miku sings 🎶🎤 the songs 🎶🎷 you 👉 create 💯. A great 👍🏻 feature 🧠 is you 👉 can create 😮 songs 🎵🎶 as you 👉 like 💖. I 👁👈 knew 👓 our talented 😍 Dominos Pizza 🍕 crew 🚢 could work 🏢 together 👥 and create 💯 great 👍🏼👌🏼 vocaloid songs 🎶. Bokorpe, Eshi, Chokyoshi, Futusekeshi, everyone 👥! Amazing ❤🧡💛 vocaloid songs 🗣🎼🎤 have been created 💯 with the fantastic 😴 imagination 💭 of the crews 🚢 from all 💯 over 🔁 Japan 🇯🇵. The challenge 💰 was successfully 👍 carried 💪🏿 out, and this new 👌 collaborative app 💰 was produced 🌚🌝. Based ❌👨‍❤️‍👨 on 🔛 Miku’s image 🖼🚫, the Dominos app 💰 changes 🚼📈 its appearance 🔎. A lot 🍑 of music 🎙🎵 and illustrations ✏ produced 🎧🎬 by Dominos crew 🚢 are here. From the menu 📝 to the order 📲🅰🅱, it looks 👀 very 👌 cute 😏; just like 😄 Miku. Once your 👉 pizza’s delivered 👄, have some fun 😂 with Miku! It comes 🚌 with a social 👥 camera 📸 function ⚙⛓, and you 👈 can take 💅 various 🤓🧐 poses 😡😩👋🏻, pictures 📸📷👀 of Miku: Very 👌 cool 😎. And last 😍, but 🍑 not least 💯🔥, the live 🐙 performance 🅱! Start 🆕 the pizza 🍕 stage 4️⃣💖 live 😩 and point 🈯 the camera 📸 towards 😂 the pizza 🍕 box 📦, and the pizza 🍕 box 📦 will turn 🔄 into a live 🐙 dancing 💃🏻 venue. A live 😩 performance 🅱 of Love ❤ for Night 🌚 produced ☝ by Dominos crew 👬! Here we go 🏃👳! Miku sings 🎶! Let’s enjoy 😂 the rest 💤 of the performance 🅱, with the app 💰!'

app.get('/ee', verifyToken, function (req, res) {
  res.send(copyPasta)
})

app.use(verifyToken, companionApp);



emitter.on('upload-start', ({ token }) => {
    console.log('Upload started', token);
    function onUploadEvent({ action, payload }) {
        if (action === 'success') {
            emitter.off(token, onUploadEvent); // avoid listener leak
            console.log('Upload finished', token, payload.url);
        } else if (action === 'error') {
            emitter.off(token, onUploadEvent); // avoid listener leak
            console.error('Upload failed', payload);
        }
    }
    emitter.on(token, onUploadEvent);
});

const server = app.listen(process.env.PORT)

companion.socket(server)


