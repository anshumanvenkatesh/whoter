/*
* Helper Functions
* author: jgr0
*/

const R = require('ramda')
const Promise = require("bluebird");

const getExpenses = (client, get_expense_url, access_token) => {
    return new Promise((resolve, reject) => {
      client.get(get_expense_url, access_token, function (e, data) {
        // console.log('data:',  data);
        if (e) reject(e);
        const expenses = JSON.parse(data).expenses;
        // console.log('user data: ', expenses);
        // console.log('user data raw: ', JSON.parse(data).expenses);
        
        const waterExpenses = R.filter(
          R.where({
            description: x => R.includes("water", x.toLowerCase())
          }), expenses
        )
        const reqdArr = R.map(R.pick(['id', 'description', 'created_at']), waterExpenses);
        const filledData = {
          'r': {name: "Raj", count:0, lastFilled: null, rawData: []},
          'a': {name: "Anshu", count:0, lastFilled: null, rawData: []},
          'h': {name: "Hari", count:0, lastFilled: null, rawData: []},
          'v': {name: "VJ", count:0, lastFilled: null, rawData: []},
        };
        
        // Update fill count
        R.map(x =>  {
          const names = R.pipe(
            R.split(";"),
            R.last,
            R.trim,
            R.map(R.toLower),
            R.map(_x => {
              console.log("_x: ", _x);
              console.log("x: ", x);
              filledData[_x]["count"] += 1;
              filledData[_x]["rawData"].push(x)
            })
          )(x.description)
        }, reqdArr);
    
        // Update lastFilled
        R.map(
          x => { 
            R.pipe(
              R.split(";"),
              R.last,
              R.trim,
              R.map(R.toLower),
              R.map(y => {
                console.log("y: ", y);
                if (!(filledData[y]["lastFilled"]))
                  filledData[y]["lastFilled"] = filledData[y]["rawData"][0]["created_at"];
                  delete filledData[y]["rawData"]
              })
            )(x.description)
          }
        )(reqdArr);

        console.log('\n\n\n\nwater expenses: ', reqdArr);
        resolve(JSON.stringify(R.values(filledData)));

        // resolve(expenses);
      });
    })
    
  };

  module.exports = {
      getExpenses
  };