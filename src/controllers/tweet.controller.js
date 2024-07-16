import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content, owner } = req.body;
  const user = await User.findById(owner);

  if (!content) {
    throw new ApiError(400, "Content is required");
  }

  if (content.length > 200) {
    throw new ApiError(400, "Content cannot be more than 200 characters");
  }

  if (content?.trim() == "") {
    throw new ApiError(400, "Content cannot be empty");
  }

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  try {
    const tweet = await Tweet.create({ content, owner });
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          `Tweet created successfully with ID ${tweet.id}`,
          tweet
        )
      );
  } catch (error) {
    throw new ApiError(500, "Internal Server Error");
  }
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const {tweetId} = req.body;
  const userId = req.params;
  if(!userId) {
    throw new ApiError(400, "User ID is required");
  }
  if(!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }
  const matchCondition = {
    owner : userId,
  }
  let tweets;
  try {
    tweets = await Tweet.aggregate([
      {
        $match : matchCondition,
      },
      {
        $lookup : {
          from : "users",
          localField : "owner",
          foreignField : "_id",
          as : "owner",
          pipeline : [
            {
              $project : {
                _id : 1,
                username : 1,
                email : 1,
              }
            }
          ]
        }
      },
      {
        $addFields : {
          owner : {
            arrayElemAt : ["$owner", 0]
          }
        }
      },
    ])
    return res.status(200).json(new ApiResponse(200, "User tweets retrieved successfully", tweets));
  } catch (error) {
    throw new ApiError(500, "Internal Server Error", error);
  }
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { content } = req.body;
  const tweetId = req.params.id; // Assuming the tweet ID is passed as a URL parameter

  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  if (content?.trim() == "") {
    throw new ApiError(400, "Content cannot be empty");
  }

  if (!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }
  try {
    const tweet = await Tweet.findByIdAndUpdate(
      tweetId,
      {
        $set: {
          content: content,
        },
      },
      { new: true }
    );

    if (!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Tweet updated successfully", tweet));
  } catch (error) {
    console.error("Error updating tweet:", error);
  }
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const tweetId = req.params.id;
  
  if(!tweetId) {
    throw new ApiError(400, "Tweet ID is required");
  }
  try {
    const tweet = await Tweet.findByIdAndDelete(tweetId);
    if(!tweet) {
      throw new ApiError(404, "Tweet not found");
    }
  } catch (error) {
    console.error("Error deleting tweet:", error);
  }
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
