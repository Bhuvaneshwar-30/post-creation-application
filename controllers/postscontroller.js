const Post = require('../models/postsmodel');
const { createpostsschema } = require('../middleware/validation');

exports.getpost = async (req, res) => {
    const { page } = req.query;
    const postsPerPage = 10;

    try {
        let pageNum = parseInt(req.query.page) || 1;
        if (pageNum < 1) {
            pageNum = 0
        } else {
            pageNum = pageNum - 1
        }

        const result = await Post.find().sort({ createdAt: -1 })
            .skip(pageNum * postsPerPage).limit(postsPerPage).populate({
                path: 'userId',
                select: 'name email'
            })
        res.status(200).json({ success: true, message: 'post', data: result });

    } catch (error) {
        console.log(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.createpost = async (req, res) => {
    const { title, description } = req.body;
    const { userId } = req.user || {};

    try {
        console.log("Incoming body:", req.body);
        console.log("User from token:", req.user);
        const { error, value } = createpostsschema.validate({ title, description, userId });
        if (error) {
            return res
                .status(401)
                .json({ status: false, messag: error.details[0].message });
        }
        const result = await Post.create({
            title,
            description,
            userId
        });
        res.status(201).json({ success: true, message: 'created successfully', data: result });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
exports.singlePost = async (req, res) => {
    const { _id } = req.query;

    try {
            const existingpost = await Post.findOne({ _id })
            .populate({
                path: 'userId',
                select: 'name email'
            });
            if (!existingpost) {
                return res
                .status(404)
                .json({ success: false, message: 'Post not found' });
            }
        res.status(200).json({ success: true, message: 'Single post', data: existingpost });

    } catch (error) {
        console.log(error);
    }
};

exports.updatepost = async (req, res) => {
    const { _id, title, description} = req.body;
    const { userId } = req.user;

    try {
        const { error, value } = createpostsschema.validate({ title, description, userId });
        if (error) {
            return res
                .status(401)
                .json({ status: false, messag: error.details[0].message });
        }
        const existingPost = await Post.findOne({  _id });
        if (!existingPost) {
            return res
            .status(404)
            .json({ success: false, message: 'Post not found' });
        }
        if (existingPost.userId.toString() !== userId) {
            return res
            .status(403)
            .json({ success: false, message: 'You are not authorized to update this post' });
        }
        existingPost.title = title;
        existingPost.description = description; 

        const result = await existingPost.save();
        res.status(201).json({ success: true, message: 'updated successfully', data: result });

    } catch (error) {
        console.log(error);
    }
};


    exports.deletepost = async (req, res) => {
        const { _id } = req.query;
        const { userId } = req.user;

        try {
            const existingPost = await Post.findOne({  _id });
            if (!existingPost) {
                return res
                .status(404)
                .json({ success: false, message: 'Post not found' });
            }
            console.log('Logged in userId from token:', userId);
            console.log('Post owner userId:', existingPost.userId.toString());
            if (existingPost.userId.toString() !== userId) {
                return res
                .status(403)
                .json({ success: false, message: 'You are not authorized to update this post' });
            }
            
            await Post.deleteOne({ _id });
            res.status(201).json({ success: true, message: 'deleted successfully' });

        } catch (error) {
            console.log(error);
        }
    };