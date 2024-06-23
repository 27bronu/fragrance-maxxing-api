# Fragrance Maxxing api Documentation

This API serves as a backend for an perfumery store application, providing endpoints for managing products and user authentication.

## Technologies Used

- **Express**: Web framework for Node.js used to build the API.
- **MongoDB**: Database used for storing product and user information.
- **JWT**: JSON Web Token used for user authentication.
- **Multer**: Middleware for handling file uploads.
- **Cors**: Middleware for enabling Cross-Origin Resource Sharing.
- **dotenv**: Module for loading environment variables from a `.env` file.

## Setup

1. Clone the repository and navigate into the project directory.
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_uri_here
   ```
   Replace `your_mongodb_uri_here` with your MongoDB connection string.

4. Start the server:
   ```
   node index.js
   ```
   The server will run on `http://localhost:4000`.

## Endpoints

### 1. GET `/`

- **Description**: Checks if the Express application is running.
- **Response**: "Express App is running".

### 2. POST `/upload`

- **Description**: Uploads an image file.
- **Request Body**: Form-data with a file field named `product`.
- **Response**: JSON with `success` status and `image_url`.

### 3. POST `/addproduct`

- **Description**: Adds a new product to the database.
- **Request Body**: JSON object with product details.
- **Response**: JSON with `success` status and added `name`.

### 4. POST `/removeproduct`

- **Description**: Removes a product from the database.
- **Request Body**: JSON object with product `id`.
- **Response**: JSON with `success` status and removed `name`.

### 5. GET `/allproducts`

- **Description**: Retrieves all products from the database.
- **Response**: JSON array of product objects.

### 6. POST `/signup`

- **Description**: Registers a new user.
- **Request Body**: JSON object with `username`, `email`, and `password`.
- **Response**: JSON with `success` status and `token`.

### 7. POST `/login`

- **Description**: Authenticates a user.
- **Request Body**: JSON object with `email` and `password`.
- **Response**: JSON with `success` status and `token`.

### 8. GET `/newcollections`

- **Description**: Retrieves the latest products added to the database.
- **Response**: JSON array of product objects.

### 9. GET `/popularproducts`

- **Description**: Retrieves popular products from a specific category (`men`).
- **Response**: JSON array of product objects.

### 10. POST `/addtocart`

- **Description**: Adds a product to the user's cart.
- **Request Body**: JSON object with `itemId`.
- **Response**: "Added".

### 11. POST `/removefromcart`

- **Description**: Removes a product from the user's cart.
- **Request Body**: JSON object with `itemId`.
- **Response**: "Removed".

### 12. POST `/getcart`

- **Description**: Retrieves the user's cart data.
- **Response**: JSON object representing cart data.

## Middleware

### `fetchUser`

- **Description**: Middleware function to verify and fetch user details from JWT token.
- **Used in**: `/addtocart`, `/removefromcart`, `/getcart`.
