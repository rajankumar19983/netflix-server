import fetchFromTMDB from "../../services/tmdb-service.js";

const searchCtlr = {};

searchCtlr.multi = async (req, res) => {
  const { query, pageNum } = req.params;
  try {
    const response = await fetchFromTMDB(
      `/search/multi?query=${query}&language=en-US&page=${pageNum}`
    );
    if (response.results.length === 0) {
      return res.status(404).send(null);
    }
    return res.status(200).json(response);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

export default searchCtlr;
