var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser')
const fs = require('fs/promises');

var indexRouter = require('./routes/index');

var app = express();

const schedule = require('node-schedule')

schedule.scheduleJob('0 0 * * *', async () => {
  const data = JSON.stringify({ message: 'Calma tryber! Ainda não postaram as agendas de hoje, volte daqui a pouco' });
  const dir = await fs.readdir(path.join(__dirname, '/routes/agendas'));
  dir.map((file) => fs.writeFile(path.join(__dirname, '/routes/agendas', file), data));
})

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
let allowCrossDomain = function(req, res, next) {
  res.header('Access-Control-Allow-Origin', "*");
  res.header('Access-Control-Allow-Headers', "*");
  next();
}
app.use(allowCrossDomain);
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
