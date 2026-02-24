import express from 'express';
import { protect } from '../middleware/authMiddleware';
import { getChatContacts, getMessagesBetweenUsers, sendMessage } from '../controllers/chatController';

const router = express.Router();

router.use(protect);

router.route('/contacts').get(getChatContacts);
router.route('/messages/:userId').get(getMessagesBetweenUsers);
router.route('/messages').post(sendMessage);


export default router;