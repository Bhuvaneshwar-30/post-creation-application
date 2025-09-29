require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('MongoDB connected successfully!', mongoose.connection.name);
    console.log('collections:',Object.keys(mongoose.connection.collections));
    process.exit(0);
})
.catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
