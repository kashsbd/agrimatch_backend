const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require("mongoose");

const config = require('./api/config/config');
const userRouter = require('./api/routes/users');
const postRouter = require('./api/routes/posts');

//db config
mongoose.Promise = global.Promise;
mongoose.connect(config.MONGO_PATH, { useNewUrlParser: true, autoIndex: false, useCreateIndex: true, }, (err) => {
    if (err) {
        console.log("Can't connect to db.");
    }
    console.log('Connected to db.')
});


let app = express();
let server = require('http').Server(app);
let io = require('socket.io')(server);

const all_posts_socket = io.of('/all_posts').on('connection', () => { });

app.use(cors());
//put socket io to every response object
app.use((req, res, next) => {
    //for posts
    req.all_posts_socket = all_posts_socket;
    next();
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//app routes
app.use('/users', userRouter);
app.use('/posts', postRouter);

app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});

module.exports = { app, server };