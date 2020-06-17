const db = require('../models')
const Order = db.Order
const OrderItem = db.OrderItem
const Cart = db.Cart

const orderController = {
  getOrders: (req, res) => {
    Order.findAll({
      include: 'items'
    }).then(orders => {
      return res.render('orders', { orders: JSON.parse(JSON.stringify(orders)) })
    })
  },
  postOrder: (req, res) => {
    return Cart.findByPk(req.body.cartId, {include: 'items'}).then(cart => {
      return Order.create({
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        shipping_status: req.body.shipping_status,
        payment_status: req.body.payment_status,
        amount: req.body.amount
      }).then(order => {
        const results = []

        for(let i = 0; i < cart.items.length; i++) {
          results.push(
            OrderItem.create({
              OrderId: order.id,
              ProductId: cart.items[i].id,
              price: cart.items[i].price,
              quantity: cart.items[i].CartItem.quantity
            })
          )
        }

        return Promise.all(results).then(() => {
          return res.redirect('/orders')
        })
      })
    })
  },
  cancelOrder: (req, res) => {
    return Order.findByPk(req.params.id, {}).then(order => {
      order.update({
        ...req.body,
        shipping_status: '-1',
        payment_status: '-1'
      }).then(order => {
        return res.redirect('back')
      })
    })
  }
}

module.exports = orderController