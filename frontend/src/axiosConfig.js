import axios from 'axios';
import config from './config';

// Configure axios with base URL from environment or config
axios.defaults.baseURL = config.apiUrl;

export default axios; 