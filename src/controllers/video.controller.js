import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/users.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadonCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //Step 1: Extract Query Parameters
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  // Step 2  : writing match condition
  const matchCondition = {
    $or: [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
      // $regex allows you to search for patterns within string fields. It stands for "regular expression".
      // {$regex: query, $options: 'i'}: This creates a case-insensitive search pattern based on the query string. The i option stands for "ignore case".
    ],
  };

  if (userId) {
    matchCondition.owner = User.findById(userId);
    matchCondition.isPublished = true;
  }

  // Step 3 : Writing aggregate pipeline
  let videoAggregate;
  try {
    videoAggregate = Video.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "users",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
          pipeline: [
            {
              $project: {
                _id: 1,
                username: 1,
                email: 1,
                avatar: 1,
              },
            },
          ],
        },
      },
      {
        $addFields: {
          owner: {
            $first: "$owner",
          },
        },
      },
      {
        $sort: {
          [sortBy || "createdAt"]: sortType === "desc" ? -1 : 1,
          // this logic specially says about if sortType is desc then -1 else 1 which is default
        },
      },
    ]);
  } catch (error) {
    console.error("Error in aggregation:", err);
    throw new ApiError(
      500,
      err.message || "Internal server error in video aggregate"
    );
  }
  // options for aggregatePaginate
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    // customLabels for changing the default labels : turning totalDocs to totalVideos and docs to videos
    customLabels: {
      totalDocs: "totalVideos",
      docs: "videos",
    },
  };

  // video.aggregatePaginate for pagination
  Video.aggregatePaginate(videoAggregate, options).then((result) => {
    // This function extends the aggregate method to add pagination capabilities. It takes the aggregation pipeline (videoAggregate) and pagination options (options) as arguments.
    try {
      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            result,
            result.totalVideos === 0
              ? "No video found"
              : "videos fetched successfully"
          )
        );
    } catch (error) {
      console.error("Error in aggregatePaginate:", error);
      throw new ApiError(
        500,
        error.message || "Internal server error in video aggregatePaginate"
      );
    }
  });
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  const existTitle = await Video.findOne({ title });
  if (existTitle) {
    throw new ApiError(409, "Title already exists please choose another title");
  }
  // Input Validation
  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }
  console.log("my console req.files", req.files);
  // check if files are uploaded
  if (!req.files?.videofile || !req.files?.thumbnail) {
    throw new ApiError(400, "Video file and thumbnail are required");
  }
  const videoLocalPath = req.files?.videofile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  console.log("thumbnailLocalPath", thumbnailLocalPath);

  // Upload files to Cloudinary
  const videoFileUploadResult = await uploadonCloudinary(videoLocalPath);
  if (!videoFileUploadResult.url) {
    throw new ApiError(500, "Error uploading video file");
  }
  const thumbnail = await uploadonCloudinary(thumbnailLocalPath);
  const duration =
    typeof videoFileUploadResult.duration === "string"
      ? parseFloat(videoFileUploadResult.duration)
      : videoFileUploadResult.duration;
  // Create a new video document
  const videoData = new Video({
    videofile: videoFileUploadResult.url,
    thumbnail: thumbnail.url,
    title,
    description,
    duration,
    owner: req.user._id,
    isPublished: isPublished,
  });
  await videoData.save();
  return res
    .status(201)
    .json(new ApiResponse(201, videoData, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Video id is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }
  return res.status(200).json(new ApiResponse(200, video, "Video found"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const { title, description, thumbnail } = req.body;
  const videoFileLocalPath = req.files?.videofile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
  if (
    !title ||
    (title.trim() === "" &&
      (description || description.trim() === "") &&
      !thumbnailLocalPath &&
      !videoFileLocalPath)
  ) {
    throw new ApiError(400, "Atleast One Field is required");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found, try again");
  }
  if (req.user?.id.toString() !== video.owner.toString()) {
    throw new ApiError(403, "You are not authorized to update this video");
  }
  const thumbnailFile = await uploadonCloudinary(thumbnailLocalPath);
  const videoFile = await uploadonCloudinary(videoFileLocalPath);
  if (!thumbnailFile.url || !videoFile.url) {
    throw new ApiError(500, "Error uploading files");
  }
  if (thumbnailFile.url || videoFile.url !== "") {
    await deleteOnCloudinary(video.thumbnail);
    await deleteOnCloudinary(video.videoFile);
  }
  try {
    let updatedVideo;
    if (title && description && thumbnailFile.url && videoFile.url) {
      updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
          $set: {
            title: title,
            description: description,
            thumbnail: thumbnailFile.url,
            videofile: videoFile.url,
          },
        },
        { new: true }
      );
    }
    return res
      .status(200)
      .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
  } catch (error) {
    throw new ApiError(500, error.message || "internal server error");
  }
});

const deleteVideo = asyncHandler(async (req, res) => {
  //get video which video want to delete;
  // check the owner of video if is same then do
  //delete the video
  // delete cloudnary url also
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video is missing in the database");
  }
  if (req.user?.id.toString() !== video.owner.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }
  const videoUrl = video.videoFile;
  const thumbnailUrl = video.thumbnail;
  if (!videoUrl || !thumbnailUrl) {
    throw new ApiError(500, "video and thumbnail missing at database");
  }
  try {
    // Delete video and thumbnail from Cloudinary
    await deleteOnCloudinary(thumbnailUrl);
    await deleteOnCloudinary(videoUrl);
  } catch (error) {
    console.error(`Error removing video files from Cloudinary: ${error}`);
    throw new ApiError(500, "Error deleting files from Cloudinary");
  }

  // Delete the video document from the database
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video successfully deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  // Ensure the user is logged in
  const loggedInUser = req.user?._id;
  if (!loggedInUser) {
    throw new ApiError(400, "Please login to publish/unpublish video");
  }

  try {
    // Fetch the video by ID
    const video = await Video.findById(videoId);
    if (!video) {
      throw new ApiError(404, "Video not found");
    }

    // Check if the user is the owner of the video
    if (video.owner.toString() !== loggedInUser.toString()) {
      throw new ApiError(
        403,
        "You do not have permission to toggle this video's publish status"
      );
    }

    // Toggle the publish status
    video.isPublished = !video.isPublished;
    await video.save();

    // Respond with the updated video
    return res
      .status(200)
      .json(new ApiResponse(200, video, "Publish status toggled successfully"));
  } catch (error) {
    return res
      .status(500)
      .json(
        new ApiError(500, "An error occurred while toggling publish status")
      );
  }
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
