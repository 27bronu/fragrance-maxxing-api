import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const port = 4000;
const app = express();

app.use(express.json());
app.use(cors());

// connection with mongodb
mongoose.connect(
  process.env.MONGODB_URI
);

// api creation
app.get("/", (req, res) => {
  res.send("Express App is running");
});

// image storage engine
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// creating upload endpoint for images
app.use("/images", express.static("upload/images"));
app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`,
  });
});

// schema for creating products
const ProductSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: false,
  },
  old_price: {
    type: Number,
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  brand: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

const Product = mongoose.model("Product", ProductSchema);

// add products
app.post("/addproduct", async (req, res) => {
  const products = await Product.find({});
  let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

  const product = new Product({
    id,
    name: req.body.name,
    image: req.body.image,
    category: req.body.category,
    new_price: req.body.new_price,
    old_price: req.body.old_price,
    size: req.body.size,
    brand: req.body.brand,
  });
  console.log(product);
  await product.save();
  console.log("Saved");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// remove products
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// get all products
app.get("/allproducts", async (req, res) => {
  const products = await Product.find({});
  console.log("All products Fetched");
  res.send(products);
});

// schema user model
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
  },
  cartData: {
    type: Object,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", UserSchema);

// registering the user
app.post("/signup", async (req, res) => {
  const check = await User.findOne({ email: req.body.email });
  if (check) {
    return res
      .status(400)
      .json({
        success: false,
        errors: "Existing user found with same email address",
      });
  }
  const cart = {};
  for (let i = 0; i < 300; i++) {
    cart[i] = 0;
  }
  const user = new User({
    name: req.body.username,
    email: req.body.email,
    password: req.body.password,
    cartData: cart,
  });
  await user.save();

  const data = {
    user: {
      id: user.id,
    },
  };
  const token = jwt.sign(data, "secret_ecom");
  res.json({ success: true, token });
});

// endpoint for user login
app.post("/login", async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const passMatch = req.body.password === user.password;
    if (passMatch) {
      const data = {
        user: {
          id: user.id,
        },
      };
      const token = jwt.sign(data, "secret_ecom");
      res.json({ success: true, token });
    } else {
      res.json({ success: false, errors: "Wrong Password" });
    }
  } else {
    res.json({ success: false, errors: "Wrong Email address" });
  }
});

// endpoint for latest products
app.get("/newcollections", async (req, res) => {
  const products = await Product.find({});
  const newcollection = products.slice(-8);
  console.log("New collection Fetched");
  res.send(newcollection);
});

// endpoint for popular products
app.get("/popularproducts", async (req, res) => {
  const products = await Product.find({ category: "men" });
  const popularproducts = products.slice(0, 4);
  console.log("Popular products Fetched");
  res.send(popularproducts);
});

// middleware to fetch user
const fetchUser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) {
    res.status(401).send({ errors: "Please authenticate using valid login" });
  } else {
    try {
      const data = jwt.verify(token, "secret_ecom");
      req.user = data.user;
      next();
    } catch (error) {
      res
        .status(401)
        .send({ errors: "Please authenticate using a valid token" });
    }
  }
};

// endpoint for adding products in cartdata
app.post("/addtocart", fetchUser, async (req, res) => {
  console.log("Added", req.body.itemId);
  const userData = await User.findOne({ _id: req.user.id });
  userData.cartData[req.body.itemId] += 1;
  await User.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Added");
});

// endpoint for removing cartData
app.post("/removefromcart", fetchUser, async (req, res) => {
  console.log("Removed", req.body.itemId);
  const userData = await User.findOne({ _id: req.user.id });
  if (userData.cartData[req.body.itemId] > 0) {
    userData.cartData[req.body.itemId] -= 1;
  }
  await User.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData });
  res.send("Removed");
});

// endpoint to get cart data
app.post('/getcart', fetchUser, async (req, res) => {
  console.log('Get cart');
  const userData = await User.findOne({ _id: req.user.id });
  res.json(userData.cartData);
});

app.listen(port, (error) => {
  if (!error) {
    console.log("Server is running on port " + port);
  } else {
    console.log("Error: " + error);
  }
});
