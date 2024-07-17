const express = require('express');
const router = express.Router();
const buyerController = require('../controllers/buyerController');

router.get('/dashboard', (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== 'buyer') {
        return res.redirect('/login?userType=buyer');
    }
    res.render('buyerDashboard', { title: 'Buyer Dashboard', user: req.user });
});

module.exports = router;
