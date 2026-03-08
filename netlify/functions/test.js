exports.handler = async (event, context) => {
  console.log('Test function called');
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': 'https://your-frontend.netlify.app',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      'Access-Control-Allow-Credentials': 'true'
    },
    body: JSON.stringify({
      message: 'Test function working',
      timestamp: new Date().toISOString()
    })
  };
}; 
