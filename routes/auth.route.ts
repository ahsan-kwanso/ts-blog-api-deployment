import express, { Router } from "express";
import { signUp, signIn } from "../controllers/auth.controller";
import { signInValidationRules, signUpValidationRules } from "../validators/user.validator";
import { validate } from "../validators/validate";

const router: Router = express.Router();

router.post("/signup", validate(signUpValidationRules), signUp);
router.post("/signin", validate(signInValidationRules), signIn);

export default router;
