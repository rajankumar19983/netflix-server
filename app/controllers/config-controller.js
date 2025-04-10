import fetchFromTMDB from "../../services/tmdb-service.js";

const configCtlr = {};

configCtlr.getUrls = async (req, res) => {
  try {
    const response = await fetchFromTMDB("/configuration");
    const base_url = response.images.secure_base_url + "original";
    const url = {
      backdrop: base_url,
      poster: base_url,
      profile: base_url,
    };
    return res.json(url);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

configCtlr.getGenres = async (req, res) => {
  try {
    const endpoints = ["tv", "movie"];
    const promises = endpoints.map((type) =>
      fetchFromTMDB(`/genre/${type}/list`)
    );
    let allGenres = {};
    const responses = await Promise.all(promises);
    responses.forEach(({ genres }) => {
      genres.forEach((item) => {
        allGenres[item.id] = item;
      });
    });
    return res.json(allGenres);
  } catch (err) {
    return res.status(500).json({ errors: "Internal Server Error" });
  }
};

export default configCtlr;
