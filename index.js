const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const users = require("./routes/users");
const cards = require("./routes/card")
const path = require("path");
const morgan = require("morgan");
const envFileSelect = process.env.NODE_ENV == 'production' ? '.env.prod' : '.env.dev';
require("dotenv").config({ path: path.resolve(__dirname, envFileSelect) });
const port = process.env.PORT || 5000;
const rft = require("rotating-file-stream");
const rateLimit = require("express-rate-limit");
const { User } = require("./models/User");
const initialData = require("./intialData");


mongoose.connect(process.env.MONGODB).then(async () => {
    try {
        await initialData();
        console.log("Database is connected successfully")
    } catch (error) {
        console.log(error);
    };
}).catch((err) => console.log(err));

const streamToFile = rft.createStream((time, index) => {
    if (!time) {
        let date = new Date().toISOString().slice(0, 10);
        return `${date}-error.log`;
    };
    let date = time.toISOString().slice(0, 10);
    return `${date}-error.log`
}, {
    interval: "1d",
    path: path.join(__dirname, 'logs')
});

const limiter = rateLimit({
    windowMs: 1000 * 60 * 15,
    max: 100,
    message: "Too many requests from this IP, please try again later"
});


const server = express();
server.use(express.json());
server.use(morgan("tiny", { skip: (req, res) => res.statusCode < 400, stream: streamToFile }));
server.use(cors());
server.use(limiter);

server.use("/api/users", users);
server.use("/api/cards", cards);

server.get("*", (req, res) => {
    res.status(404).send("404 - Not found");
})


server.listen((port), () => console.log("Server is connected to port ", port));



