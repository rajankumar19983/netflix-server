import axios from "axios";

const fetchFromTMDB = async (url, params = {}, retries = 3) => {
  const headers = {
    Authorization: "Bearer " + process.env.TMDB_ACCESS_TOKEN,
  };
  const BASE_URL = "https://api.themoviedb.org/3";

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await axios.get(BASE_URL + url, {
        headers,
        params,
        timeout: 15000, // Increase timeout
      });
      return response.data;
    } catch (error) {
      if (error.code === "ECONNRESET" && attempt < retries) {
        await new Promise((res) => setTimeout(res, 2000));
        continue;
      }
      throw new Error(`Failed after ${retries} attempts: ${error.message}`);
    }
  }
};

export default fetchFromTMDB;
