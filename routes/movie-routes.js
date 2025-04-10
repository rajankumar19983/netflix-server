import express from "express";
import movieCtlr from "../app/controllers/movie-controller.js";

const router = express.Router();

router.get("/nowplaying", movieCtlr.nowPlaying);
router.get("/popular", movieCtlr.popular);
router.get("/toprated", movieCtlr.topRated);
router.get("/upcoming", movieCtlr.upComing);
router.get("/:id/videos", movieCtlr.videos);
router.get("/:id/details", movieCtlr.details);
router.get("/:id/credits", movieCtlr.credits);
router.get("/:id/similar", movieCtlr.similar);
router.get("/:id/recommendations", movieCtlr.recommendations);
router.get("/:category", movieCtlr.category);

export default router;
