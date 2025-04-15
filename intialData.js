const bcrypt = require("bcrypt");
const { User } = require("./models/User");

async function intailData() {
    try {
        const usersCount = await User.countDocuments();
        if (usersCount == 0) {
            console.log("Created intail users");

            const users = [
                {
                    name: { first: "Noa", last: "Levi" },
                    phone: "052-1234567",
                    email: "noa@example.com",
                    password: "Password1!",
                    isBusiness: false,
                    isAdmin: false,
                    address: {
                        country: "Israel",
                        city: "Tel Aviv",
                        street: "Herzl",
                        houseNumber: 10,
                    },
                },
                {
                    name: { first: "Eyal", last: "Cohen" },
                    phone: "054-7654321",
                    email: "eyal@biz.com",
                    password: "Password1!",
                    isBusiness: true,
                    isAdmin: false,
                    address: {
                        country: "Israel",
                        city: "Haifa",
                        street: "Allenby",
                        houseNumber: 22,
                    },
                },
                {
                    name: { first: "Dana", last: "Admin" },
                    phone: "050-9999999",
                    email: "admin@admin.com",
                    password: "Password1!",
                    isBusiness: false,
                    isAdmin: true,
                    address: {
                        country: "Israel",
                        city: "Jerusalem",
                        street: "King George",
                        houseNumber: 1,
                    },
                },
            ];

            for (let user of users) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }

            await User.insertMany(users);
            console.log('Initail users data was inserted');
        }
    } catch (error) {
        console.log(error)
    }
}

module.exports = intailData;