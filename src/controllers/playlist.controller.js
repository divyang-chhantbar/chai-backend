import mongoose, { isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  try {
    const { name, description } = req.body;
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      throw new ApiError(400, "Invalid user id");
    }

    if (!name || !description) {
      throw new ApiError(400, "Name and description are required");
    }

    if (description.length > 200) {
      throw new ApiError(400, "Description is too long");
    }

    if (!isAuthorized(userId, req.user._id)) {
      throw new ApiError(
        403,
        "You are not authorized to create a playlist for this user"
      );
    }

    const playlist = new Playlist.create({
      name,
      description,
      owner: userId,
    });

    await playlist.save();
    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          { playlist },
          "Playlist has been created successfully"
        )
      );
  } catch (error) {
    // Handle errors and return error response
    console.error(error);
    return res
      .status(error.status || 500)
      .json(new ApiResponse(error.status, null, error.message));
  }
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { name } = req.body;
  const { page = 1, limit = 10 } = req.query;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }
  if (!name) {
    throw new ApiError(400, "Name is required");
  }
  const playlists = await Playlist.find({ owner: userId, name: name })
    .populate("videos owner")
    .limit(limit)
    .skip((page - 1) * limit)
    .exec();
  return res
    .status(200)
    .json(
      new ApiResponse(200, { playlists }, "User playlists have been retrieved")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  const playlist = await Playlist.findById(playlistId).populate("videos owner");

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  const creation = {
    date: playlist.createdAt,
    user: playlist.owner,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist, creation },
        "Playlist retrieved successfully"
      )
    );
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Playlist.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await Playlist.findByIdAndUpdate(playlistId, { $push: { videos: video } });

  return res
    .status(200)
    .json(
      new ApiResponse(200, { playlist }, "Video added to playlist successfully")
    );
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const playlist = await Playlist.findById(playlistId);
  const video = await Playlist.findById(videoId);

  if (!playlist) {
    throw new ApiError(404, "Playlist not found");
  }

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  await Playlist.findByIdAndUpdate(playlistId, {
    $pull: { videos: video._id },
  });
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist },
        "Video removed from playlist successfully"
      )
    );
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { userId } = req.user;

  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "Invalid playlist ID");
  }
  
  const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
    throw new ApiError(404, "Playlist not found");
    }

  if(!isAuthorized(userId, playlist.owner)) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
  }

    await Playlist.findByIdAndDelete(playlistId);
    return res
      .status(200)
      .json(new ApiResponse(200, null, "Playlist deleted successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
