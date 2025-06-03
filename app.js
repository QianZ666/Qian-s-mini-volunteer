require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();
const path = require('path');
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.qkqrsri.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)

//secret stuff
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

// mongoose.connect(process.env.MONGO_URI);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

//connect to MongoDB
mongoose.connect(uri)
.then(()=>console.log('connected to MondoDB'))
.catch(err => console.error('MongoDB connection error:',err));

//session middleware
app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: uri }),
  cookie:{maxAge:expireTime}
}));

app.get('/', async (req, res) => {
  res.render('main');
});

const postDetailRoutes = require('./routes/createPost');
app.use('/', postDetailRoutes);

app.listen(3000, () => console.log('Server started on port 3000'));
