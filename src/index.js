import dotenv from 'dotenv';
import app from './app.js';
import ConnectDb from './db/index.js';
dotenv.config({
    path:'./.env'
});

const PORT = process.env.PORT;


ConnectDb().then(
    () => {
        app.listen(PORT, () => {
    console.log('server is running on port 4000')
})
    }
)
.catch((e) =>{
    console.log("MongoDB connection Error ........ !!!!!!");
    process.exit(1);
})






// app.listen(PORT, () => {
//     console.log('server is running on port 4000')
// })

