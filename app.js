const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const app = express();

// Importa los middlewares
const errorLogger = require('./src/middlewares/errorLogger');
const adminErrorHandler = require('./src/middlewares/adminErrorHandler');
const errorHandler = require('./src/middlewares/errorHandler');
const notFoundHandler = require('./src/middlewares/notFoundHandler');
const requestLogger = require('./src/middlewares/requestLogger');
const sessionMiddleware = require('./src/middlewares/sessionMiddleware');
const rememberMeMiddleware = require('./src/middlewares/rememberMeMiddleware');
const checkUserSession = require('./src/middlewares/checkUserSession');

const indexRouter = require('./src/routes/index');
const usersRouter = require('./src/routes/users');
const productsRouter = require('./src/routes/products');

const { filterProducts: myFilterProducts } = require('./src/utils/utils.js');

// Cargar productos
const productsFilePath = path.join(__dirname, 'src', 'data', 'products.json');
let products = [];
try {
    products = JSON.parse(fs.readFileSync(productsFilePath, 'utf-8'));
    app.locals.products = products;
} catch (err) {
    console.error('Error al cargar el archivo de productos:', err);
}

app
    .set('views', path.join(__dirname, 'src', 'views'))
    .set('view engine', 'ejs')

    .use(express.urlencoded({ extended: true }))
    .use(methodOverride('_method'))

    // Middleware de sesión (¡ANTES de cualquier ruta o middleware que dependa de la sesión!)
    .use(sessionMiddleware)

    // Middlewares que dependen de la sesión
    .use(cookieParser())
    .use(rememberMeMiddleware)
    .use(checkUserSession)

    // Middlewares generales
    .use(logger('dev'))
    .use(express.json())
    .use(express.static(path.join(__dirname, 'public')))
    .use(requestLogger)

    // Middleware para productos destacados y carrusel
    .use((req, res, next) => {
        function getFeaturedProducts() {
            const featuredIds = [1, 7, 12, 10, 20];
            return myFilterProducts(app.locals.products, featuredIds);
        }

        app.locals.featuredProducts = getFeaturedProducts;

        function getCarouselProducts() {
            return myFilterProducts(app.locals.products, [1, 7, 12, 10, 20]);
        }

        app.locals.carouselProducts = getCarouselProducts;
        next();
    })

    // Rutas
    app
        .use('/', indexRouter) // Ruta para el inicio (index.ejs)
        .use('/users', usersRouter) // Rutas para usuarios (login, register, profile, etc.)
        .use('/products', productsRouter)

    // Middlewares de manejo de errores 
    .use(errorLogger)
    .use(adminErrorHandler)
    .use(errorHandler)
    .use(notFoundHandler);

module.exports = app;