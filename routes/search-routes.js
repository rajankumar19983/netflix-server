import express from "express";
import searchCtlr from "../app/controllers/search-controller.js";

const router = express.Router();

router.get("/:query/:pageNum", searchCtlr.multi);

export default router;
