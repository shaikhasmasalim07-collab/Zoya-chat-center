export async function handler() {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      status: 'ok',
      service: 'Zoya Chat Center Serverless API',
      time: new Date().toISOString(),
    }),
  };
}
