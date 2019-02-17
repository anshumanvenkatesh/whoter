/*
* All route handlers
* author: jgr0
*/

const qs = require('querystring');
const utils = require('./utils');

const MY_CALLBACK_URL = process.env.LOCAL_CALLBACK || 'https://whoter.herokuapp.com/callback';
GROUP_ID = 7727992; // ASU Roomates Group ID
DATED_AFTER = 20190105; // 1st Jan 2019

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const basepage = (req, res, client) => {
  console.log('basepage handler');
  const authURL = client.getAuthorizeUrl({
    redirect_uri: MY_CALLBACK_URL,
    response_type: 'code'
  });
  /**
   * Creating an anchor with authURL as href and sending as response
   */
  let body = `<a href="${authURL}"> Get Code </a>`;
  res.writeHead(200, {
    'Content-Length': body.length,
    'Content-Type': 'text/html'
  });
  res.end(body);
};

const callback = (req, res, client) => {
  console.log('callback url handler');
  const p = req.url.split('/');
  /** To obtain and parse code='...' from code?code='...' */
  const qsObj = qs.parse(p[1].split('?')[1]);
  console.log(qsObj.code);
  /** Obtaining access_token */
  client.getOAuthAccessToken(
    qsObj.code, {
      'redirect_uri': MY_CALLBACK_URL,
      'grant_type': 'authorization_code'
    },
    function (e, access_token, refresh_token, results) {
      if (e) {
        console.error(e);
        res.end(JSON.stringify(e));
      } else if (results.error) {
        console.log(results);
        res.end(JSON.stringify(results));
      } else {
        const get_expense_url = `https://secure.splitwise.com/api/v3.0/get_expenses?group_id=${GROUP_ID}&dated_after=${DATED_AFTER}&limit=1000`;
        console.log("access_token: ", access_token);
        utils.getExpenses(client, get_expense_url, access_token)
          .then(data => {
            res.end(data);
          })
          .catch(err => {
            console.error(err)
          })
      }
    });
};

const check = (req, res, client) => {
  const get_expense_url = `https://secure.splitwise.com/api/v3.0/get_expenses?group_id=${GROUP_ID}&dated_after=${DATED_AFTER}&limit=1000`;
  utils.getExpenses(client, get_expense_url, ACCESS_TOKEN)
    .then(data => {
      res.end(data);
    })
    .catch(err => {
      console.error(err);
    })
};

module.exports = {
  basepage,
  callback,
  check,
};