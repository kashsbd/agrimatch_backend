const express = require('express');
const router = express.Router();

const ChatRoomController = require('../controllers/chatroom');
const checkAuth = require('../middlewares/check-auth');

//create chatroom
router.post('/', checkAuth, ChatRoomController.create_chatroom);
//join chatroom
router.post('/joinChatRoom', checkAuth, ChatRoomController.join_chatroom);

module.exports = router;
