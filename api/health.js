export default function handler(req, res) {
  res.status(200).json({ 
    success: true, 
    message: "API is reachable", 
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString() 
  });
}
