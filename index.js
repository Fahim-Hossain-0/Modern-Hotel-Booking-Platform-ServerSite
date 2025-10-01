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




  const { MongoClient, ServerApiVersion,ObjectId } = require('mongodb');
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
            const cursor = roomsCollection.find();
            const result = await cursor.toArray();
            res.send(result);
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

        

    app.patch("/rooms/:id", async (req, res) => {
    const id = req.params.id;
    const { reviews, ...otherUpdates } = req.body; // separate review from other fields

    const filter = { _id: new ObjectId(id) };
    const updateDoc = {};

    // If there's a review, push it to the reviews array
    if (reviews) {
        updateDoc.$push = { reviews: reviews };
    }

    // Add other updates (like availability, bookedDate, etc.)
    if (Object.keys(otherUpdates).length > 0) {
        updateDoc.$set = { ...otherUpdates };
    }

    try {
        const result = await roomsCollection.updateOne(filter, updateDoc);
        res.send(result);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "Update failed" });
    }
});



        // already have this probably
        app.get("/rooms/:id", async (req, res) => {
            const room = await roomsCollection.findOne({
                _id: new ObjectId(req.params.id),
            });
            res.send(room);
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