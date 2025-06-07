require('dotenv').config();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const MongoClient = require("mongodb").MongoClient;
const mongoose = require('mongoose');
const uri = `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true`;
const client = new MongoClient(uri,{
    serverApi:{
        version:'1',
        strict:true,
        deprecationError:true,
    }
});

let userCollection;
let postsCollection;

async function connectToDatabase(){
    try {
        await mongoose.connect(uri);
        console.log('MongoDB connected');
        
        // const db = client.db(mongodb_database);
        // userCollection = db.collection('users');
        // postsCollection = db.collection('posts');
    } catch (err) {
        console.error("MongoDB connection failed:",err);
        throw err;
    }
}
 

module.exports = { 
    connectToDatabase,
    client, 
    db:() => this.db,
    userCollection:() => userCollection,
    postsCollection:() => postsCollection
};