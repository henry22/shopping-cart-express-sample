const db = require('../models')
const Product = db.Product
const Cart = db.Cart
const PAGE_LIMIT = 3
const PAGE_OFFSET = 0

const productController = {
  getProducts: (req, res) => {
    Product.findAndCountAll({
      raw: true,
      nest: true,
      offset: PAGE_OFFSET,
      limit: PAGE_LIMIT
    }).then(products => {
      return Cart.findByPk(req.session.cartId, {include: 'items'}).then(cart => {
        cart = cart || {items: []}
        let totalPrice = cart.items.length > 0 ? cart.items.map(d => d.price * d.CartItem.quantity).reduce((a, b) => a + b) : 0

        return res.render('products', { 
          products,
          cart: JSON.parse(JSON.stringify(cart)),
          totalPrice
        })
      })
    })
  }
}

module.exports = productController