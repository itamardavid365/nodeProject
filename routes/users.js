const express = require("express");
const { userValidationJoi, User } = require("../models/User");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const auth = require("../middlewares/auth");
const _ = require("lodash")

// register
router.post("/register", async (req, res) => {
    try {
        // user joi validation
        await userValidationJoi(req.body);
        // if email-unique/user exist
        let existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) return res.status(400).send("User allready exist");
        // encrypt password
        const salt = await bcrypt.genSalt(10);
        const encrptPassword = await bcrypt.hash(req.body.password, salt);
        // create user
        const newUser = new User({ ...req.body, password: encrptPassword });
        await newUser.save();
        // create/send token
        const token = jwt.sign({ _id: newUser._id, isBusiness: newUser.isBusiness, isAdmin: newUser.isAdmin }, process.env.JWTKEY);
        res.status(201).send(token)
    } catch (error) {
        if (error.isJoi) {
            return res.status(400).send(error.details.map((err) => err.message));
        }
        res.status(500).send(["mongooseSchema error", error.message]);
    }
})

const loginUserSchema = Joi.object({
    email: Joi.string().email(),
    password: Joi.string().required().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/).message("Password must contain at least 8 characters one uppercase letter, one lowercase letter, and one special character.")
})

// login
router.post("/login", async (req, res) => {
    try {
        // Joi validation
        const { error } = loginUserSchema.validate(req.body);
        if (error) return res.status(400).send("Email or password are incorrect");
        // check if user exist
        let user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).send("Email or password are incorrect");
        // is user blocked
        if (user.loginAttempts.blockedUntil) {
            const timeLeft = user.loginAttempts.blockedUntil - Date.now();
            if (timeLeft > 0) {
                const hoursLeft = Math.ceil(timeLeft / (1000 * 60 * 60));
                return res.status(403).send(`Account is blocked for ${hoursLeft}H, try again later`)
            } else {
                user.loginAttempts.blockedUntil = null;
            }
        }
        // decrypt password and compare
        const passFlag = await bcrypt.compare(req.body.password, user.password);
        if (!passFlag) {
            const now = Date.now();
            user.loginAttempts.loginTries = user.loginAttempts.loginTries.filter(date => now - date < 1000 * 60 * 60 * 24
            );
            user.loginAttempts.loginTries.push(Date.now())
            if (user.loginAttempts.loginTries.length >= 3) {
                user.loginAttempts.blockedUntil = Date.now() + (1000 * 60 * 60 * 24);
                user.loginAttempts.loginTries = [];
                await user.save();
                return res.status(403).send(`Account is blocked for 24H, try again later`);
            }
            await user.save();
            return res.status(400).send("Email or password are incorrect")
        };
        // create and return token
        user.loginAttempts.loginTries = [];
        await user.save();
        const token = jwt.sign({ _id: user._id, isBusiness: user.isBusiness, isAdmin: user.isAdmin }
            , process.env.JWTKEY)
        res.status(200).send(token)
    } catch (error) {
        res.status(400).send(error)
    }
})

// admin get all users
router.get("/", auth, async (req, res) => {
    try {
        console.log(req.payload)
        if (!req.payload.isAdmin) return res.status(400).send("Access denied")

        const users = await User.find({}, { _id: true, name: true, email: true, isBusiness: true });
        if (!users) return res.status(400).send("No users found in the database");
        res.status(200).send(users);
    } catch (error) {
        res.status(400).send(error)
    }
})

// admin or the user get its data
router.get("/:id", auth, async (req, res) => {
    try {
        if (req.payload._id !== req.params.id && !req.payload.isAdmin) return res.status(400).send("Access denied")
        const user = await User.findById(req.params.id, { password: false });
        if (!user) return res.status(404).send("No such user found");
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
})

const editUserSchema = Joi.object({
    name: Joi.object({
        first: Joi.string().allow("").min(2),
        middle: Joi.string().allow("").min(2),
        last: Joi.string().allow("").min(2),
    }),
    phone: Joi.string().pattern(/^(?:\+972[-\s]?)?(0[2-9])[-\s]?(\d{7})$|^(?:\+972[-\s]?)?(05[0-9])[-\s]?(\d{7})$/
        , "Must be valid israeli phone number").required(),
    image: Joi.object({
        url: Joi.string().pattern(/^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))(?:\?.*)?$/).message("Please enter a valid image URL").default("https://www.svgrepo.com/show/512697/profile-1341.svg").allow(""),
        alt: Joi.string().default("Profile image").allow(""),
    }),
    address: Joi.object({
        state: Joi.string().min(2).allow(""),
        country: Joi.string().required().min(2),
        city: Joi.string().required().min(2),
        street: Joi.string().required().min(2),
        houseNumber: Joi.number().required().min(1),
        zip: Joi.number().default(0).min(0)
    }),
})

// edit user details  //auth: the user
router.put("/:id", auth, async (req, res) => {
    try {
        if (req.payload._id !== req.params.id) return res.status(400).send("Access deined");
        const { error } = await editUserSchema.validateAsync(req.body);
        if (error) return res.status(400).send(error.details[0].message)
        let user = await User.findByIdAndUpdate(req.payload._id, req.body, { new: true });
        res.status(200).send(_.omit(user.toObject(), ["__v", "password"]))
    } catch (error) {
        if (error.details[0].message) {
            res.status(400).send(error.details[0].message)
        }
        res.status(400).send(error);
    }
})

// change isBusiness status true/false
router.patch("/:id", auth, async (req, res) => {
    try {
        if (req.params.id !== req.payload._id) return res.status(400).send("Access denied");
        let user = await User.findById(req.payload._id);
        if (!user) return res.status(400).send("No such user");
        user.isBusiness = !user.isBusiness;
        await user.save();
        res.status(200).send(_.omit(user.toObject(), ["password", "__v"]));
    } catch (error) {
        res.status(400).send(error)
        console.log(error);
    }
})
// delete user
router.delete("/:id", auth, async (req, res) => {
    try {
        if (req.payload._id !== req.params.id && !req.payload.isAdmin) return res.status(403).send("Access denied");
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send("No such user");
        await user.deleteOne()
        res.status(200).send("User was deleted");
    } catch (error) {
        res.status(400).send(error)
    }
})



module.exports = router;