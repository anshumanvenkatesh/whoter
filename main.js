const OAuth = require('oauth')
const {
  exec
} = require('child_process')
const qs = require('querystring')
const http = require('http')

const CONSUMER_KEY = "nYehhQF2rj8cFPdkmaCdvrplaBmc4DbXC6UhzLIr"
const CONSUMER_SECRET = "LEenXq5mpjP9MzrEMGDWqVQAg61PLYuSdw9hRxBY"

const TOKEN_URL = '/oauth/token'
const AUTHORIZE_URL = '/oauth/authorize'
const MY_CALLBACK_URL = 'http://localhost:8080/callback'
const BASE_SITE = 'https://www.splitwise.com'

var authURL;

const client = new OAuth.OAuth2(
  CONSUMER_KEY,
  CONSUMER_SECRET,
  BASE_SITE,
  AUTHORIZE_URL,
  TOKEN_URL,
  null
)

const server = http.createServer(function (req, res) {
  console.log(req.url);
  var p = req.url.split('/');
  console.log("p: ", p);
  console.log('at the base');

  var pLen = p.length;

  authURL = client.getAuthorizeUrl({
    redirect_uri: MY_CALLBACK_URL,
    response_type: 'code'
  });

  if (pLen === 2 && p[1] === '') {
    basepage(req, res);
  } else if (pLen === 2 && p[1].indexOf('callback') === 0) {
    callback(req, res)

  } else {
    console.log('Unhandled URL');
    res.end("Hello")
    // Unhandled url
  }
});
server.listen({
  port: 8080
}, serverReady);

function serverReady() {
  console.log(`Server on port ${server.address().port} is now up`);
  exec(`open http://localhost:8080/`, (err, stdout, stderr) => {
    if (err) {
      // node couldn't execute the command
      return;
    }

    // the *entire* stdout and stderr (buffered)
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);
  });
}

const basepage = (req, res) => {
  console.log('basepage handler');

  /**
   * Creating an anchor with authURL as href and sending as response
   */
  var body = '<a href="' + authURL + '"> Get Code </a>';
  res.writeHead(200, {
    'Content-Length': body.length,
    'Content-Type': 'text/html'
  });
  res.end(body);
}

const callback = (req, res) => {
  console.log('callback url handler');
  var p = req.url.split('/');
  /** To obtain and parse code='...' from code?code='...' */
  var qsObj = qs.parse(p[1].split('?')[1]);
  console.log(qsObj.code);
  /** Obtaining access_token */
  client.getOAuthAccessToken(
    qsObj.code, {
      'redirect_uri': MY_CALLBACK_URL,
      'grant_type': 'authorization_code'
    },
    function (e, access_token, refresh_token, results) {
      console.log("Reached here!!")
      if (e) {
        console.log(e);
        res.end(JSON.stringify(e));
      } else if (results.error) {
        console.log(results);
        res.end(JSON.stringify(results));
      } else {
        console.log('Obtained access_token: ', access_token);
        client.get('https://secure.splitwise.com/api/v3.0/get_current_user', access_token, function (e, data, response) {
          console.log('atleast here??');

          if (e) console.error(e);
          res.end(data);
        });
      }
    });
}

module.exports = client;