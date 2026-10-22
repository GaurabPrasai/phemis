// The API base URL. Empty means "same origin", which is how the app is
// served in production (Django serves both the API and this bundle).
const config = {
  apiUrl: process.env.REACT_APP_API_URL ?? "",
};

export default config;
