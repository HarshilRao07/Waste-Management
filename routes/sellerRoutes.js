const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');

router.post('/register', sellerController.register);
router.get('/login', (req, res) => {
    res.render('sellerLogin', { title: 'Seller Login' });
});

module.exports = router;
