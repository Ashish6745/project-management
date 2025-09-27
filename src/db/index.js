import mongoose from 'mongoose';


const ConnectDb = async () => {
   try {
        await mongoose.connect(process.env.MONGO_URI)
   } catch (error) {
      console.log("Mongo DB connection Failed");
      process.exit(1);
   }
}


export default ConnectDb;