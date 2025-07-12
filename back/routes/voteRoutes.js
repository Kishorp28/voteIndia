import express from 'express';
import { castVote, getVotes, checkVotingStatus, getVoteChain, getVoteStats } from '../controllers/voteController.js';
const router = express.Router();

router.post('/cast', castVote);
router.get('/all', getVotes);
router.get('/status/:voterId', checkVotingStatus);
router.get('/chain', getVoteChain);
router.get('/stats', getVoteStats);

export default router; 