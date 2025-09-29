const express = require('express');
const postscontroller = require('../controllers/postscontroller');
const { identify } = require('../middleware/identify');
const router = express.Router();

router.get('/all-posts',postscontroller.getpost);
router .get('/single-posts',postscontroller.singlePost);
router .post('/create-posts',identify,postscontroller.createpost);

router.put('/update-posts',identify,postscontroller.updatepost);
router.delete('/delete-posts',identify,postscontroller.deletepost);



module.exports = router;