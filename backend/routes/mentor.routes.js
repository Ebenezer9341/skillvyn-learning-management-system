import express from "express";
import mentorController from "../controllers/mentor.controller.js";

const router = express.Router();

// GET /api/mentors
router.get('/stats', mentorController.getMentorStats);

// GET /api/mentors
router.get('/', mentorController.getMentors);

// GET /api/mentors/:id
router.get('/:id', mentorController.getMentorDetail);


export default router;