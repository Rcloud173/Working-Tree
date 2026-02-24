const express = require('express');
const router = express.Router();
const marketController = require('./market.controller');
const { getPricesSchema, validateQuery } = require('./market.validation');

router.get('/prices', validateQuery(getPricesSchema), marketController.getPrices);
router.get('/commodities', marketController.getCommodities);
router.get('/states', marketController.getStates);

module.exports = router;
