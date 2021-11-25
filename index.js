require('dotenv').config()

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const AWS = require('aws-sdk');
const app = express();
const port = 8080;

const config = {
  aws_config : {
    "accessKeyId": process.env.AWS_ACCESS_KEY_ID,
    "secretAccessKey": process.env.AWS_SECRET_ACESS_KEY,
    "sessionToken": process.env.AWS_SESSION_TOKEN,
    "region": process.env.AWS_REGION
  },
  dy_table_name : process.env.DY_TABLE_NAME
}

app.use(express.json());

// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.listen(port, function (req, re) {
    console.log('listening on '+port)
});

// Get all doorbells
app.get('/doorbells', (req, res) => {

  AWS.config.update(config.aws_config);

  const docClient = new AWS.DynamoDB.DocumentClient();

  const params = {
      TableName: config.dy_table_name
  };

  docClient.scan(params, (err, data) => {
      if (err) {
          console.log(err)
          res.send({
              success: false,
              message: err
          });
      } else {
          const { Items } = data;
          res.send({
              success: true,
              doorbells: Items
          });
      }
  });
});

// Create Doorbell
app.post('/doorbell', (req, res) => {
  AWS.config.update(config.aws_config);

  const docClient = new AWS.DynamoDB.DocumentClient();
  const Item = { ...req.body };

  Item.doorbell_id = uuidv4();
  var params = {
      TableName: config.dy_table_name,
      Item: Item
  };

  docClient.put(params, function (err, data) {
      if (err) {
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
        res.send({
            success: false,
            message: err
        });
      } else {
        console.log("Added item:", JSON.stringify(data, null, 2));
        res.send({
            success: true,
            message: 'Added doorbell',
            data: data
        });
      }
  });
});

// Get Doorbell
app.get('/doorbell/:id', (req, res) => {
  AWS.config.update(config.aws_config);

  const docClient = new AWS.DynamoDB.DocumentClient();
  var params = {
    TableName: config.dy_table_name,
    Key: { doorbell_id: req.params.id },
  };

  docClient.get(params, function (err, data) {
    if (err) {
      console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
      res.send({
        success: false,
        message: err
      });
    } else {
      console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
      res.send({
        success: true,
        message: 'Get doorbell',
        data: data
      });
    }
  });
});

// Update Doorbell
app.put('/doorbell/:id', (req, res) => {
  AWS.config.update(config.aws_config);

  const docClient = new AWS.DynamoDB.DocumentClient();

  var params = {
      TableName: config.dy_table_name,
      Key: { doorbell_id: req.params.id },
      UpdateExpression: "set doorName = :n, liveUrl = :l, opened = :o",
      ExpressionAttributeValues: {
        ":n": req.body.doorName,
        ":l": req.body.liveUrl,
        ":o": req.body.opened
      },
      ReturnValues:"UPDATED_NEW"
  };

  docClient.update(params, function (err, data) {
    if (err) {
        console.error("Unable to update item. Error JSON:", JSON.stringify(err, null, 2));  
        res.send({
            success: false,
            message: err
        });
    } else {
        console.log("UpdateItem succeeded:", JSON.stringify(data, null, 2));
        res.send({
            success: true,
            message: 'Updated doorbell',
            data: data
        });
    }
  });
});

// Delete Doorbell
app.delete('/doorbell/:id', (req, res) => {
  AWS.config.update(config.aws_config);

  const docClient = new AWS.DynamoDB.DocumentClient();
  
  var params = {
      TableName: config.dy_table_name,
      Key: { doorbell_id: req.params.id }
  };

  docClient.delete(params, function (err, data) {
    if (err) {
      console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
      res.send({
        success: false,
        message: err
      });
    } else {
      console.log("DeleteItem succeeded:", JSON.stringify(data, null, 2));
      res.send({
        success: true,
        message: 'Deleted doorbell',
        data: data
      });
    }
  });
});