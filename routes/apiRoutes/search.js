const express = require('express');
const router = express.Router();
const SearchController = require('../../controllers/apis/search');

router.get('/search',SearchController.search);

module.exports = router;



