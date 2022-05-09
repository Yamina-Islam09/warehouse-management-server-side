const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware
app.use(cors());
app.use(express.json());

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' });
        }
        console.log('decoded', decoded);
        req.decoded = decoded;
        next();
    })
}

//mongodb connection setup
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j0wnr.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const itemCollection = client.db('mobileStore').collection('item');

          // AUTH
          app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

         // items API
         app.get('/item', async (req, res) => {
            const query = {};
            const cursor = itemCollection.find(query);
            const items = await cursor.toArray();
            res.send(items);
        })

        app.get('/item/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const item = await itemCollection.findOne(query);
            res.send(item);
        });

         // POST
         app.post('/item', async (req, res) => {
            const newItem = req.body;
            const result = await itemCollection.insertOne(newItem);
            res.send(result);
        });

        // DELETE
        app.delete('/item/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await itemCollection.deleteOne(query);
            res.send(result);
        });

        app.get('/myitem', verifyJWT, async (req, res) => {
    
            // const email = req.query.email;
            // const query = { email: email };
            // const cursor = itemCollection.find(query);
            // const myitems = await cursor.toArray();
            // res.send(myitems);
            const decodedEmail = req.decoded.email;
            const email = req.query.email;
            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = itemCollection.find(query);
                const items = await cursor.toArray();
                res.send(items);
            }
            else{
                res.status(403).send({message: 'forbidden access'})
            }
        })

 //put
 app.put('/item/:id',async(req,res)=>{
    const id = req.params.id;
    const qtn = parseInt(req.body.quantity);
    const query = {_id: ObjectId(id)};
    const item=await itemCollection.findOne(query);
    if(item){
        const data=qtn;
    
    const result= await itemCollection.updateOne(query,{$set:{quantity:data}});
    res.send(result);
    }
});
    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('hello store');
});

app.listen(port, () => {
    console.log('Listening to port', port);
})