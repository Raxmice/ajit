const express = require('express');
const bodyparser = require('body-parser');
const mongoose = require("mongoose");
const multer  = require('multer');
const md5 = require('md5');
const session = require('express-session');
const cookieParser = require('cookie-parser');
var fs = require('fs');

const app = express();

const fileStorageEngine = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'./public/img/material')
    },
    filename:(req,file, cb)=>{
        cb(null, file.originalname);
    }
});
const upload = multer({storage:fileStorageEngine});

app.set("view engine", "ejs");
//for body parser
app.use(bodyparser.urlencoded({extended: true}));
app.use(express.static("public"));
//cookies
app.use(cookieParser());

app.use(
    session({
        secret:"key for cookie",
        resave: false,
        saveUninitialized:false
    })
);

const isAuth = (req, res, next)=>{
    if(req.session.isAuth){
        next();
    }else{
        res.redirect('/login');
    }
}
mongoose.connect("mongodb+srv://<username>:<password>@cluster0.s6ynftf.mongodb.net/ajitbookings", {useNewUrlParser: true});
// mongoose.connect("mongodb+srv://<username>:<password>cluster0.s6ynftf.mongodb.net/ajitbookings", {useNewUrlParser: true});
const bookinfo = {
        fname:String,
        cno:Number,
        email:String,
        age:Number,
        gender:String,
        bdate:String,
        dist:Number,
        moreinfo:String,
        mimg:String,
        tandc:String,
        form:String,
        to:String,
        status:{type:String, default:"emp"}
}
const login = {
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:String
}
const Binfo = mongoose.model("Binfo", bookinfo);
const adminlog = mongoose.model("adminlog", login);

//page req and res
app.get("/", function(req, res){
    res.render("index");
});
app.get("/bookform", function(req, res){
    res.render("bookform");
});
app.post("/bookform", function(req, res){
    const fm = req.body.from;
    const to = req.body.to;
        
    res.render("bookform",{from:fm, to:to});
});
//complete form
app.get("/cform", function(req, res){
    res.render("cform");
});
app.post("/cform",upload.single('mimg') , function(req, res){
    const fname = req.body.fname;
    const cno = req.body.cno;
    const email = req.body.email;
    const age = req.body.age;
    const gender = req.body.gender;
    const bdate = req.body.bdate;
    const mfile = req.file;
    const mimg="img/material/"+mfile.originalname;
    const distance = req.body.distance;
    const moreinfo = req.body.moreinfo;
    const tandc = req.body.tandc;
    const fform = req.body.fform;
    const tto = req.body.tto;

    const binfo = new Binfo({
        fname:fname,
        cno:cno,
        email:email,
        age:age,
        gender:gender,
        bdate:bdate,
        mimg:mimg,
        dist:distance,
        moreinfo:moreinfo,
        tandc:tandc,
        form:fform,
        to:tto,
        status:""
    });
    binfo.save();

    res.render("cform",{
        fname:fname,
        cno:cno,
        email:email,
        age:age,
        gender:gender,
        bdate:bdate,
        mimg:mimg,
        dist:distance,
        moreinfo:moreinfo,
        tandc:tandc,
        form:fform,
        to:tto
    });
});

app.get("/map", function(req, res){
    res.render("map");
});
app.get("/login", function(req, res){
    const line=""; 
    res.render("login",{line:line});
});
app.post("/login", function(req, res){
    const password=md5(req.body.password);
    adminlog.findOne({email:req.body.adminmail},(err, data)=>{
        if(data){
            if(password == data.password){
                const value = data.id;
                res.cookie("authaj",value);
                req.session.isAuth = true;
                        res.redirect("orders");
                    }
                    else{
                        const line="password is incorrect.";
                        res.render("login",{line:line});
                    }
        }
        else{
            const line="Email address is incorrect.";
            res.render("login",{line:line});
        }
    });
});
app.get('/orders',isAuth , function(req, res){
    Binfo.find(function(err, data){
            const odata = data;
            res.render("orders",{odata:odata});
    });
});
app.post('/orders',isAuth, function(req, res){
    const id = req.body.id;
    Binfo.updateOne({_id:id},{status:"complete"},function(err){
        if(err){console.log(err);}else{console.log("success");}
    });
    res.redirect("/orders");
});
app.get('/complete', isAuth, function(req, res){
    Binfo.find(function(err, data){
            const odata = data;
            res.render("complete",{odata:odata});
    });
});
app.post('/complete',isAuth, function(req, res){
    const id = req.body.id;
    Binfo.findOne({_id:id},function(err, data){
        if(err){console.log(err);}
        else{
        const img = data.mimg;
        const path = "./public/"+img;
        fs.unlink(path,function(err){
            if(err) return console.log(err);
       }); 
    }
    })
    Binfo.deleteOne({_id:id},function(err){
        if(err){console.log(err);}
        else{
            console.log("delete");
            res.redirect("complete");
        }
    })
});
//about me
app.get("/aboutme", function(req, res){
    res.render("aboutme");
});
//404
app.get('*', function(req, res){
    res.render("404");
  });
//calling a server
app.listen(process.env.PORT || 3000, function () {
    console.log("Server is running on port 3000.");
  });
