const express = require('express');
const cors = require('cors');
const Jwt = require('jsonwebtoken');
require('./db/config');
const User = require('./db/User');
const Product = require('./db/Product');

const app = express();
app.use(express.json());
app.use(cors());

const jwtKey = 'e-comm';

//Register API
app.post('/register', async (req, res) => {
    let user = new User(req.body);
    let result = await user.save();
    result = result.toObject();
    delete result.password;
    Jwt.sign({result}, jwtKey, {expiresIn: '2h'}, (err, token) => {
        if(err){
            res.send({result : "Something went wrong"})
        }
        res.send({result, auth: token})
    })
})

//Login API
app.post('/login', async (req, res) => {
    if(req.body.password && req.body.email){
        let user = await User.findOne(req.body).select("-password");
        if(user){
            Jwt.sign({user}, jwtKey, {expiresIn: '2h'}, (err, token) => {
                if(err){
                    res.send({result : "Something went wrong"})
                }
                res.send({user, auth: token})
            })
        }else{
            res.send("No result found");
        }
    }else{
        res.send("No result found");
    }
})

//Add Product API
app.post('/add-product',verifyToken, async (req, res) => {
    let product = new Product(req.body);
    let result = await product.save();
    res.send(result);
})

//Show Product API
app.get('/', verifyToken, async (req, res) => {
    let products = await Product.find();
    if(products.length > 0){
        res.send(products)
    }else{
        res.send({result : "No Products Found"});
    }
})

//Delete Product API
app.delete('/product/:id', verifyToken, async (req, res) => {
    let result = await Product.deleteOne({_id: req.params.id});
    res.send(result); 
})

//Find Product API
app.get('/product/:id', verifyToken, async (req, res) => {
    let result = await Product.findOne({_id: req.params.id});
    if(result){
        res.send(result);
    }else{
        res.send({result: 'No Product Found'});
    }
})

//Update Product API
app.put('/product/:id', verifyToken, async (req, res) => {
    let result = await Product.updateOne({_id: req.params.id}, {$set : req.body});
    res.send({result});
})

//Search Product API
app.get('/search/:key', verifyToken, async (req, res) => {
    let result = await Product.find({
        "$or": [
            {name: {$regex: req.params.key}},
            {company: {$regex: req.params.key}},
            {category: {$regex: req.params.key}}
        ]
    });
    res.send(result);
})

function verifyToken(req, res, next){
    let token = req.headers['authorization'];
    if(token){
        token = token.split(' ')[1];
        Jwt.verify(token, jwtKey, (err, valid) => {
            if(err){
                res.status(401).send({result: "Please provide valid token"});
            }else{
                next();
            }
        })
    }else{
        res.status(403).send({result : 'Please add token with header'});
    }
}

app.listen(5000, (e) => {
    if(e) console.log("Server is not running", e);
    console.log("Server is running");
});
