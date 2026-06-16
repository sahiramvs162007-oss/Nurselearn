const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/authController');

router.get('/login', authCtrl.getLogin);
router.post('/login', authCtrl.postLogin);
router.post('/logout', authCtrl.logout);

module.exports = router;
