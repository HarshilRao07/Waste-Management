const express = require('express');
const app = express();
const port = 3000;

// Serve static files from the "public" directory
app.use('/public', express.static('public'));

// Set EJS as the template engine
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('home', { title: 'Home' });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
