import express from 'express';
import cors from 'cors';
import healthCheckRoutes from './routes/healthCheck.routes.js';
const app = express();

app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use('/api/v1/healthCheck', healthCheckRoutes);


app.get('/', (req,res) => {
    res.send('Hellow worlds!!!fdsfdsfdsfs!!!!!!')
})



export default app;


