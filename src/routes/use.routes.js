import { Router } from "express";
import {
  logInUser,
  logOutUser,
  registerUser,
  refreshAccessToken,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(logInUser);

router.route("/logout").post(verifyJwt, logOutUser);

router.route("/refreshtoken").post(refreshAccessToken);

export default router;
