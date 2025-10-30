require('dotenv').config();
const express = require('express');
const app = express();
const session = require('express-session');
const mongoose = require('mongoose');
const MongoStore = require('connect-mongo');

const path = require('path');
const bcrypt = require('bcryptjs');
const saltRounds = 12;
const Joi = require("joi");
const User = require('./models/user');
const { connectToDatabase} = require('./databaseconnection');
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.qkqrsri.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const expireTime = 24 * 60 * 60 * 1000; //expires after 1 day  (hours * minutes * seconds * millis)
const multer = require("multer");
const upload = multer({ dest: "uploads/", limits: { fileSize: 5 * 1024 * 1024 } });

const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

//======middleware========
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname,'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'public', 'uploads')));

//session middleware
app.use(session({
  secret: process.env.NODE_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: uri }),
  cookie:{maxAge:expireTime}
}));

//require login middleware
function requireLogin(req, res, next) {
  if (!req.session || !req.session.authenticated) {
    return res.status(401).send(`
      <html>
        <head><title>Unauthorized</title></head>
        <body>
          <h1>401 - Unauthorized</h1>
          <p>You must be logged in to access this page.</p>
          <a href="/login">Login</a>
        </body>
      </html>
    `);
  }
  next();
}
//attach user info if logged in
app.use(async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).select('_id username email');
      if (user) {
        req.user = user;
      }
    } catch (err) {
      console.error('Error attaching user to req:', err);
    }
  }
  next();
});

//======routes=========
app.get('/', async (req, res) => {
  res.render('login');
});
app.get("/signup", function(req, res) {
  res.render('signup');
});
app.get("/login", function (req, res) {
  res.render('login');
});

//signup route
app.post('/submitUser', async (req,res) => {
  console.log("creating user");
  try {
    const {
      username,
      rawemail = req.body.email.toLowerCase(),
      password,        
    } = req.body;
    email = rawemail.toLowerCase();
  
    const schema = Joi.object({
      username:    Joi.string().alphanum().min(3).max(30).required(),
      email:       Joi.string().email().required(),
      password:    Joi.string().min(3).max(20).required(),
    });

    const validationResult = schema.validate({username, email, password});
    const result = await User.find({ email: email }).select('email').lean();


    if (validationResult.error != null) {
      console.log(validationResult.error);
      res.redirect("/signup");
      return;

      //if email is NOT already in registered, sign up
    } else if (result.length == 0) {
      var hashedPassword = await bcrypt.hash(password, saltRounds);
      const newUser = {
        username,
        email,
        hashedPassword,                
        avatarUrl: '/image/default-avatar.png',
        privacySettings: {
          notificationsEnabled: true,
          profilePublic:        true
        },
        posts: [],
        savedTerms:  [],
        savedPosts:  []
      };
      await User.create(newUser);
      console.log("Inserted user");

      const html = `
      <html>
      <head>
        <title>User Created</title>
        // <link rel="stylesheet" href="#">
      </head>
      <body>
        <div class="success-container">
          <h1>Account Created Successfully!</h1>
          <p>Your account has been created. <br> You can now log in.</p>
          <form action="/login">
            <button type="submit">Log In</button>
          </form>
        </div>
      </body>
      </html>
      `;
      res.send(html);
    } else {
      res.redirect("/signup?error=email_in_use");
    }
}  catch (err) {
    console.error("Error in /submitUser:", err);
    return res.status(500).send("Oops—something went wrong.");
  }
});

// Login route
app.post('/loggingin', async (req,res) => {
  var email = req.body.email.toLowerCase();
  var password = req.body.password;

  const schema = Joi.string().max(20).required();
  const validationResult = schema.validate(email);
  if (validationResult.error != null) {
    console.log(validationResult.error);
    const html = `
    <html>
    <head>
      <title>Invalid Credentials</title>
      <link rel="stylesheet" href="/css/error.css">
    </head>
    <body>
      <div class="error-container">
        <h1>Invalid Email/Password</h1>
        <p>The email and password combination you entered is incorrect. Please try again.</p>
        <a href="/login">Try Again</a>
      </div>
    </body>
    </html>
    `;
      res.send(html);
    return;
  }
 const result = await User.find({ email: email }).select('email username hashedPassword _id').lean();


  console.log(result);

  if (result.length !== 1) {
    const html = `
      <html>
      <head>
        <title>User Not Found</title>
        <link rel="stylesheet" href="/css/error.css">
      </head>
      <body>
        <div class="error-container">
          <h1>User Not Found</h1>
          <p>The user you are looking for could not be found.</p>
          <a href="/login">Try Again</a>
        </div>
      </body>
      </html>
    `;
    res.send(html);
    return;
  }

  if (await bcrypt.compare(password, result[0].hashedPassword)) {
    console.log("correct password");
    req.session.authenticated = true;
    req.session.username = result[0].username;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;
    req.session.userId        = result[0]._id.toString();
    req.session.cookie.maxAge = expireTime;

    res.redirect('/main');
    return;
  }
  else {
    const html = `
    <html>
    <head>
      <title>Invalid Password</title>
      <link rel="stylesheet" href="/css/error.css">
    </head>
    <body>
      <div class="error-container">
        <h1>Invalid Password</h1>
        <p>The password you entered is incorrect. Please try again.</p>
        <a href="/login">Try Again</a>
      </div>
    </body>
    </html>
    `;
    
    res.send(html);
    
  }
});
//logout route
app.get('/logout', (req,res) => {
	req.session.destroy();
    var html = `
    You are logged out.
    `;
    res.send(html);
});

//========pages(protected)=========
//main page route
app.get('/main', requireLogin,(req, res) => {
  res.render('main', {
    username: req.session.username,
    email: req.session.email
  });
});

//profile route
app.get("/profile",async(req, res) => {
    try {
    const currentUser = await User.findById(req.user._id); 
    res.render("profile", { user: currentUser });
  } catch (err) {
    console.error("Error loading profile:", err);
    res.status(500).send("Server error loading profile");
  }
});

//edit profile route 
app.get("/editProfile", requireLogin,(req, res) => {
  res.render("editProfile", { user: req.user });
});

app.get("/data", requireLogin, (req, res) => {
  res.json({
    username: req.user.username,
    bio: req.user.bio || "",
    location: req.user.location || "",
    age: req.user.age || null,
    gender: req.user.gender || "",
    avatarUrl: req.user.avatarUrl || ""
  });
});

app.post("/profile/update", requireLogin, upload.single("profileImage"),  async (req, res) => {
   try {
    const { name, bio, location, age, gender } = req.body;
    const parsedAge = age ? parseInt(age) : null;

    const updateData = { username: name, bio, location, age: parsedAge, gender };
    if (req.file) updateData.avatarUrl = `/uploads/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

//=====route modules
const postRoutes = require('./routes/createPost');
app.use('/',requireLogin,postRoutes);

const geocodeRoutes = require("./routes/api/geocode");
app.use("/api",geocodeRoutes);

const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

//=====start server ======
connectToDatabase()
  .then(() => {
    app.listen(3000, () => console.log('Server started on port 3000'));
  })
  .catch(err => {
    console.error(" Failed to start server:", err);
  });
