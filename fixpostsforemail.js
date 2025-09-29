    require('dotenv').config();
    const mongoose = require('mongoose');
    const User = require('./models/Usersmodel'); // adjust path
    const Post = require('./models/postsmodel'); // adjust path

    async function fixPosts() {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // 2. Find the user
        const user = await User.findOne({ email: 'bhuvaneshwar0615@gmail.com' });
        if (!user) {
        console.log('User not found');
        process.exit(1);
        }

        // 3. Update all posts with this email to have correct userId
        const result = await Post.updateMany(
        { email: 'bhuvaneshwar0615@gmail.com' },
        { $set: { userId: user._id } }
        );

        console.log(`Updated ${result.modifiedCount} posts`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
    }

    fixPosts();
