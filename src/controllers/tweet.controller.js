import { Tweet } from "../models/tweet.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { isValidObjectId } from "mongoose";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { _id } = req.user;

  if (!content) {
    throw new ApiError(400, "Please provide some content");
  }

  if (!_id) {
    throw new ApiError(400, "Invalid User");
  }

  const tweet = await Tweet.create({
    content,
    owner: _id,
  });

  if (!tweet) {
    throw new ApiError(500, "Something went wrong while adding tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet added successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { tweetId } = req.params;
  const { _id } = req.user;

  if (!_id) {
    throw new ApiError(400, "Invalid user Id");
  }

  if (!content) {
    throw new ApiError(400, "Please provide some content");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== _id.toString()) {
    throw new ApiError(400, "Only owner can update the tweet");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweet._id,
    {
      $set: {
        content,
      },
    },
    {
      new: true,
    }
  );

  if (!updatedTweet) {
    throw new ApiError(500, "Something went wrong while updating tweet");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { _id } = req.user;

  if (!_id) {
    throw new ApiError(400, "invalid user");
  }

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "invalid TweetId");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  if (tweet.owner.toString() !== _id) {
    throw new ApiError(400, "Only owner can delete the tweet");
  }

  await Tweet.findByIdAndDelete(tweet._id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully"));
});

export { createTweet, updateTweet };
