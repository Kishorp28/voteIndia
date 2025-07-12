import express from 'express';
import { getAllCandidates, addCandidate, updateCandidate, deleteCandidate } from '../controllers/candidateController.js';
import multer from 'multer';
const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', getAllCandidates);
router.post('/', upload.single('photo'), addCandidate);
router.put('/:id', upload.single('photo'), updateCandidate);
router.delete('/:id', deleteCandidate);

export default router; 