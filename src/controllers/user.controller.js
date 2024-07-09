import { asynchHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/User.model.js";
import { cloudinaryUploadHandler } from "../utils/cloudinaryUploader.js";

const registerUser = asynchHandler(async (req, res) => {
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

export { registerUser };
