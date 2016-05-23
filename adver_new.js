var express=require("express");
var app=express();
var mongo=require("mongodb").MongoClient;
var bodyParser=require("body-parser");
var mongourl = 'mongodb://localhost:27017/adver';
var session=require("client-sessions");
var http=require("http");

//Parse url in json format.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Setting view engine to jade.
app.set('view engine','jade');
app.set('views','./templates');

//Creating user sessions.
app.use(session({
 cookieName:'session',
 secret:'plutoismydog',
 duration: 30*60*1000,
 activeDuration: 5*60*1000
}));


//Handling the home page. 
 app.get('/', function(req, res) {
     if(req.session.user)
     {
      res.render('index',{val:"Welcome "+req.session.user+" you are logged in."});
     }
      else
      res.render('index');
     });
    
 
 
 //Redirecting to signup request hander.
 app.get('/signup',function(req,res)
 {
  res.render('signup');
 });
 
 
 //Signup request handler.
 app.post('/signup',function(req,res){
 mongo.connect(mongourl, function(err, db) {
      if (err) throw err;
      var user = db.collection('user');
      user.find({
        username: req.body.user
      }).toArray(function(err, docs) {
        if (err) throw err;
        if(docs.length==0)
        {
         //Checking if user exists or not if it doesn't then inserting values.
         //Document to insert values.
         var doc={
          username:req.body.user,
          password:req.body.pass
         };
        //Insertion in mongo db
        user.insert(doc, function(err, data) {
        if (err) throw err;
        res.render('index',{val:"Now go and login."});
        db.close();
        });
        }
        else
        {
         db.close();
         res.render('signup',{val:"User already exists."});
        }
       });
    });
 });
 
 
 //Rendering the login page
 app.get('/login',function(req,res){
  res.render('login');
 });


//Handling login details
 app.post('/login',function(req,res){
  mongo.connect(mongourl, function(err, db) {
      if (err) throw err;
      var user = db.collection('user');
      //Finds the user name
      user.find({
        username: req.body.user
      }).toArray(function(err, docs) {
        if (err) throw err;
        if(docs.length==0)
        {
         res.render('login',{val:"No such username please go and signup."});
         db.close();
        }
        else
        {
         //Checking for password
         if(docs[0].password==req.body.pass)
         {
         req.session.user=req.body.user;
         res.redirect('/');
         }
         else
         {
          res.render('login',{val:"You have entered wrong password."});
         }
         db.close();
         
        }
       });
    });
 });
 
 
 //Handles logout by reseting seesion cookies
app.get('/logout',function(req,res){
 req.session.reset();
 res.redirect('/');
}); 
 
 
//Handling advertisement clicks 
app.get('/add',function(req,res){
if(req.session.user)
{
 mongo.connect(mongourl, function(err, db) {
      if (err) throw err;
      var add = db.collection('add');
     add.find({
        username: req.session.user
      }).toArray(function(err, docs) {
        if (err) throw err;
        if(docs.length==0)
        {
         //Checks if no such user exists in this doc then enters one
         var ad="catid"+req.query.cat_id+"banid"+req.query.ban_id;
         var url="http://ip-api.com/json/"+req.headers['x-forwarded-for'];
         http.get(url,function callback(response){
         response.on('data',function(data){
         var d=data.toString();
         var da=JSON.parse(d);
         var dup={};
         dup[ad]=1;
         var doc={
         'username': req.session.user,
         'location': da.city,
         'isp':da.isp,
         'user-agents':req.headers['user-agent'],
         'ip': req.headers['x-forwarded-for'],
         };
         doc['add']=dup;
        add.insert(doc, function(err, data) {
        if (err) throw err;
        res.render('index',{val:"You have clicked an advertisement."});
        db.close();
        });
        });
        }); 
         }
        else
        {
         
         //If documetn exists then increses thec ount in mongo db using $inc
         var ada="add.catid"+req.query.cat_id+"banid"+req.query.ban_id;
         var up={};
         up[ada]=1;
         add.update(
         {username:req.session.user},{
          $inc: up
         });
         res.render('index',{val:"You have clicked an advertisement."});
         db.close();
         }
       });
    });
}
else
{
 res.render('index',{val:"You need to login first."});
}
});


//Rendering the analysis page.
app.get('/analyse',function(req,res){
 res.render('analysis');
});


//Handling analysis data
app.get('/anauser',function(req,res){
 if(req.query.user!='*')
 {
  //Analysis of all users
  mongo.connect(mongourl, function(err, db) {
      if (err) throw err;
      var add = db.collection('add');
      add.find({
        username: req.query.user
      }).toArray(function(err, docs) {
        if (err) throw err;
        res.render('analysis',{val:JSON.stringify(docs)});
        db.close();
      });
    });
 }
 else
 {
  //Analysis of specific user
  mongo.connect(mongourl, function(err, db) {
      if (err) throw err;
      var add = db.collection('add');
      add.find().toArray(function(err, docs) {
        if (err) throw err;
        res.render('analysis',{val:JSON.stringify(docs)});
        db.close();
      });
    });
  
 }
});

//handles analysis according to location.
app.get('/analoc',function(req,res){
 if(req.query.loc!='*')
 {
  //Handles for all location 
  mongo.connect(mongourl, function(err, db) {
      if (err) throw err;
      var add = db.collection('add');
      add.find({
        location: req.query.loc
      },{
       _id: 0,
       location:1,
       add:1
      }).toArray(function(err, docs) {
        if (err) throw err;
        res.render('analysis',{val:JSON.stringify(docs)});
        db.close();
      });
    });
 }
 else
 {
  //Handles for specific location
  mongo.connect(mongourl, function(err, db) {
      if (err) throw err;
      var add = db.collection('add');
      add.find({},{
       _id: 0,
       location:1,
       add:1
      }).toArray(function(err, docs) {
        if (err) throw err;
        res.render('analysis',{val:JSON.stringify(docs)});
        db.close();
      });
    });
  
 }
});

    app.listen(8080);