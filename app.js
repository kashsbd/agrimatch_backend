const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

const config = require('./api/config/config');
const userRouter = require('./api/routes/users');
const cropRouter = require('./api/routes/crops');
const locationRouter = require('./api/routes/locations');
const ratingRouter = require('./api/routes/ratings');
const chatRouter = require('./api/routes/chats');

//db config
mongoose.Promise = global.Promise;
mongoose.connect(
	config.MONGO_PATH,
	{ useNewUrlParser: true, autoIndex: true, useCreateIndex: true, useUnifiedTopology: true },
	err => {
		if (err) {
			console.log("Can't connect to db.");
		}
		console.log('Connected to db.');
	},
);

let app = express();

let server = require('http').Server(app);
let io = require('socket.io')(server);

const chat_socket = io.of('/all_chats').on('connection', () => {});

app.use(cors());

//put socket io to every response object
app.use((req, res, next) => {
	//for chatting
	req.chat_socket = chat_socket;
	next();
});

app.use((req, res, next) => {
	res.header('Acess-Control-Allow-Origin', '*');
	res.header('Acess-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});

app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//app routes
app.use('/users', userRouter);
app.use('/crops', cropRouter);
app.use('/locations', locationRouter);
app.use('/ratings', ratingRouter);
app.use('/chats', chatRouter);

app.use((req, res, next) => {
	const error = new Error('Not found');
	error.status = 404;
	next(error);
});

app.use((error, req, res, next) => {
	res.status(error.status || 500);
	res.json({
		error: {
			message: error.message,
		},
	});
});

module.exports = { app, server };
