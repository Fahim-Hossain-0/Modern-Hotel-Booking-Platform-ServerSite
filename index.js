
const express = require("express");
const cors = require("cors");
require("dotenv").config(); // ✅ Load environment variables

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
    res.send("Server is running");
});


const serviceAccount = require("./modern-hotel-booking-firebase-admin-key.json");

const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Attach user data to request
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token", error: error.message });
  }
};

module.exports = verifyToken;

// emailVerify.js (or just place this below verifyToken)
const emailVerify = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: No user data found" });
  }

  if (!req.user.email_verified) {
    return res.status(403).json({ message: "Please verify your email address before accessing this resource" });
  }

  next(); // proceed if verified
};

module.exports = emailVerify;





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.czmzodc.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const db = client.db("hotel_DB"); // <-- make sure this DB exists
        const roomsCollection = db.collection("rooms");
        const usersCollection = db.collection("users");

        


app.get("/rooms", async (req, res) => {
  try {
    const { minPrice, maxPrice, sortOrder } = req.query;
    const page = parseInt(req.query.page) || 1;     // ✅ current page
    const limit = parseInt(req.query.limit) || 6;   // ✅ items per page
    const skip = (page - 1) * limit;

    let filter = {};
    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseInt(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = parseInt(maxPrice);
    }

    let sort = {};
    if (sortOrder === "asc") sort.pricePerNight = 1;
    else if (sortOrder === "desc") sort.pricePerNight = -1;

    const rooms = await roomsCollection.find(filter).sort(sort).skip(skip).limit(limit).toArray();
    const total = await roomsCollection.countDocuments(filter);

    res.send({
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: rooms,
    });
  } catch (error) {
    console.error("Error fetching rooms:", error);
    res.status(500).send({ message: "Server error" });
  }
});






// Get top-rated rooms (sorted by average rating)
app.get("/rooms/top-rated", async (req, res) => {
  try {
    const rooms = await roomsCollection.aggregate([
      {
        $addFields: {
          averageRating: { $avg: "$reviews.rating" }
        }
      },    
      {
        $sort: { averageRating: -1 } // highest first
      },
      {
        $limit:5
      }
    ]).toArray();

    res.send(rooms);
  } catch (error) {
    console.error("Error fetching top-rated rooms:", error);
    res.status(500).send({ message: "Server error" });
  }
});

// app.get('/rooms/reviews',async(req,res)=>{
//     const result = roomsCollection.find().toArray()
//     res.send(result)
// })

// Get 3 reviews across all rooms
app.get("/reviews", async (req, res) => {
  try {
    const reviews = await roomsCollection.aggregate([
      { $unwind: "$reviews" },        // flatten reviews array
      { $limit: 3 },                  // take only 3
    ]).toArray();

    res.send(reviews.map(r => r.reviews)); // send only review objects
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});


        app.get("/rooms/:id", verifyToken, emailVerify, async (req, res) => {
  const id = req.params.id;
  // const email = req.user.email;

  const room = await roomsCollection.findOne({ _id: id });
  if (!room) return res.status(404).send({ message: "Room not found" });

  // If the room is booked by someone else, hide their details
  // if (room.bookedBy && room.bookedBy !== email) {
  //   // delete room.bookedBy;
  //   // delete room.email;
  //   // delete room.bookedDate;
  // }

  res.send(room);
});


       app.get("/my-booking", verifyToken, emailVerify, async (req, res) => {
  try {
    const email = req.user.email; // ✅ from verified token

    const result = await roomsCollection.find({ email }).toArray();
    res.send(result);

  } catch (error) {
    console.error("Error fetching my bookings:", error);
    res.status(500).send({ message: "Server Error" });
  }
});



        app.post("/rooms/review/:id", async (req, res) => {
            try {
                const id = req.params.id; 
                const { review } = req.body; 

                if (!review) {
                    return res.status(400).send({ error: "Review is required" });
                }

                const filter = { _id: id }; 
                const updateDoc = {
                    $push: { reviews: review }, 
                };

                const result = await roomsCollection.updateOne(filter, updateDoc);

                if (result.modifiedCount === 0) {
                    return res
                        .status(404)
                        .send({ error: "Room not found or review not added" });
                }

                res.send({ success: true, message: "Review added successfully" });
            } catch (error) {
                console.error("Error adding review:", error);
                res.status(500).send({ error: "Internal server error" });
            }
        });


        app.patch("/rooms/:id", verifyToken, emailVerify, async (req, res) => {
  try {
    const id = req.params.id;
    const userEmail = req.user.email;
    const { bookedDate, availability, bookedBy, email } = req.body;

    const room = await roomsCollection.findOne({ _id: id });
    if (!room) return res.status(404).send({ message: "Room not found" });

    // Only the person who booked it (or admin) can update
    if (room.email && room.email !== userEmail) {
      return res.status(403).send({ message: "Unauthorized to modify this booking" });
    }

    const updateFields = {};
    if (availability !== undefined) updateFields.availability = availability;
    if (bookedBy !== undefined) updateFields.bookedBy = bookedBy;
    if (email !== undefined) updateFields.email = email;
    if (bookedDate !== undefined) updateFields.bookedDate = bookedDate;

    const result = await roomsCollection.updateOne(
      { _id: id },
      { $set: updateFields }
    );

    res.send(result);
  } catch (error) {
    console.error("Error updating booking:", error);
    res.status(500).send({ message: "Update failed" });
  }
});



        app.post("/users", async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });

        app.patch("/users", async (req, res) => {
            const user = req.body;

            if (!user.email) {
                return res.status(400).send({ message: "Email is required" });
            }
            const filter = { email: user.email };
            const updatedDoc = {
                $set: { ...user },
            };
            const options = { upsert: true };
            const result = await usersCollection.updateOne(
                filter,
                updatedDoc,
                options
            );
            res.send(result);
        });

        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log(
        //     "Pinged your deployment. You successfully connected to MongoDB!"
        // );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})