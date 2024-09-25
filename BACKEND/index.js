import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { v2 as cloudinary } from 'cloudinary'; // Import Cloudinary for image upload
import cookieParser from 'cookie-parser'; // Import cookie-parser for JWT tokens in cookies
import userRoute from './routes/route.user.js'; // Import user routes
import blogRoute from './routes/route.blog.js'; // Import blog routes

dotenv.config(); // Load environment variables
const app = express();
app.use(cors({
  origin:'http://localhost:3001', // This allows requests from any origin
  credentials:true,
  methods:['GET','POST','PUT','DELETE'],
}))
app.options('*', cors()); // Handle preflight requests

app.use(cookieParser()); // Use cookie-parser to parse cookies
app.use(express.json()); // Parse JSON bodies

const port = process.env.PORT; // Set the port from environment or default to 3000
const MONGO_URL = process.env.MONGO_URL || 3000; // MongoDB URL from environment variables

// Input Validation - Check if MongoDB URL is provided
if (!MONGO_URL) {
  console.error('MONGO_URL environment variable is not set');
  process.exit(1);
}

// Setup express-fileupload for handling file uploads
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: "/temp/",
}));

// Cloudinary Configuration for file uploads
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME, 
  api_key: process.env.CLOUD_API_KEY, 
  api_secret: process.env.CLOUD_SECRET_KEY
});

// MongoDB Connection
mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true }) // Ensure MongoDB is connected
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit if the connection fails
  });

// Routes
app.get('/', (req, res) => {
  res.send('Hello World, Suraj!');
});

app.use('/api/users', userRoute); // User-related routes
app.use('/api/blogs', blogRoute); // Blog-related routes

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}).on('error', (error) => {
  console.error('Server error:', error);
  process.exit(1);
});
