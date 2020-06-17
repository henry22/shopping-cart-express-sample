const db = require('../models')
const Order = db.Order

const orderController = {
  getOrders: (req, res) => {
    Order.findAll({
      include: 'items'
    }).then(orders => {
      return res.render('orders', { orders: JSON.parse(JSON.stringify(orders)) })
    })
  }
}

module.exports = orderController