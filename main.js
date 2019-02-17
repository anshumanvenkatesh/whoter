require('dotenv').config();
const OAuth = require('oauth');
const {
  exec
} = require('child_process');
const http = require('http');
const routes = require("./routes");

const CONSUMER_KEY = process.env.CONSUMER_KEY;
const CONSUMER_SECRET = process.env.CONSUMER_SECRET;

const TOKEN_URL = '/oauth/token';
const AUTHORIZE_URL = '/oauth/authorize';
const MY_CALLBACK_URL = process.env.LOCAL_CALLBACK || 'https://whoter.herokuapp.com/callback';
const BASE_SITE = 'https://www.splitwise.com';

let authURL;
// Random change
const client = new OAuth.OAuth2(
  CONSUMER_KEY,
  CONSUMER_SECRET,
  BASE_SITE,
  AUTHORIZE_URL,
  TOKEN_URL,
  null
);
const server = http.createServer(function (req, res) {
  console.log("At the server base");
  const p = req.url.split('/');
  const pLen = p.length;
  if (pLen === 2 && p[1] === '') {
    routes.basepage(req, res, client);
  } else if (pLen === 2 && p[1].indexOf('callback') === 0) {
    routes.callback(req, res, client);
  } else if (pLen === 2 && p[1] === 'check') {
    routes.check(req, res, client);
  } else {
    console.log('Unhandled URL');
    res.end("Hello")
    // Unhandled url
  }
});

const PORT = process.env.PORT || 8080;
server.listen({
  port: PORT
}, serverReady);

function serverReady() {
  console.log(`Server on port ${server.address().port} is now up`);
  exec(`open http://localhost:${PORT}/`, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

module.exports = client;