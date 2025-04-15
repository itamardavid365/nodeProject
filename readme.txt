# NodeProject

This is a small project made with Node.js and Express.
It lets users register, login, and has basic admin features.
I also added protection from spammers and login abuse.

---

Features

- Register and login with JWT
- Login gets blocked after 3 failed attempts in 24h
- Admin can see and delete users
- Users can update their info
- Passwords are hashed with bcrypt
- Uses express-rate-limit for spam protection
- Logs errors into a log file


---
two environment variables one for production and one for development


 Create a .env.dev file like this:

NODE_ENV=development  
PORT=8000  
JWTKEY=yourSecret  
MONGODB=yourlocalMongoConnectionString

and a second .env.prod file like this:

NODE_ENV=production  
PORT=8000  
JWTKEY=yourSecret  
MONGODB=yourMongoConnectionString

---

to start the project in terminal !

npm run dev // development
npm run prod // production

First Users

When the server starts, if there are no users in the database,  
it will create 3 users automatically:

- Regular user: noa@example.com / Password1!
- Business user: eyal@biz.com / Password1!
- Admin user: admin@admin.com / Password1!

---

---

Routes (Main)

### POST /api/users/register
Create a new user.

**Request Body (JSON):**
{
  "name": { "first": "FirstName", "last": "LastName" },
  "phone": "052-1234567",
  "email": "example@example.com",
  "password": "Password1!",
  "isBusiness": false,
  "address": {
    "country": "Israel",
    "city": "Tel Aviv",
    "street": "Main",
    "houseNumber": 1
  }
}

---

### POST /api/users/login
Login and receive a JWT token.

**Request Body (JSON):**
{
  "email": "example@example.com",
  "password": "Password1!"
}

---

### GET /api/users (admin only)
Get a list of all users.

**Headers:**
Authorization: Bearer your_token_here

---

### GET /api/users/:id
Get your own user info (or as admin).

**Headers:**
Authorization: Bearer your_token_here

---

### PUT /api/users/:id
Update your user info.

**Headers:**
Authorization: Bearer your_token_here

**Request Body (JSON):**
{
  "name": { "first": "Updated", "last": "Name" },
  "phone": "052-1111111",
  "image": {
    "url": "https://example.com/image.jpg",
    "alt": "Profile"
  },
  "address": {
    "country": "Israel",
    "city": "New City",
    "street": "Updated Street",
    "houseNumber": 2,
    "zip": 123456
  }
}

---

### PATCH /api/users/:id
Toggle `isBusiness` status (true/false).

**Headers:**
Authorization: Bearer your_token_here

---

### DELETE /api/users/:id
Delete your account (or any user if admin).

**Headers:**
Authorization: Bearer your_token_here

---

---

Dependencies

- express
- mongoose
- bcrypt
- jsonwebtoken
- joi
- dotenv
- morgan
- express-rate-limit
- corss-env


---

That’s it

---

Card Routes

### GET /api/cards
Get all cards from all users.

(No auth needed)

---

### GET /api/cards/my-cards
Get all cards created by the logged-in user.

**Headers:**
Authorization: Bearer your_token_here

(Must be business or admin)

---

### GET /api/cards/liked-cards
Get all cards liked by the logged-in user.

**Headers:**
Authorization: Bearer your_token_here

---

### POST /api/cards
Create a new card.

**Headers:**
Authorization: Bearer your_token_here

**Body Example (JSON):**
{
  "title": "Pizza Place",
  "subtitle": "Best pizza in town",
  "description": "Delicious wood-fired pizza with fresh ingredients.",
  "phone": "03-5551234",
  "email": "pizza@place.com",
  "web": "http://pizzaplace.com",
  "image": {
    "url": "https://example.com/pizza.jpg",
    "alt": "Pizza Place"
  },
  "address": {
    "country": "Israel",
    "city": "Tel Aviv",
    "street": "Main Street",
    "houseNumber": 5,
    "zip": 123456
  }
}

(Must be business or admin)

---

### PUT /api/cards/:id
Update a card you created.

**Headers:**
Authorization: Bearer your_token_here

**Body Example (JSON):**
{
  "title": "Updated Title",
  "subtitle": "New subtitle",
  "description": "Updated description",
  "phone": "03-7778888",
  "email": "updated@place.com",
  "web": "http://updatedplace.com",
  "image": {
    "url": "https://example.com/updated.jpg",
    "alt": "Updated Image"
  },
  "address": {
    "country": "Israel",
    "city": "Haifa",
    "street": "Updated Street",
    "houseNumber": 12,
    "zip": 654321
  }
}

(Must be card owner or admin)

---

### DELETE /api/cards/:id
Delete a card you created.

**Headers:**
Authorization: Bearer your_token_here

(Must be card owner or admin)

---

### PATCH /api/cards/like/:id
Like or unlike a card.

**Headers:**
Authorization: Bearer your_token_here

(This toggles the card in your liked list. If it's already liked, it will be unliked. If not, it will be liked.)

---

### PATCH /api/cards/biz-number/:cardId
Update the business number of a specific card.

**Headers:**
Authorization: Bearer your_token_here

**Body Example (JSON):**
{
  "bizNumber": 1234567
}

(Must be business or admin. bizNumber must be unique.)
