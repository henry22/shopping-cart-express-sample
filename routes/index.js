var express = require('express');
var router = express.Router();

const productController = require('../controllers/productController')
const cartController = require('../controllers/cartController')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/products', productController.getProducts)
router.get('/cart', cartController.getCart)

module.exports = router;
