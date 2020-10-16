const express = require('express')
const app = express();
const fileUpload = require('express-fileupload');

const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs-extra');
const ObjectId = require('mongodb').ObjectId;

//

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(express.static('icons'))
app.use(fileUpload());
require('dotenv').config()

// respond with "hello world" when a GET request is made to the homepage
const MongoClient = require('mongodb').MongoClient; 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bdq7m.mongodb.net/creative-agency?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true  });
client.connect(err => {
  const serviceCollection = client.db("creative-agency").collection("services");
  const orderCollection = client.db("creative-agency").collection("order");
  const reviewCollection = client.db("creative-agency").collection("reviews");
  const adminCollection = client.db("creative-agency").collection("admin");
  const messageCollection = client.db("creative-agency").collection("message");
  // perform actions on the collection object

  app.post('/add-service', (req, res) => {
    const icon = req.files.icon;
    const title = req.body.title;
    const description = req.body.description;
    const iconPath = `${__dirname}/icons/${icon.name}`;
    icon.mv(iconPath, err => {
      if(err){
        console.log(err);
      }
      let newImg = fs.readFileSync(iconPath);
      const encImg = newImg.toString('base64');
      const image = {
        contentType: req.files.icon.mimetype,
        size:req.files.icon.size,
        img: Buffer(encImg, 'base64')
      }
      serviceCollection.insertOne({image, title, description})
      .then(result =>{
        fs.remove(iconPath, error => {
          if (error) {
            console.log(error);
          }
        })
        res.status(200).send(result)
      })
    })
  })
  app.get('/services', (req,res) => {
    serviceCollection.find({})
    .toArray((err, documents) => {
      res.status(200).send(documents)
    })
  })
  app.post('/place-order', (req, res) => {
    const order = req.body;
    orderCollection.insertOne(order)
    .then( result => {
      res.status(200).send(result.insertedCount > 0)
    })
  })
  app.get('/all-orders', (req, res) => {
    orderCollection.find({})
    .toArray((err, documents) => {
      res.status(200).send(documents)
    })
  })
  app.get('/orders/:email', (req, res) => {
    const email = req.params.email;
    orderCollection.find({email: email})
    .toArray((err, documents) => {
      res.status(200).send(documents)
    })
  })
  app.post('/give-review', (req, res) => {
    const review = req.body;
    reviewCollection.insertOne(review)
    .then( result => {
      res.status(200).send(result.insertedCount > 0)
    })
  })
  app.post('/add-admin', (req, res) => {
    const email = req.body;
    adminCollection.insertOne(email)
    .then( result => {
      res.status(200).send(result.insertedCount > 0)
    })
  })
  app.post('/check-admin', (req, res) => {
    const email = req.body.email;
    adminCollection.find({email: email})
    .toArray( (err, admin) => {
      res.status(200).send(admin.length > 0)
    })
  })
  app.get('/reviews', (req, res) => {
    reviewCollection.find({})
    .toArray( (err, review) => {
      res.status(200).send(review)
    })
  })
  app.post('/contact-message', (req, res) => {
    const message = req.body;
    messageCollection.insertOne(message)
    .then( result => {
      res.status(200).send(result.insertedCount > 0)
    })
  })
  app.patch('/update/:id', (req, res) => {
    orderCollection.updateOne({_id: ObjectId(req.params.id)},
    {
        $set: {statues: req.body.statues,}
    }
    )
    .then(result => {
        res.send(result.modifiedCount > 0)
    })
})
});


app.get('/', function (req, res) {
  res.send('Welcome')
})
app.listen(process.env.PORT);