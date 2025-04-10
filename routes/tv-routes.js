import express from "express";
import tvCtlr from "../app/controllers/tv-controller.js";

const router = express.Router();

router.get("/airingtoday", tvCtlr.airingToday);
router.get("/popular", tvCtlr.popular);
router.get("/ontheair", tvCtlr.onTheAir);
router.get("/toprated", tvCtlr.topRated);
router.get("/:id/videos", tvCtlr.videos);
router.get("/:id/details", tvCtlr.details);
router.get("/:id/credits", tvCtlr.credits);
router.get("/:id/similar", tvCtlr.similar);
router.get("/:id/recommendations", tvCtlr.recommendations);
router.get("/:category", tvCtlr.category);

export default router;
