import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {User} from "../models/users.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video not found")
    }
    const comments = await Comment.find({video: videoId})
    .populate("owner","username email")
    // populate the owner field with the username and email of the user
    // it is alternative of using $lookup in mongodb    
    .limit(limit * 1)
    //By multiplying limit by 1, you're ensuring that limit is treated as a number (in case it's a string or undefined). 
    .skip((page - 1) * limit)
    // here we have page = 1 and limit = 10 so it will skip 0 documents and retrieve first 10 documents .
    .exec()
    return res
    .status(200)
    .json(new ApiResponse(200, "Comments retrieved successfully", comments))


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {content,video,owner} = req.body

    if(!content){
        throw new ApiError(400,"Content is required")
    }

    if(content?.trim()==""){
        throw new ApiError(400, "Content cannot be empty")
    }

    if(content.length > 200){
        throw new ApiError(400, "Content cannot be more than 200 characters")
    }

    try {
         // Check if user and video exist
         const user = await User.findById(owner);
         const videoExists = await Video.findById(video);
 
         if (!user) {
             throw new ApiError(404, "User not found");
         }
         if (!videoExists) {
             throw new ApiError(404, "Video not found");
         }
 
        const comment = await Comment.create({ content, video, owner });

        return res
         .status(201)
         .json(new ApiResponse(201, `Comment added successfully with ID ${comment.id}`, comment));

      } catch (error) {
        console.error('Error adding comment:', error);

        throw new ApiError(500, "Internal Server Error");
      }
})

    const updateComment = asyncHandler(async (req, res) => {
        // TODO: update a comment
        const{content} = req.body;
        const commentId = req.params.id; // Assuming the comment ID is passed as a URL parameter

        if (!commentId) {
            return res.status(400).json(new ApiResponse(400, "Comment ID is required"));
        }

        if(!content) {
            throw new ApiError(400, "Please provide content")
        }

        try {
            const comment = await Comment.findByIdAndUpdate(
                commentId,
                {
                    $set : {
                        content : content
                    },
                },
                {
                    new : true,
                }
            )

            if(!comment) {
                throw new ApiError(404, "Comment not found")  
            }

            return res 
            .status(200)
            .json(new ApiResponse(200, "Comment updated successfully", comment))
        } 
        catch (error) {
            console.error('Error updating comment:', error);
            return res.status(500).json(new ApiResponse(500, "Internal Server Error"));
        }
    })

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const commentId = req.params.id; // Assuming the comment ID is passed as a URL parameter

    if(!commentId) {
        throw new ApiError(400, "Comment ID is required")
    }

    try {
        const comment  = await Comment.findByIdAndDelete(commentId)

        if(!comment) {
            throw new ApiError(404, "Comment not found")
        }

        return res
        .status(200)
        .json(new ApiResponse(200, "Comment deleted successfully", comment))
        
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw new ApiError(500, "Internal Server Error")
    }
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }