import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  try {
    const { videoId } = req.params; // extracted from request params
    //TODO: toggle like on video
    if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid video id"); // validate
    }
    // fetch video details
    const video = await Like.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }
    const loggedInUser = req.user?._id;
    if (!loggedInUser) {
      throw new ApiError(400, "Please Login to like");
    }
    // check if user has already liked the video
    const existingLiked = await Like.findOne({
      user: loggedInUser,
      video: videoId,
    });
    // if user has not liked the video then like it else unlike
    if (existingLiked) {
      // unlike it
      await Like.findByIdAndDelete({
        likedBy: loggedInUser,
        video: videoId,
      });
      return new ApiResponse(200, "Video unliked successfully");
    } else {
      // create a new like
      const newLike = await Like.create({
        likedBy: loggedInUser,
        video: videoId,
      });
      await newLike.save();
      return new ApiResponse(200, "Video liked successfully");
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  try {
    const { commentId } = req.params;

    // Validate comment ID
    if (!isValidObjectId(commentId)) {
      throw new ApiError(400, "Invalid comment id");
    }

    // Fetch comment details from the Comment collection
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new ApiError(404, "Comment not found");
    }

    const loggedInUser = req.user?._id;
    if (!loggedInUser) {
      throw new ApiError(400, "Login is required to like a comment");
    }

    // Check if the user has already liked the comment
    const existingLike = await Like.findOne({
      likedBy: loggedInUser,
      comment: commentId,
    });

    if (existingLike) {
      // If already liked, remove the like (unlike)
      await Like.findByIdAndDelete(existingLike._id);
      return res
        .status(200)
        .json(new ApiResponse(200, "Comment unliked successfully"));
    } else {
      // If not liked, create a new like
      const newLike = await Like.create({
        likedBy: loggedInUser,
        comment: commentId,
      });
      return res
        .status(200)
        .json(new ApiResponse(200, "Comment liked successfully"));
    }
  } catch (error) {
    console.error("Error toggling like:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
 try {
     const { tweetId } = req.params;
   
     // Validate tweet ID
       if (!isValidObjectId(tweetId)) {
           throw new ApiError(400, "Invalid tweet id");
       }
   
       // Fetch tweet details from the Tweet collection
       const tweet = await Like.findById(tweetId);
       if (!tweet) {
           throw new ApiError(404, "Tweet not found");
       }
   
       // Get the logged in user
       const loggedInUser = req.user?._id;
       if (!loggedInUser) {
           throw new ApiError(400, "Login is required to like a tweet");
       }
   
       // Check if the user has already liked the tweet
       const existingLike = await Like.findOne({
           likedBy: loggedInUser,
           tweet: tweetId,
       });
   
       // If the user has already liked the tweet, remove the like (unlike)
       if (existingLike) {
           await Like.findByIdAndDelete(existingLike._id);
           return res
               .status(200)
               .json(new ApiResponse(200, "Tweet unliked successfully"));
       } else {
           // If the user has not liked the tweet, create a new like
           const newLike = await Like.create({
               likedBy: loggedInUser,
               tweet: tweetId,
           });
           return res
               .status(200)
               .json(new ApiResponse(200, newLike ,"Tweet liked successfully"));
       }
 } catch (error) {
     console.error("Error toggling like:", error);
     return res.status(500).json({ message: "Server error" });
    
 }

});

const getLikedVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const gettingLikedVideos = await Like.aggregate([
    {
      $match : {
        likedBy : mongoose.Types.ObjectId(userId),
        video : {
          $exists : true
        },
      },
    },
    {
      $lookup : {
        from : "videos",
        localField : "video",
        foreignField : "_id",
        as : "video",
        pipeline : [
          {
            $lookup : {
              from : "users",
              localField : "owner",
              foreignField : "_id",
              as : "owner",
              pipeline : [{
                $project : {
                  fullname : 1,
                  avatar : 1,
                  username : 1,
                }
              }
            ]
            }
          },
          {
            $addFields : {
              owner: { $first: "$owner" },
            }
          }
        ]
      }
    },
    {
      $addFields: { video: { $first: "$video" } },
    },
  ]);
  if(!gettingLikedVideos){
    throw new ApiError(404, "You haven't liked any video yet");
  }
  return res
  .status(200)
  .json(new ApiResponse(200, gettingLikedVideos, "Liked videos fetched successfully"));
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
