import express from "express";
import configCtlr from "../app/controllers/config-controller.js";

const router = express.Router();

router.get("/urls", configCtlr.getUrls);
router.get("/genres", configCtlr.getGenres);

export default router;
