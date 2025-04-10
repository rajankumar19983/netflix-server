import fetchFromTMDB from "../../services/tmdb-service.js";

const tvCtlr = {};

tvCtlr.airingToday = async (req, res) => {
  try {
    const data = await fetchFromTMDB("/tv/airing_today?language=en-US&page=1");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.onTheAir = async (req, res) => {
  try {
    const data = await fetchFromTMDB("/tv/on_the_air?language=en-US&page=1");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.popular = async (req, res) => {
  try {
    const data = await fetchFromTMDB("/tv/popular?language=en-US&page=1");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.topRated = async (req, res) => {
  try {
    const data = await fetchFromTMDB("/tv/top_rated?language=en-US&page=1");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.videos = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/tv/${id}/videos?language=en-US`);
    return res.json(data);
  } catch (err) {
    if (err.message.includes("404")) {
      return res.status(404).send(null);
    }
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.details = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/tv/${id}?language=en-US`);
    // returns {all details}
    return res.json(data);
  } catch (err) {
    if (err.message.includes("404")) {
      return res.status(404).send(null);
    }
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.credits = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/tv/${id}/credits?language=en-US`);
    // returns {id, cast, crew}
    return res.json(data);
  } catch (err) {
    if (err.message.includes("404")) {
      return res.status(404).send(null);
    }
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.similar = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/tv/${id}/similar?language=en-US&page=1`);
    // returns {page, results, total_pages, total_results}
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.recommendations = async (req, res) => {
  const { id } = req.params;
  // category can be either now_playing, popular, top_rated or upcoming
  try {
    const data = await fetchFromTMDB(
      `/tv/${id}/recommendations?language=en-US&page=1`
    );
    // returns {dates, page, results, total_pages, total_results}
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

tvCtlr.category = async (req, res) => {
  const { category } = req.params;
  // category can be either airing_today, on_the_air, popular, top_rated
  try {
    const data = await fetchFromTMDB(`/tv/${category}?language=en-US&page=1`);
    // returns {dates, page, results, total_pages, total_results}
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

export default tvCtlr;
