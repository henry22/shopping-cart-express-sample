const nodemailer = require("nodemailer");
const db = require("../models");
const Order = db.Order;
const OrderItem = db.OrderItem;
const Cart = db.Cart;
const crypto = require("crypto");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "",
    pass: "",
  },
});

const URL = "";
const MerchantID = "";
const HashKey = "";
const HashIV = "";
const PayGateWay = "https://ccore.spgateway.com/MPG/mpg_gateway";
const ReturnURL = URL + "/spgateway/callback?from=ReturnURL";
const NotifyURL = URL + "/spgateway/callback?from=NotifyURL";
const ClientBackURL = URL + "/orders";

function genDataChain(TradeInfo) {
  let results = [];
  for (let kv of Object.entries(TradeInfo)) {
    results.push(`${kv[0]}=${kv[1]}`);
  }
  return results.join("&");
}

function create_mpg_aes_encrypt(TradeInfo) {
  let encrypt = crypto.createCipheriv("aes256", HashKey, HashIV);
  let enc = encrypt.update(genDataChain(TradeInfo), "utf8", "hex");
  return enc + encrypt.final("hex");
}

function create_mpg_aes_decrypt(TradeInfo) {
  let decrypt = crypto.createDecipheriv("aes256", HashKey, HashIV);
  decrypt.setAutoPadding(false);
  let text = decrypt.update(TradeInfo, "hex", "utf8");
  let plainText = text + decrypt.final("utf8");
  let result = plainText.replace(/[\x00-\x20]+/g, "");
  return result;
}

function create_mpg_sha_encrypt(TradeInfo) {
  let sha = crypto.createHash("sha256");
  let plainText = `HashKey=${HashKey}&${TradeInfo}&HashIV=${HashIV}`;

  return sha.update(plainText).digest("hex").toUpperCase();
}

function getTradeInfo(Amt, Desc, email) {
  console.log("===== getTradeInfo =====");
  console.log(Amt, Desc, email);
  console.log("==========");

  data = {
    MerchantID: MerchantID, // 商店代號
    RespondType: "JSON", // 回傳格式
    TimeStamp: Date.now(), // 時間戳記
    Version: 1.5, // 串接程式版本
    MerchantOrderNo: Date.now(), // 商店訂單編號
    LoginType: 0, // 智付通會員
    OrderComment: "OrderComment", // 商店備註
    Amt: Amt, // 訂單金額
    ItemDesc: Desc, // 產品名稱
    Email: email, // 付款人電子信箱
    ReturnURL: ReturnURL, // 支付完成返回商店網址
    NotifyURL: NotifyURL, // 支付通知網址/每期授權結果通知
    ClientBackURL: ClientBackURL, // 支付取消返回商店網址
  };

  console.log("===== getTradeInfo: data =====");
  console.log(data);

  mpg_aes_encrypt = create_mpg_aes_encrypt(data);
  mpg_sha_encrypt = create_mpg_sha_encrypt(mpg_aes_encrypt);

  console.log("===== getTradeInfo: mpg_aes_encrypt, mpg_sha_encrypt =====");
  console.log(mpg_aes_encrypt);
  console.log(mpg_sha_encrypt);

  tradeInfo = {
    MerchantID: MerchantID, // 商店代號
    TradeInfo: mpg_aes_encrypt, // 加密後參數
    TradeSha: mpg_sha_encrypt,
    Version: 1.5, // 串接程式版本
    PayGateWay: PayGateWay,
    MerchantOrderNo: data.MerchantOrderNo,
  };

  console.log("===== getTradeInfo: tradeInfo =====");
  console.log(tradeInfo);

  return tradeInfo;
}

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
      const tradeInfo = getTradeInfo(
        order.amount,
        "產品名稱",
        "v123582@gmail.com"
      );
      return res.render("payment", {
        order: JSON.parse(JSON.stringify(order)),
        tradeInfo
      });
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
