import express, { Router } from "express";
import { authenticateJWT } from "../middlewares/authmiddleware";
import { createComment, getCommentsByPostId, updateComment, deleteComment } from "../controllers/comment.controller";

import {
  createCommentValidationRules,
  updateCommentValidationRules,
  deleteCommentValidationRules,
  getCommentByPostIdValidationRules,
} from "../validators/comment.validator";
import { validate } from "../validators/validate";

const router: Router = express.Router();

router.post("/", authenticateJWT, validate(createCommentValidationRules), createComment);
router.get("/post/:post_id", authenticateJWT, validate(getCommentByPostIdValidationRules), getCommentsByPostId);
router.put("/:comment_id", authenticateJWT, validate(updateCommentValidationRules), updateComment);
router.delete("/:comment_id", authenticateJWT, validate(deleteCommentValidationRules), deleteComment);

export default router;
