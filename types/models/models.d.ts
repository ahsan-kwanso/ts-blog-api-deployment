import { sequelize } from "../config/sequelize";
import { Sequelize } from "sequelize";
import { DataTypes } from "sequelize";
import { CommentInstance } from "../../types/comment";
import Comment from "../../sequelize/models/comment.model";
import User from "../../sequelize/models/user.model";
import Post from "../../sequelize/models/post.model";

export interface IDb {
  User: typeof User;
  Post: typeof Post;
  Comment: typeof Comment;
  sequelize: Sequelize;
  Sequelize: typeof Sequelize;
}
