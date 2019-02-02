require('dotenv').config()
const OAuth = require('oauth')
const {
  exec
} = require('child_process')
const qs = require('querystring')
const http = require('http')
const R = require('ramda')

const CONSUMER_KEY = process.env.CONSUMER_KEY
const CONSUMER_SECRET = process.env.CONSUMER_SECRET

const TOKEN_URL = '/oauth/token'
const AUTHORIZE_URL = '/oauth/authorize'
const MY_CALLBACK_URL = 'http://localhost:8080/callback'
const BASE_SITE = 'https://www.splitwise.com'

var authURL;
// Random change
const client = new OAuth.OAuth2(
  CONSUMER_KEY,
  CONSUMER_SECRET,
  BASE_SITE,
  AUTHORIZE_URL,
  TOKEN_URL,
  null
)

GROUP_ID = 7727992 // ASU Roomates Group ID
DATED_AFTER = 20190105 // 1st Jan 2019

var ACCESS_TOKEN = '';

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
        console.log('Obtained refresh_token: ', refresh_token);
        ACCESS_TOKEN = access_token
        const get_expense_url = `https://secure.splitwise.com/api/v3.0/get_expenses?group_id=${GROUP_ID}&dated_after=${DATED_AFTER}&limit=1000`
        console.log("url: ", get_expense_url)
        client.get(get_expense_url, access_token, function (e, data, response) {
          // console.log('data:',  data);
          
          const expenses = JSON.parse(data).expenses
          // console.log('user data: ', expenses);
          // console.log('user data raw: ', JSON.parse(data).expenses);
          
          const waterExpenses = R.filter(
            R.where({
              description: x => R.contains("water", x.toLowerCase())
            }), expenses
          )
          const reqdArr = R.map(R.pick(['id', 'description', 'created_at']), waterExpenses)
          const filledData = {
            'r': {name: "Raj", count:0, lastFilled: null, rawData: []},
            'a': {name: "Anshu", count:0, lastFilled: null, rawData: []},
            'h': {name: "Hari", count:0, lastFilled: null, rawData: []},
            'v': {name: "VJ", count:0, lastFilled: null, rawData: []},
          }
          
          // Update fill count
          R.map(x =>  {
            const names = R.pipe(
              R.split(";"),
              R.last,
              R.trim,
              R.map(R.toLower),
              R.map(_x => {
                console.log("_x: ", _x)
                console.log("x: ", x)
                filledData[_x]["count"] += 1
                filledData[_x]["rawData"].push(x)
              })
            )(x.description)
          }, reqdArr)

          // Update lastFilled
          R.map(
            x => {
              R.pipe(
                R.split(";"),
                R.last,
                R.trim,
                R.map(R.toLower),
                R.map(y => {
                  console.log("y: ", y)
                  if (!(filledData[y]["lastFilled"]))
                    filledData[y]["lastFilled"] = filledData[y]["rawData"][0]["created_at"]
                    delete filledData[y]["rawData"]
                })
              )(x.description)
            }
          )(reqdArr)

          console.log('\n\n\n\nwater expenses: ', reqdArr)
          res.end(JSON.stringify(filledData))
          if (e) console.error(e);
          res.end(expenses);
        });
      }
    });
}

module.exports = client;