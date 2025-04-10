import express from "express";
import userCtlr from "../app/controllers/user-controller.js";
import { checkSchema } from "express-validator";
import {
  userLoginSchema,
  userRegistrationSchema,
} from "../app/validations/userValidation.js";
import authenticateUser from "../app/middlewares/authenticateUser.js";

const router = express.Router();

router.post(
  "/register",
  checkSchema(userRegistrationSchema),
  userCtlr.register
);
router.post("/login", checkSchema(userLoginSchema), userCtlr.login);
router.post("/findemail", userCtlr.findEmail);
router.get("/account", authenticateUser, userCtlr.account);
router.post("/searchuser", authenticateUser, userCtlr.searchUser);
router.post("/searchusers", authenticateUser, userCtlr.searchUsers);
router.put(
  "/updateimage",
  authenticateUser,
  userCtlr.upload.single("profilePic"),
  userCtlr.uploadImage
);
router.get("/fetchfriendsdata", authenticateUser, userCtlr.friendsData);
router.post("/sendrequest/:id", authenticateUser, userCtlr.sendRequest);
router.post("/revokerequest/:id", authenticateUser, userCtlr.revokeRequest);
router.post("/acceptrequest/:id", authenticateUser, userCtlr.acceptRequest);
router.post("/rejectrequest/:id", authenticateUser, userCtlr.rejectRequest);
router.post("/unfriend/:id", authenticateUser, userCtlr.unfriend);

export default router;
