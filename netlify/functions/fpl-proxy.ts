import { Handler } from '@netlify/functions';
import axios from 'axios';

const API_BASE_URL = 'https://fantasy.premierleague.com/api';

const handler: Handler = async (event) => {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: 'Method Not Allowed',
    };
  }

  try {
    // Extract the path parameters from the event
    const pathSegments = event.path.split('/');
    const apiPath = pathSegments.slice(4).join('/'); // Skip /.netlify/functions/fpl-proxy/
    
    // Construct the full URL
    const url = `${API_BASE_URL}/${apiPath}`;
    
    console.log('Proxying request to:', url); // Debug log
    
    // Make the request to the FPL API
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    // Return the response
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    };
  } catch (error) {
    console.error('Proxy Error:', error);
    
    // More detailed error response
    return {
      statusCode: error.response?.status || 500,
      body: JSON.stringify({
        error: 'Failed to fetch data from FPL API',
        details: error.response?.data || error.message,
        path: event.path
      }),
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    };
  }
};

export { handler };