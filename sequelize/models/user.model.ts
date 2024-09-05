import { DataTypes } from "sequelize";
import { sequelize } from "../config/sequelize.ts";
import bcrypt from "bcrypt";
import { UserInstance } from "../../types/models/user";
import { IDb } from "../../types/models/models";

const User: UserInstance = sequelize.define<UserInstance>(
  "Users",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    defaultScope: {
      attributes: { exclude: ["password"] }, // Exclude password from default queries
    },
    scopes: {
      withPassword: {
        attributes: { include: ["password"] }, // Include password in this scope if needed
      },
    },
    hooks: {
      beforeSave: async (user: UserInstance) => {
        if (user.changed("password")) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

User.associate = function (models: IDb) {
  User.hasMany(models.Post, {
    foreignKey: "UserId",
    onDelete: "CASCADE",
  });

  User.hasMany(models.Comment, {
    foreignKey: "UserId",
    onDelete: "CASCADE",
  });
};

export default User;
