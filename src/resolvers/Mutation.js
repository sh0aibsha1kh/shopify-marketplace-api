const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
var { productList } = require('../../mock_data/ProductList');
var userInfo = require('../variables/Users');
var cartInfo = require('../variables/Carts');

const APP_SECRET = "_Gr4phQL_"

function createCart() {
    if (!userInfo.isUserLoggedIn) {
        throw new Error('Please log in first.')
    }
    if (cartInfo.isCartCreated) {
        throw new Error('A cart has already been created.');
    } else {
        userInfo.user.cart = cartInfo.cart
        cartInfo.isCartCreated = true;
        return cartInfo.cart;
    }
}

function addProductToCart(parent, args) {
    if (cartInfo.isCartCreated) {
        for (let i = 0; i < productList.length; i++) {
            if (productList[i].title === args.title) {
                if (productList[i].inventory_count > 0) {
                    cartInfo.cart.productsInCart.push(productList[i]);
                    cartInfo.cart.totalAmount += productList[i].price;
                    userInfo.user.cart = cartInfo.cart;
                    return cartInfo.cart;
                } else {
                    throw new Error('Sorry, this item is out of stock.');
                }
            }
        }
        throw new Error('This item does not exist.');
    } else {
        throw new Error('Please create a cart first.');
    }
}

function completeCart() {
    if (cartInfo.isCartCreated) {
        for (let i = 0; i < cartInfo.cart.productsInCart.length; i++) {
            for (let j = 0; j < productList.length; j++) {
                if (cartInfo.cart.productsInCart[i].title === productList[j].title) {
                    productList[j].inventory_count -= 1;
                }
            }
        }
        cartInfo.cart.productsInCart = []
        cartInfo.cart.totalAmount = 0;
        cartInfo.isCartCreated = false;
        userInfo.user.cart = cartInfo.cart;
        return cartInfo.cart;
    } else {
        throw new Error('Please create a cart first.');
    }
}

async function signUp(parent, args) {

    if (getExistingUser(args.username, userInfo.users)) {
        throw new Error('This username is already taken.');
    }

    const newUserID = `${args.username}@${new Date().getTime()}`;
    const newUserUsername = args.username;
    const newUserPassword = await bcrypt.hash(args.password, 10);
    const newUser = {
        id: newUserID,
        username: newUserUsername,
        password: newUserPassword,
        cart: null
    }

    const token = jwt.sign({ userId: newUserID }, APP_SECRET);
    const message = 'You have successfully signed up, please log in.';

    userInfo.users.push(newUser);

    return {
        user: newUser,
        message: message,
        token: token
    }
}

async function logIn(parent, args) {
    if (userInfo.isUserLoggedIn) {
        throw new Error('You are already logged in.');
    }
    const username = args.username;
    if (!getExistingUser(username, userInfo.users)) {
        throw new Error('This username/password is invalid.');
    }

    const existingUser = getExistingUser(username, userInfo.users);

    const isValidPassword = await bcrypt.compare(args.password, existingUser.password);
    if (!isValidPassword) {
        throw new Error('This username/password is invalid.');
    }

    const token = jwt.sign({ userId: existingUser.id }, APP_SECRET);
    const message = 'You have succesfully logged in, enjoy your shopping!';
    
    userInfo.isUserLoggedIn = true;

    return {
        user: existingUser,
        message: message,
        token: token
    }
}

async function logOut(parent, args) {
    if (!userInfo.isUserLoggedIn) {
        throw new Error('You are not logged in.');
    }

    userInfo.isUserLoggedIn = false;
    const message = 'You have successfully logged out.';

    return {
        message
    }
}

// ========== HELPER FUNCTIONS ==========
function getExistingUser(username, users) {
    for (let i = 0; i < users.length; i++) {
        if (username === users[i].username) {
            return users[i]
        }
    }
    return null;
}



module.exports = {
    createCart,
    addProductToCart,
    completeCart,
    signUp,
    logIn,
    logOut
}