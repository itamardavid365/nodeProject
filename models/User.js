const { Schema, model } = require("mongoose");
const Joi = require("joi");

const userSchema = new Schema({
    name: {
        type: {
            first: {
                type: String,
                trim: true,
                validate: {
                    validator: (value) => {
                        return value === "" || value.length >= 2
                    },
                    message: "First name must have atleast 2 charecter or empty"
                }
            },
            middle: {
                type: String,
                trim: true,
            },
            last: {
                type: String,
                trim: true,
            },
        }
    },
    phone: {
        type: String,
        required: true,
        match: [/^(?:\+972[-\s]?)?(0[2-9])[-\s]?(\d{7})$|^(?:\+972[-\s]?)?(05[0-9])[-\s]?(\d{7})$/, "Phone number must be a valid israeli phone "],
    },
    email: {
        type: String,
        lowercase: true,
        unique: true,
        required: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Pls enter valid email"],
    },
    password: {
        type: String,
        required: true,
    },
    image: {
        type: {
            url: {
                type: String,
                match: [
                    /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))(?:\?.*)?$/,
                    "Please enter a valid image URL (jpg, jpeg, png, gif, webp, svg)"],
                set: (value) => {
                    if (!value) return "https://www.svgrepo.com/show/512697/profile-1341.svg"
                    return value
                },
            },
            alt: {
                type: String,
                set: (alt) => {
                    return alt ? alt : "Profile image"
                }
            }
        }
    },
    address: {
        type: {
            state: {
                type: String,
            },
            country: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            street: {
                type: String,
                required: true,
            },
            houseNumber: {
                type: Number,
                required: true,
            },
            zip: {
                type: Number,
                default: 0,
                min: 0,
            },
        }
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    isBusiness: {
        type: Boolean,
        required: true
    },
    createAt: {
        type: Date,
        default: Date.now
    },
    loginAttempts: {
        loginTries: {
            type: Array,
            default: []
        },
        blockedUntil: {
            type: Date,
            default: null
        }
    }
})

function userValidationJoi(user) {
    const userSchema = Joi.object({
        name: Joi.object({
            first: Joi.string().allow("").min(2),
            middle: Joi.string().allow("").min(2),
            last: Joi.string().allow("").min(2),
        }),
        phone: Joi.string().pattern(/^(?:\+972[-\s]?)?(0[2-9])[-\s]?(\d{7})$|^(?:\+972[-\s]?)?(05[0-9])[-\s]?(\d{7})$/
            , "Must be valid israeli phone number").required(),
        email: Joi.string().email().required(),
        password: Joi.string().required().pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\W).{8,}$/).message("Password must contain at least 8 characters one uppercase letter, one lowercase letter, and one special character."),
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
        isAdmin: Joi.boolean().default(false),
        isBusiness: Joi.boolean().required(),
    })
    return userSchema.validateAsync(user, { abortEarly: false })
}



const User = model("users", userSchema);

module.exports = { User, userValidationJoi };