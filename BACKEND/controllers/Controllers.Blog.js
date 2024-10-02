import cloudinary from 'cloudinary'; // Import Cloudinary for file uploads
import { Blog } from '../models/model.blog.js';
import mongoose from 'mongoose';

// create blogs
export const createBlog = async (req, res) => {
    // Check if a file was uploaded
   if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ message: "Blog image is required" });
    }

    const blogImage = req.files.blogImage || req.files[Object.keys(req.files)[0]];

    if (!blogImage) {
        return res.status(400).json({ message: "No image file uploaded" });
    }

    const allowedFormats = ["image/jpg", "image/jpeg", "image/png"];
    
    // Check if the uploaded file format is allowed
    if (!allowedFormats.includes(blogImage.mimetype)) {
        return res.status(400).json({ message: "Invalid image format. Only jpg, jpeg, and png are allowed" });
    }

    // Optional: Check for image size (e.g., 5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (blogImage.size > maxSize) {
        return res.status(400).json({ message: "Image size exceeds the 5MB limit" });
    }

    const { category, title, about } = req.body;

    // Check if any required fields are missing
    if (!category || !title || !about) {
        return res.status(400).json({ message: "Title, category, and about are required fields" });
    }

    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const adminName = req?.user?.name;
    const adminImage = req?.user?.photo?.url;
    const createdBy = req?.user?._id;

    // Upload image to Cloudinary
    try {
        const cloudinaryResponse = await cloudinary.v2.uploader.upload(blogImage.tempFilePath);
        
        // Handle potential errors from Cloudinary
        if (!cloudinaryResponse || cloudinaryResponse.error) {
            console.log(cloudinaryResponse.error);
            return res.status(500).json({ message: "Error uploading image" });
        }

        // Create a new blog entry
        const blogData = {
            title,
            about,
            category,
            adminName,
            adminImage,
            createdBy,
            blogImage: {
                public_id: cloudinaryResponse.public_id,
                url: cloudinaryResponse.secure_url
            }
        };
        const blog = await Blog.create(blogData);
        return res.status(201).json({ message: "Blog created successfully", blogId:blog._id });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server error" });
    }
};

// delete the blogs 
export const deleteBlog = async (req, res) => {
    try {
        // Extract the ID from the request parameters
        const { id } = req.params;

        // Find the blog by its MongoDB _id
        const blog = await Blog.findById(id);

        // Check if the blog exists
        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        // Delete the blog
        await blog.deleteOne();

        // Send success response
        return res.status(200).json({ message: "Blog deleted successfully" });
    } catch (error) {
        console.error("Error deleting blog: ", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// update the blogs
export const updateBlog=async(req,res)=>{
    const {id}=req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res
        .status(400)
        .json({message:"Invalid Blog id"})
    }
    const blog=await Blog.findByIdAndUpdate(id,req.body,{new:true});
    if(!blog){
        return res
        .status(404)
        .json({message:"Blog not found"});
    }
    res.status(200).json(blog);
}
// getting all blogs 
export const getAllBlogs = async (req, res) => {
    try {
        
      const allBlogs = await Blog.find().exec();
      res.status(200).json(allBlogs);
    } catch (error) {
    
      console.error(error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }

// get single blogs
 export const getSingleBlog=async(req,res)=>{
    const {id}=req.params;
    if(!mongoose.Types.ObjectId.isValid(id)){
        return res
        .status(400)
        .json({message:"Invalid Blog id"})
    }
    const blog=await Blog.findById(id);
    if(!blog){
        return res
        .status(404)
        .json({message:"Blog not found"});
    }
    res.status(200).json(blog);
 }

//  my blogs
export const getMyBlog = async (req, res) => {
  try {
    const createdBy = req.user._id; 
    const myBlogs = await Blog.find({ createdBy: createdBy }).exec();
    res.status(200).json(myBlogs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}