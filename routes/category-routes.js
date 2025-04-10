import express from "express";
import categoryCtlr from "../app/controllers/category-controller.js";

const router = express.Router();

router.get("/trending/:endPoint", categoryCtlr.trending);
router.get("/discover/:mediaType/:pageNum", categoryCtlr.discover);

export default router;
