require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const dbConfig = require('./database/db');
/******************** Router ********************/ 

const loginRouter = require('./routes/user.routes');
const indexRouter = require('./routes/index.routes');
const imagerouter = require('./models/confrereimage');
/******************** Middleware Setup ********************/ 

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

/******************** Routes ********************/ 

app.use('/v1', loginRouter);
app.use('/v1', indexRouter);
app.use('/v1', imagerouter);
/******************** Server Setup ********************/ 

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log('Connected to port ' + port);
});
