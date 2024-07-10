const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// MongoDB connection URI
const dbURI = 'mongodb+srv://harshilrao:harshilRAO2015@cluster0.pyi8dbt.mongodb.net/Users?retryWrites=true&w=majority&appName=Cluster0';

// Create a MongoClient
const client = new MongoClient(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

async function main() {
    try {
        // Connect to the MongoDB cluster
        await client.connect();
        console.log("Connected to MongoDB");

        // Make the client available to the rest of the app
        app.locals.db = client.db('Users');
    } catch (err) {
        console.error(err);
    }
}

main().catch(console.error);

// Middleware to parse form data
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the "public" directory
app.use('/public', express.static('public'));

// Set EJS as the template engine
app.set('view engine', 'ejs');

// Import routes
const buyerRoutes = require('./routes/buyerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

// Use routes
app.use('/buyer', buyerRoutes);
app.use('/seller', sellerRoutes);

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

// Handle registration form submission
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const db = req.app.locals.db;

        if (role === 'seller') {
            await db.collection('sellers').insertOne({ username, email, password });
            res.redirect('/sellerLogin');
        } else {
            await db.collection('buyers').insertOne({ username, email, password });
            res.redirect('/buyerLogin');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error registering user");
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
