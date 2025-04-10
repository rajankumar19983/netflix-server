import fetchFromTMDB from "../../services/tmdb-service.js";

const categoryCtlr = {};

categoryCtlr.trending = async (req, res) => {
  try {
    const endPoint = req.params.endPoint;
    const data = await fetchFromTMDB(
      `/trending/all/${endPoint}?language=en-US`
    );
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

categoryCtlr.discover = async (req, res) => {
  try {
    const { mediaType, pageNum } = req.params;
    const filters = req.query;
    const data = await fetchFromTMDB(
      `/discover/${mediaType}?page=${pageNum}`,
      filters
    );
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

export default categoryCtlr;
