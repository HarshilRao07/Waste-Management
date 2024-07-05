const express = require('express');
const app = express();
const port = 3000;

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

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
