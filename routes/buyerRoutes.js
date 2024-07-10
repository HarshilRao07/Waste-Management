const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');

router.post('/register', buyerController.register);
router.get('/login', (req, res) => {
    res.render('buyerLogin', { title: 'Buyer Login' });
});

module.exports = router;
