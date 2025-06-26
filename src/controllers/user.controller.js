import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshTokens()        

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false})

        return { accessToken , refreshToken}

    } catch (error) {
        throw new ApiError(500, "something went wrong while generating refresh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
//    steps to make register user==>
    // 1.get user detail from frontend
    // 2.validation- not empty
    // 3. check if user already exist: username,email
    // 4.check for images, check for avatar
    // 5.upload them to cloudinary ,avatar
    // 6.create user object - create entry in db
    // 7.remove password and refresh token field from response 
    // 8.check for user creation
    // 9.return res 

     const { fullname,email,username,password } =req.body  //req.body se sare data points ko extact kiya
    //  console.log("email:", email);

     if(
        [fullname,email,username,password].some((field) => 
        field?.trim() === "")
     ){
        throw new ApiError(400, "All fields are required")
     }  // check data strings that they are not empty

    const existedUser = await User.findOne({   //ckeck krta hai ki user already exist krta hai kya same username or email se
        $or: [{ username }, { email }]
    })
    if(existedUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    // console.log(req.files)

    const avatarLocalPath =  req.files?.avatar[0]?.path;     //find local path of avatar
    // const coverImageLocalPath =  req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

   if(!avatarLocalPath) {   //avatar nhi mila to error throw kr do 
    throw new ApiError(400, "Avatar file is required")
   }

    const avatar = await uploadOnCloudinary(avatarLocalPath)   //avatar mil gya to cloudinary pr upload kr do
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){   //avatar nhi upload hua hai to error throw kr do
        throw new ApiError(400,"Avatar file is required")
    }

    const user = await User.create({   //if sb kuch ho gya hai to object create kr do
        fullname,  
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {    //agr user nhi create nhi hua hai to error throw kr do
        throw new ApiError(500,"something went wrong while registering the user")
    }

    return res.status(201).json(    //create ho gya hai to response dedo
        new ApiResponse(200, createdUser, "User registered successfully")
    )


})

    const loginUser = asyncHandler(async (req,res) => {
        // req body -> data
        // username or email
        // find the user
        // password check
        // access and refresh token
        // send cookie


        const { username , email , password } =req.body

        if(!username || !email){
            throw new ApiError(400, "username or email is required")
        }

        const user = await User.findOne({
            $or: [{username},{email}]
        })

        if(!user){
            throw new ApiError(404, "User does not exist")
        }

        const isPasswordValid = await user.isPasswordCorrect(password)
        if(!isPasswordValid){
            throw new ApiError(401,"password is incorrect")
        }

        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

         const loggedInUser = await User.findById(user._id).select("-password -refreshToken")  //optional

         const options = {
            httpOnly: true,
            secure: true
         }

         return res
         .status(200)
         .cookie("accessToken, options") 
         .cookie("refreshToken, refreshToken, options")
         .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,accessToken,refreshToken
                },
                "User logged In successfully"
            )

         )
    })

    const logoutUser = asyncHandler(async (req, res) => {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                 $set:{
                    refreshToken: undefined
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
         .json(new ApiResponse(200, {}, "User logged Out"))

})


    // res.status(200).json({
    //     message: "chai-aur-code"
    // })
// })   //registerUser ki definition

export { registerUser, loginUser, logoutUser }