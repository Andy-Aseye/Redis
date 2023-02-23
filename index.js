const express = require("express");
const redis = require("redis");
const util = require("util");
const axios = require("axios")

// const redisUrl = "redis://127.0.0.1:6379";

// This creates a redis client 
const client = redis.createClient({
    legacyMode: true,
    PORT: 6379
})

client.connect().catch(console.error)

client.set = util.promisify(client.set)
client.get = util.promisify(client.get)

const app = express();
app.use(express.json())

app.post("/", async (req, res) => {
    const { key, value } = req.body;
    const response = await client.set(key, value)
    res.status(200).json(response)
})

app.get("/", async (req, res) => {
    const { key } = req.body;
    const value = await client.get(key)
    res.json(value);
})

app.get("/posts/:id", async (req, res) => {

    const {id } = req.params;

    // This checks if the data has been cached

    const cachedPost = await client.get(`post-${id}`)

    if(cachedPost) {
        return res.json(JSON.parse(cachedPost))
    }

    // If the data is not cached it is then requested from the database

    const response = await axios.get(`https://jsonplaceholder.typicode.com/posts/${id}`);

    // This sets the data into the redis

    client.set(`post-${id}`, JSON.stringify(response.data))



    return res.json(response.data);
})

app.listen(8080, () => {
    console.log("Listening on port 8080!")
})