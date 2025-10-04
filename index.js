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

        // app.get("/rooms", async (req, res) => {
        //     const cursor = roomsCollection.find();
        //     const result = await cursor.toArray();
        //     res.send(result);
        // });

        // Get all rooms (default, no sorting)
// app.get("/rooms", async (req, res) => {
//   try {
//     const rooms = await roomsCollection.find().toArray();
//     res.send(rooms);
//   } catch (error) {
//     console.error("Error fetching rooms:", error);
//     res.status(500).send({ message: "Server error" });
//   }
// });



// app.get("/rooms", async (req, res) => {
//   try {
//     const order = req.query.order === "asc" ? 1 : -1;

//     const rooms = await roomsCollection.aggregate([
//       {
//         $addFields: {
//           averageRating: { $avg: "$reviews.rating" }
//         }
//       },
//       {
//         $sort: { averageRating: order }
//       }
//     ]).toArray();

//     res.send(rooms);
//   } catch (error) {
//     console.error("Error fetching top-rated rooms:", error);
//     res.status(500).send({ message: "Server error" });
//   }
// });


// Get rooms with optional price filtering
// app.get("/rooms", async (req, res) => {
//   try {
//     const { minPrice, maxPrice } = req.query;

//     let filter = {};

//     // If minPrice or maxPrice provided, build a filter
//     if (minPrice || maxPrice) {
//       filter.pricePerNight = {};
//       if (minPrice) filter.pricePerNight.$gte = parseInt(minPrice);
//       if (maxPrice) filter.pricePerNight.$lte = parseInt(maxPrice);
//     }

//     const rooms = await roomsCollection.find(filter).toArray();
//     res.send(rooms);
//   } catch (error) {
//     console.error("Error fetching rooms:", error);
//     res.status(500).send({ message: "Server error" });
//   }
// });


app.get("/rooms", async (req, res) => {
  try {
    const { minPrice, maxPrice, sortOrder } = req.query;

    let filter = {};

    if (minPrice || maxPrice) {
      filter.pricePerNight = {};
      if (minPrice) filter.pricePerNight.$gte = parseInt(minPrice);
      if (maxPrice) filter.pricePerNight.$lte = parseInt(maxPrice);
    }

    // Determine sort
    let sort = {};
    if (sortOrder === "asc") sort.pricePerNight = 1; // low → high
    else if (sortOrder === "desc") sort.pricePerNight = -1; // high → low

    const rooms = await roomsCollection.find(filter).sort(sort).toArray();
    res.send(rooms);
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


        app.get("/rooms/:id", async (req, res) => {
            const id = req.params.id;
            const result = await roomsCollection.findOne({ _id: id });
            res.send(result);
        });

        app.get("/my-booking", async (req, res) => {
            try {
                const email = req.query.email; // get email from query string
                if (!email) {
                    return res
                        .status(400)
                        .send({ message: "Email is required" });
                }

                // Filter rooms by this user's email
                const query = { email: email };
                const result = await roomsCollection.find(query).toArray();

                res.send(result);
            } catch (error) {
                console.error(error);
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


        app.patch("/rooms/:id", async (req, res) => {
            try {
                const id = req.params.id;
                const { bookedDate, availability, bookedBy, email } =
                    req.body;

                const filter = { _id: id };
                let updateDoc = {};

                
                if (
                    availability === true &&
                    bookedBy === null &&
                    email === null
                ) {
                    updateDoc = {
                        $set: {
                            availability: true,
                            bookedDate: null,
                            bookedBy: null,
                            email: null,
                        },
                    };
                }

                // Case 2: Update date only
                else if (bookedDate) {
                    updateDoc = {
                        $set: { bookedDate }, 
                    };
                }

               
                else {
                    updateDoc = {
                        $set: {
                            ...(availability !== undefined && { availability }),
                            ...(bookedBy && { bookedBy }),
                            ...(email && { email }),
                            ...(bookedDate && { bookedDate }),
                        },
                    };
                }

                const result = await roomsCollection.updateOne(filter, updateDoc);
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
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log(
            "Pinged your deployment. You successfully connected to MongoDB!"
        );
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);













app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})