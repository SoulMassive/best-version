import { Connection } from "../models/Connection.js";
import { FeedPost } from "../models/FeedPost.js";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendResponse } from "../utils/response.js";

export const getCommunity = asyncHandler(async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const [people, feed, connections, total] = await Promise.all([
    User.find({ _id: { $ne: req.user._id } }).select("-password").sort({ "stats.xp": -1 }).limit(12),
    FeedPost.find()
      .populate("author", "name avatar headline")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Connection.find({ follower: req.user._id }),
    FeedPost.countDocuments(),
  ]);

  const followingSet = new Set(connections.map((item) => item.following.toString()));

  return sendResponse(res, {
    message: "Community data fetched",
    data: {
      people: people.map((person) => ({
        ...person.toObject(),
        isFollowing: followingSet.has(person._id.toString()),
      })),
      feed: feed.map((post) => ({
        ...post.toObject(),
        likeCount: post.likedBy ? post.likedBy.length : post.likes,
        hasLiked: post.likedBy ? post.likedBy.some((id) => id.toString() === req.user._id.toString()) : false,
        commentCount: post.comments ? post.comments.length : 0,
      })),
      prompts: [
        "Find someone to co-build a portfolio project this month.",
        "Follow three people in the path you want to grow into.",
        "Share a weekly win to keep your momentum visible.",
      ],
      pagination: { page: Number(page), total, hasMore: skip + limit < total },
    },
  });
});

export const getFeed = asyncHandler(async (req, res) => {
  const { page = 1 } = req.query;
  const limit = 20;
  const skip = (Number(page) - 1) * limit;

  const [feed, total] = await Promise.all([
    FeedPost.find()
      .populate("author", "name avatar headline")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    FeedPost.countDocuments(),
  ]);

  return sendResponse(res, {
    message: "Feed fetched",
    data: {
      posts: feed.map((post) => ({
        ...post.toObject(),
        likeCount: post.likedBy ? post.likedBy.length : post.likes,
        hasLiked: post.likedBy ? post.likedBy.some((id) => id.toString() === req.user._id.toString()) : false,
        commentCount: post.comments ? post.comments.length : 0,
      })),
      pagination: { page: Number(page), total, hasMore: skip + limit < total },
    },
  });
});

export const createPost = asyncHandler(async (req, res) => {
  const { content, type, tags } = req.body;
  if (!content || !content.trim()) {
    throw new ApiError(400, "Post content is required");
  }
  if (content.length > 1000) {
    throw new ApiError(400, "Post content cannot exceed 1000 characters");
  }

  const post = await FeedPost.create({
    author: req.user._id,
    content: content.trim(),
    type: type || "update",
    tags: tags || [],
  });

  await post.populate("author", "name avatar headline");

  return sendResponse(res, {
    statusCode: 201,
    message: "Post created",
    data: { ...post.toObject(), likeCount: 0, hasLiked: false, commentCount: 0 },
  });
});

export const toggleLikePost = asyncHandler(async (req, res) => {
  const post = await FeedPost.findById(req.params.postId);
  if (!post) throw new ApiError(404, "Post not found");

  const userId = req.user._id.toString();
  const likedIdx = post.likedBy ? post.likedBy.findIndex((id) => id.toString() === userId) : -1;

  if (likedIdx > -1) {
    post.likedBy.splice(likedIdx, 1);
    post.likes = Math.max(0, (post.likes || 0) - 1);
  } else {
    if (!post.likedBy) post.likedBy = [];
    post.likedBy.push(req.user._id);
    post.likes = (post.likes || 0) + 1;
  }

  await post.save();

  return sendResponse(res, {
    message: likedIdx > -1 ? "Post unliked" : "Post liked",
    data: { likeCount: post.likedBy.length, hasLiked: likedIdx === -1 },
  });
});

export const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    throw new ApiError(400, "Comment content is required");
  }

  const post = await FeedPost.findById(req.params.postId);
  if (!post) throw new ApiError(404, "Post not found");

  if (!post.comments) post.comments = [];
  post.comments.push({ user: req.user._id, content: content.trim() });
  await post.save();

  const lastComment = post.comments[post.comments.length - 1];

  return sendResponse(res, {
    statusCode: 201,
    message: "Comment added",
    data: { ...lastComment.toObject(), user: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar } },
  });
});

export const deletePost = asyncHandler(async (req, res) => {
  const post = await FeedPost.findById(req.params.postId);
  if (!post) throw new ApiError(404, "Post not found");
  if (post.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You can only delete your own posts");
  }

  await post.deleteOne();
  return sendResponse(res, { message: "Post deleted", data: { deleted: true } });
});

export const followUser = asyncHandler(async (req, res) => {
  const connection = await Connection.findOneAndUpdate(
    { follower: req.user._id, following: req.params.userId },
    {},
    { new: true, upsert: true }
  );

  return sendResponse(res, {
    statusCode: 201,
    message: "Connection saved",
    data: connection,
  });
});

export const unfollowUser = asyncHandler(async (req, res) => {
  await Connection.findOneAndDelete({
    follower: req.user._id,
    following: req.params.userId,
  });

  return sendResponse(res, {
    message: "Connection removed",
    data: { following: req.params.userId, isFollowing: false },
  });
});
