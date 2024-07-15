import { User } from "../models/User.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asynchHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJwt = asynchHandler(async (req, _, next) => {
  try {
    const token =
      req.cookie.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized Access !");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token !");
    }

    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(401, error.message || "Invalid Access Token");
  }
});
