import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import { cloudinaryUploadHandler } from "../utils/cloudinaryUploader.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while genrating access token and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, password, username } = req.body;

  switch ("") {
    case fullName:
      throw new ApiError(400, "fullName is Required !");

    case email:
      throw new ApiError(400, "email is Required !");

    case password:
      throw new ApiError(400, "password is Required !");

    case username:
      throw new ApiError(400, "username is Required !");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with username or email already exist !");
  }

  const avatarLocalFile = req?.files?.avatar?.[0]?.path;
  const coverImageLocalFile = req?.files?.coverImage?.[0]?.path;

  if (!avatarLocalFile) {
    throw new ApiError(400, "Avatar is Required !");
  }

  const avatar = await cloudinaryUploadHandler(avatarLocalFile);
  const coverImage = await cloudinaryUploadHandler(coverImageLocalFile);

  if (!avatar) {
    throw new ApiError(
      500,
      "Something went wrong while uploading avatar image !"
    );
  }

  const user = await User.create({
    fullName,
    username,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
  });
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "could not create User deu to some issue !");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created Successfully !"));
});

const logInUser = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  if (!(username || email)) {
    throw new ApiError(500, "invalid username or emial !");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User with username or email not found !");
  }

  const isPasswordvalid = await user.isPasswordCorrect(password);

  if (!isPasswordvalid) {
    throw new ApiError(500, "Invalid Password !");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user loggedIn successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  await User.findByIdAndUpdate(
    _id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User LoggedOut Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incommingRefreshToken) {
    throw new ApiError(401, "Invalid RefreshToken");
  }

  try {
    const { _id } = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(_id);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isTokenvalid = user.refreshToken === incommingRefreshToken;

    if (!isTokenvalid) {
      throw new ApiError(401, "unauthorized Access");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "User loggedIn Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refreshToken");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  try {
    const user = req.user;

    const loggedInUser = await User.findById(user._id);

    if (!loggedInUser) {
      throw new ApiError(400, "User not found");
    }

    const isPassValid = await loggedInUser.isPasswordCorrect(oldPassword);

    if (!isPassValid) {
      throw new ApiError(400, "Invalid Password");
    }

    loggedInUser.password = newPassword;

    await loggedInUser.save({ validateBeforeSave: false });

    res
      .status(200)
      .json(new ApiResponse(200, {}, "Password changed Successfully"));
  } catch (error) {
    throw new ApiError(500, "something went wrong while changing password");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;
  try {
    return res
      .status(200)
      .json(new ApiResponse(200, user, "current user fetched successfully"));
  } catch (error) {
    new new ApiError(500, "Something went wrong while fetching user ")();
  }
});

export {
  registerUser,
  logInUser,
  logOutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
};
