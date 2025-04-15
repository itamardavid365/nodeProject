const mongoose = require("mongoose");
const Joi = require("joi");

const cardSchema = new mongoose.Schema({
    title: {
        type: String,
        minLength: 2,
        required: true
    },
    subtitle: {
        type: String,
        minLength: 2,
        required: true
    },
    description: {
        type: String,
        minLength: 2,
        required: true
    },
    phone: {
        type: String,
        minLength: 9,
        required: true,
        match: [/^(?:\+972[-\s]?)?(0[2-9])[-\s]?(\d{7})$|^(?:\+972[-\s]?)?(05[0-9])[-\s]?(\d{7})$/, "Phone number must be a valid israeli phone "],
    },
    email: {
        type: String,
        minLength: 5,
        required: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Pls enter valid email"],
    },
    web: {
        type: String,
        match: [/^(https?:\/\/)?(www\.)?([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})(\/[^\s]*)?$/, "Pls enter a valid website URL"
        ]
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
            state: { type: String },
            country: { type: String, required: true },
            city: { type: String, required: true },
            street: { type: String, required: true },
            houseNumber: { type: Number, required: true },
            zip: { type: Number, default: 0 },
        }
    },
    bizNumber: {
        type: Number,
        default: () => Math.ceil(Math.random() * 100000000)
    }
    ,
    likes: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdByUserId: {
        type: mongoose.Types.ObjectId,
        required: true
    }
})

function CardValidationJoi(cardData) {
    const cardSchema = Joi.object({
        title: Joi.string().min(2).required(),
        subtitle: Joi.string().min(2).required(),
        description: Joi.string().min(2).required(),
        phone: Joi.string().min(9).required().pattern(/^(?:\+972[-\s]?)?(0[2-9])[-\s]?(\d{7})$|^(?:\+972[-\s]?)?(05[0-9])[-\s]?(\d{7})$/).message("Phone number must be a valid israeli phone"),
        email: Joi.string().email(),
        web: Joi.string().uri(),
        image: Joi.object({
            url: Joi.string().pattern(/^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp|svg))(?:\?.*)?$/).message("Please enter a valid image URL").default("https://www.svgrepo.com/show/512697/profile-1341.svg").allow(""),
            alt: Joi.string().default("Site Image"),
        }),
        address: Joi.object({
            state: Joi.string(),
            country: Joi.string().required(),
            city: Joi.string().required(),
            street: Joi.string().required(),
            houseNumber: Joi.number().required(),
            zip: Joi.number().default(0)
        }),
        createdByUserId: Joi.string().required(),
    });

    return cardSchema.validateAsync(cardData, { abortEarly: false })
}

const Card = mongoose.model("cards", cardSchema)

module.exports = { Card, CardValidationJoi };