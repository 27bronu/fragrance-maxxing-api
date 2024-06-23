import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const port = 4000;
const app = express();

app.use(express.json());
app.use(cors());

// Ensure the upload directory exists
const uploadDir = path.join(__dirname, 'upload/images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// connection with mongodb
mongoose.connect(process.env.MONGODB_URI);

// api creation
app.get("/", (req, res) => {
  res.send("Express App is running");
});

// Image storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

// Serving static files
app.use('/images', express.static(uploadDir));

// Upload endpoint for images and storing product info in DB
app.post('/upload', upload.single('product'), async (req, res) => {
  if (req.file) {
    const imageUrl = `https://fragrance-maxxing-api.onrender.com/images/${req.file.filename}`;

    // Assuming you send the product data along with the image upload request
    const { name, category, new_price, old_price, size, brand } = req.body;

    const products = await Product.find({});
    let id = products.length > 0 ? products[products.length - 1].id + 1 : 1;

    const product = new Product({
      id,
      name,
      image: imageUrl,
      category,
      new_price,
      old_price,
      size,
      brand,
      available: true,
      date: new Date(),
    });

    await product.save();

    res.json({
      success: 1,
      image_url: imageUrl,
      product,
    });
  } else {
    res.status(400).json({ success: 0, message: 'Image upload failed' });
  }
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

// Add products
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

// Remove products
app.post("/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  console.log("Removed");
  res.json({
    success: true,
    name: req.body.name,
  });
});

// Get all products
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

// Registering the user
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

// Endpoint for user login
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

// Endpoint for latest products
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
