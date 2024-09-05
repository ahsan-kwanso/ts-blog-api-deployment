import Post from "../sequelize/models/post.model.ts";
import User from "../sequelize/models/user.model.ts";
import db from "../sequelize/models/index.ts";
import { Request } from "express";
import { Op } from "sequelize";
import { validatePagination, generateNextPageUrl } from "../utils/pagination.ts";
import paginationConfig from "../utils/pagination.config.ts";
import { ERROR_MESSAGES, PostStatus } from "../utils/messages.ts";
import {
  PostAttributes,
  PaginatedPostsResponse,
  ErrorResponse,
  PostWithUser,
  PostResponse,
  Post as PostModel,
} from "../types/post";

const createPost = async (title: string, content: string, userId: number): Promise<PostModel> => {
  const post = await Post.create({ title, content, UserId: userId });
  return post;
};

//
const getPosts = async (req: Request): Promise<PaginatedPostsResponse> => {
  const pageNumber = parseInt(req.query.page as string, 10) || paginationConfig.defaultPage;
  const pageSize = parseInt(req.query.limit as string, 10) || paginationConfig.defaultLimit;
  // Fetch posts with pagination
  const { count, rows } = await db.Post.findAndCountAll({
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: [
      {
        model: User,
        attributes: ["name"], // Fetch only the name attribute from the User model
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const posts: PostResponse[] = rows.map((post: PostWithUser) => ({
    id: post.id,
    author: post.User?.name, // Access the user's name
    title: post.title,
    content: post.content,
    date: post.updatedAt.toISOString().split("T")[0], // Format date as YYYY-MM-DD
  }));

  // Calculate pagination details
  const totalPages = Math.ceil(count / pageSize);
  const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;

  return {
    posts,
    total: count,
    page: pageNumber,
    pageSize: pageSize,
    nextPage: generateNextPageUrl(nextPage, pageSize, req),
  };
};

const getMyPosts = async (req: Request): Promise<PaginatedPostsResponse> => {
  const { id } = req.user as { id: number };
  const pageNumber = parseInt(req.query.page as string, 10) || paginationConfig.defaultPage;
  const pageSize = parseInt(req.query.limit as string, 10) || paginationConfig.defaultLimit;
  const userId = req.query.userId as string;

  if (!userId) {
    return { success: true, posts: [], total: 0, nextPage: null }; // Return an empty result
  }
  if (id !== parseInt(userId)) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }

  const numericUserId = Number(userId);

  // Fetch posts with pagination
  const { count, rows } = await db.Post.findAndCountAll({
    where: {
      UserId: numericUserId, // Filter posts by the current user's ID
    },
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: [
      {
        model: User,
        attributes: ["name"], // Fetch only the name attribute from the User model
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const posts: PostResponse[] = rows.map((post: PostWithUser) => ({
    id: post.id,
    author: post.User?.name, // Access the user's name
    title: post.title,
    content: post.content,
    date: post.updatedAt.toISOString().split("T")[0], // Format date as YYYY-MM-DD
  }));

  // Calculate pagination details
  const totalPages = Math.ceil(count / pageSize);
  const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;

  return {
    posts,
    total: count,
    page: pageNumber,
    pageSize: pageSize,
    nextPage: generateNextPageUrl(nextPage, pageSize, req),
  };
};

const getPostById = async (postId: number): Promise<{ success: boolean; post?: PostAttributes; message?: string }> => {
  const post = await Post.findByPk(postId);
  if (!post) {
    throw new Error(PostStatus.POST_NOT_FOUND);
  }
  return { success: true, post };
};

const updatePost = async (
  postId: number,
  title: string,
  content: string,
  userId: number
): Promise<{ success: boolean; post?: PostAttributes; message?: string }> => {
  const post = await Post.findByPk(postId);
  if (!post) {
    throw new Error(PostStatus.POST_NOT_FOUND);
  }
  if (post.UserId !== userId) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }

  post.title = title || post.title;
  post.content = content || post.content;
  await post.save();

  return { success: true, post };
};

const deletePost = async (postId: number, userId: number): Promise<{ success: boolean; message?: string }> => {
  const post = await Post.findByPk(postId);
  if (!post) {
    throw new Error(PostStatus.POST_NOT_FOUND);
  }
  if (post.UserId !== userId) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }

  await post.destroy();
  return { success: true, message: PostStatus.POST_DELETED_SUCCESSFULLY };
};

const searchPostsByTitle = async (req: Request): Promise<ErrorResponse | PaginatedPostsResponse> => {
  const { title } = req.query;
  const pageNumber = parseInt(req.query.page as string, 10) || paginationConfig.defaultPage;
  const pageSize = parseInt(req.query.limit as string, 10) || paginationConfig.defaultLimit;

  // Fetch posts with pagination and search by title
  const { count, rows } = await db.Post.findAndCountAll({
    where: {
      title: {
        [Op.iLike]: `%${title}%`, // Case-insensitive search
      },
    },
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: [
      {
        model: db.User,
        attributes: ["name"], // Fetch only the name attribute from the User model
      },
    ],
  });

  const posts: PostResponse[] = rows.map((post: PostWithUser) => ({
    id: post.id,
    author: post?.User?.name, // Access the user's name
    title: post.title,
    content: post.content,
    date: post.updatedAt.toISOString().split("T")[0], // Format date as YYYY-MM-DD
  }));

  // Calculate pagination details
  const totalPages = Math.ceil(count / pageSize);
  const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;

  return {
    posts,
    total: count,
    page: pageNumber,
    pageSize: pageSize,
    nextPage: generateNextPageUrl(nextPage, pageSize, req),
  };
};

const searchUserPostsByTitle = async (req: Request): Promise<ErrorResponse | PaginatedPostsResponse> => {
  const { id } = req.user as { id: number };
  const { title } = req.query;
  const pageNumber = parseInt(req.query.page as string, 10) || paginationConfig.defaultPage;
  const pageSize = parseInt(req.query.limit as string, 10) || paginationConfig.defaultLimit;
  const userId = req.query.userId as string; // Extract UserId from query as sent from front end
  const numericUserId = Number(userId);

  if (id !== parseInt(userId)) {
    throw new Error(ERROR_MESSAGES.FORBIDDEN);
  }
  // Fetch posts with pagination and search by title for the authenticated user
  const { count, rows } = await db.Post.findAndCountAll({
    where: {
      title: {
        [Op.iLike]: `%${title}%`, // Case-insensitive search
      },
      UserId: numericUserId, // Filter by UserId
    },
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    include: [
      {
        model: db.User,
        attributes: ["name"], // Fetch only the name attribute from the User model
      },
    ],
  });
  const posts: PostResponse[] = rows.map((post: PostWithUser) => ({
    id: post.id,
    author: post?.User?.name, // Access the user's name
    title: post.title,
    content: post.content,
    date: post.updatedAt.toISOString().split("T")[0], // Format date as YYYY-MM-DD
  }));

  // Calculate pagination details
  const totalPages = Math.ceil(count / pageSize);
  const nextPage = pageNumber < totalPages ? pageNumber + 1 : null;

  return {
    posts,
    total: count,
    page: pageNumber,
    pageSize: pageSize,
    nextPage: generateNextPageUrl(nextPage, pageSize, req),
  };
};

export { createPost, getPosts, getPostById, updatePost, deletePost, searchPostsByTitle, getMyPosts, searchUserPostsByTitle };
