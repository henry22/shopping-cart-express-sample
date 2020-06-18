const nodemailer = require("nodemailer");
const db = require("../models");
const Order = db.Order;
const OrderItem = db.OrderItem;
const Cart = db.Cart;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "",
    pass: "",
  },
});

const orderController = {
  getOrders: (req, res) => {
    Order.findAll({
      include: "items",
    }).then((orders) => {
      return res.render("orders", {
        orders: JSON.parse(JSON.stringify(orders)),
      });
    });
  },
  postOrder: (req, res) => {
    return Cart.findByPk(req.body.cartId, { include: "items" }).then((cart) => {
      return Order.create({
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
        shipping_status: req.body.shipping_status,
        payment_status: req.body.payment_status,
        amount: req.body.amount,
      }).then((order) => {
        const results = [];

        for (let i = 0; i < cart.items.length; i++) {
          results.push(
            OrderItem.create({
              OrderId: order.id,
              ProductId: cart.items[i].id,
              price: cart.items[i].price,
              quantity: cart.items[i].CartItem.quantity,
            })
          );
        }

        const mailOptions = {
          from: "",
          to: "",
          subject: `${order.id} 訂單成立`,
          test: `${order.id} 訂單成立`,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            console.log("Email send: " + info.response);
          }
        });

        return Promise.all(results).then(() => {
          return res.redirect("/orders");
        });
      });
    });
  },
  cancelOrder: (req, res) => {
    return Order.findByPk(req.params.id, {}).then((order) => {
      order
        .update({
          ...req.body,
          shipping_status: "-1",
          payment_status: "-1",
        })
        .then((order) => {
          return res.redirect("back");
        });
    });
  },
  getPayment: (req, res) => {
    console.log("==== getPayment =====");
    console.log(req.params.id);
    console.log("==========");

    return Order.findByPk(req.params.id, {}).then((order) => {
      return res.render("payment", { order: JSON.parse(JSON.stringify(order)) });
    });
  },
  newebpayCallback: (req, res) => {
    console.log("===== newebpayCallback =====");
    console.log(req.body);
    console.log("==========");

    return res.redirect("back");
  },
};

module.exports = orderController;
