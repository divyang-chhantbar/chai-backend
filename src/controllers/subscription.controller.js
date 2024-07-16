import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/users.model.js"
import { Subscription } from "../models/subscriptions.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params // extracted from request params
    // TODO: toggle subscription
    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel id") // validated
    }

    // fetch channel details
    const channel = await Subscription.findById(channelId)
    if(!channel) {
        throw new ApiError(404, "Channel not found")
    }
    const loggedInUser = req.user?._id
    if(!loggedInUser) {
        throw new ApiError(400, "Please Login to subscribe")
    }
    const userUnsubscribed = await Subscription.findOneAndDelete({
        subscriber: loggedInUser,
        channel: channel
    });
    if (!userUnsubscribed) {
        const userSubscribed = await Subscription.create({
          subscriber: loggedInUser,
          channel,
        });
        const createdSubscriber = await Subscription.findById(userSubscribed._id);
        console.log(createdSubscriber, "createdSubscriber");
      }
      return res.status(200).json(new ApiResponse(200, "Subscription toggled"));
    });

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}