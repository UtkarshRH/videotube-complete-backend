import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js" 
import {User} from "../model/user.model.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponce } from "../utils/ApiResponce.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessTokenAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave:false })

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    // return res.status(200).json({
    //     message: "OK"
    // });

    //Get user details from frontend
    //Validation - not Empty
    // Check if user already exist : username, email
    // Check for image check for avatar
    // Upload them to cloudinary , avatar
    // Create user object - create entry in db 
    // remove password and refresh entry field from responce 
    // check for the user creation 
    // return res 

    const { fullname, email, username, password } = req.body
    
    // console.log("email : ", email )

    // console.log(req.body)
    
    if (
        [fullname, email, username, password].some((field)=>
            field?.trim() === "")
    ) {
        throw new ApiError(400,"All Field Are Required")
    }

    const existedUser = await User.findOne({
        $or:[{username},{email}]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email and username alredy exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar field is required")
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponce(200,createdUser,"User registerd Succesfully")
    )
});

const loginUser = asyncHandler(async(req,res)=>{
    /*
    req body -> data
    username or email
    find User
    password check 
    access and refresh token 
    send cookies
    */
   const {email, username, password} = req.body

   if (!username && !email) {
    throw new ApiError(400, "username or password is required")
   }

   const user = await User.findOne({
    $or:[{username},{email}]
   })

   if (!user) {
    throw new ApiError(404,"User Does not exist")
   }

   const isPasswordValid = await user.isPasswordCorrect(password)
   if (!isPasswordValid) {
    throw new ApiError(401,"Invalid User Credentials")
   }

  const {accessToken,refreshToken} = await generateAccessTokenAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id)
  .select("-password -refreshToken")
  const options = {
    httpOnly: true,
    secure: true
};

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken, options)
  .json(
    new ApiResponce(
        200,
        {
            user:loggedInUser,accessToken,refreshToken
        },
        "User Logged In Succesfully"
    )
  )
})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponce(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken  || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRETE
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401,"Invalid Refresh Token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh Token is Expire or Used")
        }
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessTokenAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponce(
                200,
                {accessToken, refreshToken:newRefreshToken},
                "Access Token Refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid Refresh Token")
    }
})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400,"Invalid Old Password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false})

    return res
    .status(200)
    .json( new ApiResponce(200,{}, "Password Change Succesfully"))
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponce(
        200,
        req.user,
        "User fetch succesfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {email, fullname} = req.body

    if(! fullname || !email){
        throw new ApiError(400, "All field are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname, //{ fullname : fullname }
                email: email // { email }
            }
        },
        {
            new:true
        }
    ).select("-password")
    return res
    .status(200)
    .json(new ApiResponce(200,user,"Account Details Updated Succesfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    // TODO : delete old image

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    const oldUrl = req.user.avatar
    const urlParts = oldUrl.split('/')
    const public_id = urlParts[urlParts.length - 1].split('.')[0]
    console.log( "Avatar public Id: ",public_id);

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar : avatar.url
            }
        },
        {new:true}
    ).select("-password")

    const deleteAvatar = await deleteOnCloudinary(public_id, "image")

    return res
    .status(200)
    .json(new ApiResponce(200,user,"Avatar updated succesfully"))
})

const updateUserCoverImage  = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"Cover image file is missing")
    }

    
    const coverImage = uploadOnCloudinary(coverImageLocalPath)
    
    //TODO : delete old image
    const oldUrl = req.user.coverImage
    const urlParts = oldUrl.split('/') 
    const public_id =  urlParts[urlParts.length - 1].split('.')[0]
    console.log("Cover image public_id: ",public_id)

    if(!coverImage){
        throw new ApiError(400,"Error while uploading on coverimage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage : coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    const deleteCoverImage = await deleteOnCloudinary(public_id,"image")

    return res
    .status(200)
    .json(
        new ApiResponce(200,user,"Cover image updated succesfully")
    )
})

const getUserChanelProfile  = asyncHandler(async(req, res) => {
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $cond: {
                        if: { $isArray: "$subscribers" },
                        then: { $size: "$subscribers" },
                        else: 0
                    }
                },
                channelsSubscribedToCount: {
                    $cond: {
                        if: { $isArray: "$subscribedTo" },
                        then: { $size: "$subscribedTo" },
                        else: 0
                    }
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ]);

    if (!channel?.length) {
        throw new ApiError(400, "Channel not exists");
    }

    return res.status(200).json(
        new ApiResponce(200, channel[0], "User channel fetched successfully")
    );
});


const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res
    .status(200)
    .json(
        new ApiResponce(
            200,
            user[0].watchHistory,
            "Watch history fetch succesfully"
        )
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChanelProfile,
    getWatchHistory
}