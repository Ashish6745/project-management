import mongoose, {Schema} from "mongoose";


const userSchema  = new Schema({
    avatar :{
        type: {
            url:String, 
            localPath:String
        },
        default : {
            type: {
                url:`https://placehold.co/200x200`,
               localPath:""
            }
        }
    },

    username:{
        type:String,
        required:true,
        unique:true,
        lowerCase:true,
        trim:true,
        indexing:true
    },
    email:{
        type:String,
        required:true,
        lowerCase:true,
        unique:true,
        trim:true,
    },
  fullName:{
    type:String,
    trim:true,
  },

  password:{
    type:String,
    required:[true, 'Password is required']
  },

  isEmailVerified:{
    type:Boolean,
    default:false,
  },
  refreshToken:{
    type:String
  },
  forgotPasswordToken : {
    type: String
  },

   forgotPasswordExpiry:{
    type: Date
   },

   emailVerificationToken:{
    type:String
   },
   emailVerificationDate:{
    type:Date
   },




    },{timestamps:true});



export const User = mongoose.model("User", userSchema); 