/*
* Helper Functions
* author: jgr0
*/

const R = require('ramda');
const Promise = require("bluebird");


const getIndividuals = R.pipe(
  R.split(";"),
  R.last,
  R.trim,
  R.map(R.toLower)
);

const getExpenses = (client, get_expense_url, access_token) => {
    return new Promise((resolve, reject) => {
      console.log("access token: ", access_token);
      client.get(get_expense_url, access_token, function (e, data) {
        if (e) reject(e);
        const waterExpenses = R.filter(
          R.where({
            description: x => R.includes("water", x.toLowerCase())
          }), JSON.parse(data).expenses
        );
        const reqdArr = R.map(R.pick(['id', 'description', 'created_at']), waterExpenses);
        const filledData = {
          'r': {name: "Raj", count: 0, lastFilled: null, rawData: []},
          'a': {name: "Anshu", count: 0, lastFilled: null, rawData: []},
          'h': {name: "Hari", count: 0, lastFilled: null, rawData: []},
          'v': {name: "VJ", count: 0, lastFilled: null, rawData: []},
        };
        
        // Update fill count of filledData
        R.map(x =>  {
          const names = R.pipe(
            getIndividuals,
            R.map(_x => {
              filledData[_x]["count"] += 1;
              filledData[_x]["rawData"].push(x)
            })
          )(x.description)
        }, reqdArr);
    
        // Update lastFilled
        R.map(
          x => {
            R.pipe(
              getIndividuals,
              R.map(y => {
                if (!(filledData[y]["lastFilled"]))
                  filledData[y]["lastFilled"] = filledData[y]["rawData"][0]["created_at"];
                  delete filledData[y]["rawData"]
              })
            )(x.description)
          }
        )(reqdArr);

        console.log('\n\nwater expenses: ', reqdArr);
        resolve(JSON.stringify(R.values(filledData)));
      });
    })
    
  };

  module.exports = {
      getExpenses,
  };