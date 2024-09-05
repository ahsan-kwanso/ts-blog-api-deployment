import express, { Router } from "express";
import { authenticateJWT } from "../middlewares/authmiddleware.ts";
import { getUser, getAllUsers, getCurrentUser } from "../controllers/user.controller.ts";

const router : Router = express.Router();
router.get("/find/:user_id", authenticateJWT, getUser);
router.get("/", getAllUsers);
router.get("/me", authenticateJWT, getCurrentUser);

export default router;
