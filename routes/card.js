const express = require("express");
const { Card, CardValidationJoi } = require("../models/Card");
const auth = require("../middlewares/auth");
const router = express.Router();
const _ = require("lodash");
const { User } = require("../models/User");
const mongoose = require("mongoose");
const Joi = require("joi");

// get all cards
router.get("/", async (req, res) => {
    try {
        const cards = await Card.find();
        res.status(200).send(cards);
    } catch (error) {
        res.status(400).send("Somthing went wrong try again");
    };
});

// get cards created by autherazide user // need req.body for admin
router.get("/my-cards", auth, async (req, res) => {
    try {
        if (!req.payload.isBusiness && !req.payload.isAdmin) return res.status(403).send("Access denied, must be business or admin to own a card");
        const cards = await Card.find({ createdByUserId: req.payload._id });
        res.status(200).send(cards);
    } catch (error) {
        res.status(400).send(error)
    }
})

// get liked cards
router.get("/liked-cards", auth, async (req, res) => {
    try {
        const likedCards = await Card.find({ likes: req.payload._id });
        res.status(200).send(likedCards);
    } catch (error) {
        res.status(400).send(error)
    }
})

// create card by business user
router.post("/", auth, async (req, res) => {
    try {
        // authorization business
        if (!req.payload.isBusiness || !req.payload.isAdmin) res.status(401).send("Access denied, must be a business or admin to create card");
        const completeCard = { ...req.body, createdByUserId: req.payload._id }
        // joi validation
        const { error } = await CardValidationJoi(completeCard)
        if (error) return res.status(400).send(error);
        // check card not exist by title by user
        const card = await Card.findOne({ title: req.body.title, createdByUserId: req.payload._id });
        if (card) return res.status(400).send("Card title allready in use for this user");
        const newCard = new Card(completeCard);
        await newCard.save();
        res.status(201).send(newCard);
    } catch (error) {
        console.log(error);

        res.status(400).send(error.details?.[0]?.message || error);
    }
})

// get card by id
router.get("/:id", async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).send("Invalid card ID format");
        }
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send("Card was not found");
        res.status(200).send(card);
    } catch (error) {
        console.log(error)
        res.status(400).send(error)
    }
})

// edit card // must be the user or admin
router.put("/:id", auth, async (req, res) => {
    try {
        // authorization
        let card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send("Card is not found");
        if (card.createdByUserId !== req.payload._id && !req.payload.isAdmin) return res.status(401).send("Access denied");
        // joi validation not same title by same user
        await CardValidationJoi({ ...req.body, createdByUserId: card.createdByUserId.toString() });
        const cardTitleUniqueForUser = await Card.findOne({ title: req.body.title, createdByUserId: card.createdByUserId, _id: { $ne: req.params.id } });
        if (cardTitleUniqueForUser) return res.status(400).send("Card title is not unique to this user");

        // save data
        card.set({ ...req.body, createdByUserId: card.createdByUserId });
        await card.save();
        res.status(200).send(card);
    } catch (error) {
        console.log(error);

        res.status(400).send(error.details?.[0]?.message || error);
    }
})
// like feature
router.patch("/:id", auth, async (req, res) => {
    try {
        // check if card exist
        let card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send("Card id not found");
        // check if card is allready liked by user
        let user = await User.findById(req.payload._id);
        if (!user) return res.status(404).send("User not found");
        if (card.likes.includes(req.payload._id)) {
            card.likes = card.likes.filter((id) => id !== req.payload._id);
            await card.save();
            res.status(200).send("Removed card like successfully");
        } else {
            card.likes.push(user._id.toString());
            await card.save();
            res.status(200).send("Added card like successfully")
        };
    } catch (error) {
        res.status(400).send(error)
    }
})
const bizNumberSchema = Joi.object({
    bizNumber: Joi.number().required().min(10000000).max(9999999999),
})

//change bizNumber
router.patch("/biz-number/:cardId", auth, async (req, res) => {
    try {
        if (!req.payload.isBusiness && !req.payload.isAdmin) return res.status(401).send("Access denied, user must be business or admin");
        const { error } = bizNumberSchema.validate(req.body);
        if (error) return res.status(400).send(error?.details[0]?.message || error);
        let card = await Card.findById(req.params.cardId);
        if (!card) return res.status(404).send("card is not exist");
        const uniqueBizCard = await Card.find({ bizNumber: req.body.bizNumber });
        if (uniqueBizCard.length) return res.status(400).send("Card business is allready in use");
        card.bizNumber = req.body.bizNumber;
        await card.save();
        res.status(200).send("Card business number was updated successfully");
    } catch (error) {
        res.status(400).send(error)
    }
})



// delete card
router.delete("/:id", auth, async (req, res) => {
    try {
        // auth admin or valid user
        if (!req.payload.isBusiness && !req.payload.isAdmin) return res.status(401).send("Access denied, must be a business user or admin");
        const card = await Card.findById(req.params.id);
        if (!card) return res.status(404).send("Card not found");
        if (card.createdByUserId !== req.payload._id && !req.payload.isAdmin) return res.status(401).send("Access denied, user must own the card or be admin");
        // delete the card
        await Card.findByIdAndDelete(req.params.id);
        res.status(200).send("Card deleted successfully")
    } catch (error) {
        res.status(400).send(error);
    }
})





module.exports = router;