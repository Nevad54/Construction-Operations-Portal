exports.handler = async (event, context) => {
  console.log('Test function called');
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://mastertech2.netlify.app',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
    'Access-Control-Allow-Credentials': 'true',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling preflight request');
    return {
      statusCode: 204,
      headers: corsHeaders
    };
  }

  // Return a simple test response
  return {
    statusCode: 200,
    headers: corsHeaders,
    body: JSON.stringify({
      message: 'Test function is working',
      timestamp: new Date().toISOString()
    })
  };
}; 