const express = require('express');
const { MongoClient } = require('mongodb');
const app = express();
const port = 3000;

// MongoDB connection URI
const dbURI = 'mongodb+srv://harshilrao:harshilRAO2015@cluster0.pyi8dbt.mongodb.net/sellerUsers?retryWrites=true&w=majority&appName=Cluster0';

// Create a MongoClient
const client = new MongoClient(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

async function main() {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        console.log("Connected to MongoDB");

        // Make the client available to the rest of the app
        app.locals.db = client.db('sellerUsers');
    } catch (err) {
        console.error(err);
    }
}


// Serve static files from the "public" directory
app.use('/public', express.static('public'));

// Set EJS as the template engine
app.set('view engine', 'ejs');

//Home page
app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

//Login Page
app.get('/login', (req, res) => {
    res.render('login', { title: 'Login' });
});

//Seller Login Page
app.get('/sellerLogin', (req, res) => {
    res.render('sellerLogin', { title: 'Seller Login' });
});

//Buyer Login Page
app.get('/buyerLogin', (req, res) => {
    res.render('buyerLogin', { title: 'Buyer Login' });
});

// Register Page
app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
