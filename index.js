const express = require('express');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const passport = require('passport');
const bcrypt = require('bcrypt');
const session = require('express-session');
const flash = require('connect-flash');
const app = express();
const port = 3000;

// MongoDB connection URI
const dbURI = 'mongodb+srv://harshilrao:harshilRAO2015@cluster0.pyi8dbt.mongodb.net/Users?retryWrites=true&w=majority&appName=Cluster0';

// Create a MongoClient
const client = new MongoClient(dbURI, { useNewUrlParser: true, useUnifiedTopology: true });

async function main() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        app.locals.db = client.db('Users');

        // Configure Passport
        require('./passportConfig')(app, app.locals.db);
    } catch (err) {
        console.error(err);
    }
}

main().catch(console.error);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'waste management',
    resave: false,
    saveUninitialized: false
}));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

app.use('/public', express.static('public'));
app.set('view engine', 'ejs');

const buyerRoutes = require('./routes/buyerRoutes');
const sellerRoutes = require('./routes/sellerRoutes');

app.use('/buyer', buyerRoutes);
app.use('/seller', sellerRoutes);

app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

app.get('/login', (req, res) => {
    const userType = req.query.userType || '';
    res.render('login', { title: `${userType.charAt(0).toUpperCase() + userType.slice(1)} Login`, userType, error: req.flash('error') });
});

app.get('/register', (req, res) => {
    res.render('register', { title: 'Register' });
});

app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const db = req.app.locals.db;
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === 'seller') {
            await db.collection('sellers').insertOne({ username, email, password: hashedPassword, role: 'seller' });
            res.redirect('/login?userType=seller');
        } else {
            await db.collection('buyers').insertOne({ username, email, password: hashedPassword, role: 'buyer' });
            res.redirect('/login?userType=buyer');
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error registering user");
    }
});

app.post('/login', (req, res, next) => {
    const { role } = req.body;

    if (role === 'seller') {
        passport.authenticate('seller-local', {
            successRedirect: '/seller/dashboard',
            failureRedirect: '/login?userType=seller',
            failureFlash: true
        })(req, res, next);
    } else {
        passport.authenticate('buyer-local', {
            successRedirect: '/buyer/dashboard',
            failureRedirect: '/login?userType=buyer',
            failureFlash: true
        })(req, res, next);
    }
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
