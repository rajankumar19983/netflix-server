import fetchFromTMDB from "../../services/tmdb-service.js";

const movieCtlr = {};

movieCtlr.nowPlaying = async (req, res) => {
  try {
    const data = await fetchFromTMDB(
      "/movie/now_playing?language=en-US&page=1"
    );
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

movieCtlr.popular = async (req, res) => {
  try {
    const data = await fetchFromTMDB("/movie/popular?language=en-US&page=1");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

movieCtlr.topRated = async (req, res) => {
  try {
    const data = await fetchFromTMDB("/movie/top_rated?language=en-US&page=1");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

movieCtlr.upComing = async (req, res) => {
  try {
    const data = await fetchFromTMDB("/movie/upcoming?language=en-US&page=1");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Something went wrong" });
  }
};

movieCtlr.videos = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/movie/${id}/videos?language=en-US`);
    return res.status(200).json(data);
  } catch (err) {
    if (err.message.includes("404")) {
      return res.status(404).send(null);
    }
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

movieCtlr.details = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/movie/${id}?language=en-US`);
    // returns {all details}
    return res.status(200).json(data);
  } catch (err) {
    if (err.message.includes("404")) {
      return res.status(404).send(null);
    }
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

movieCtlr.credits = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(`/movie/${id}/credits?language=en-US`);
    // returns {id, cast, crew}
    return res.status(200).json(data);
  } catch (err) {
    if (err.message.includes("404")) {
      return res.status(404).send(null);
    }
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

movieCtlr.similar = async (req, res) => {
  const { id } = req.params;
  try {
    const data = await fetchFromTMDB(
      `/movie/${id}/similar?language=en-US&page=1`
    );
    // returns {page, results, total_pages, total_results}
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

movieCtlr.recommendations = async (req, res) => {
  const { id } = req.params;
  // category can be either now_playing, popular, top_rated or upcoming
  try {
    const data = await fetchFromTMDB(
      `/movie/${id}/recommendations?language=en-US&page=1`
    );
    // returns {dates, page, results, total_pages, total_results}
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

movieCtlr.category = async (req, res) => {
  const { category } = req.params;
  // category can be either now_playing, popular, top_rated or upcoming
  try {
    const data = await fetchFromTMDB(
      `/movie/${category}?language=en-US&page=1`
    );
    // returns {dates, page, results, total_pages, total_results}
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

export default movieCtlr;
