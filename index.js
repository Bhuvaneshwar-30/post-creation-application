const express = require('express');
const helmet  = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');


const authrouter = require('./routers/authRouter');
const postsrouter = require('./routers/postsrouter');

const app = express();

app.use(cors({origin:'http://localhost:4200',credentials:true}));
app.use(helmet({ crossOriginResourcePolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cookieParser());
app.use(express.json( { limit: '10mb'}) );
app.use(express.urlencoded({ limit:'10mb', extended: true }));

mongoose.connect(process.env.MONGO_URI).then(()=>{
  console.log('Connected to database');
}).catch((err)=>{
  console.log(err);
});

app.use('/api/auth', authrouter);
app.use('/api/posts', postsrouter);
app.get('/', (req, res) => {
  res.json({message:'hello im excited to learn nodejs'});
});

app.listen(process.env.PORT,()=>{
  console.log('Server is running on port 8000');
})