const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');

const app = express();


app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main'); // Define o layout padrão
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false
}));

// Middleware para disponibilizar informações do usuário e empresa
app.use(async (req, res, next) => {
    res.locals = res.locals || {};
    
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        
        // Se for usuário admin, buscar informações da empresa
        if (req.session.user.role === 'admin') {
            try {
                const Company = require('./models/Company');
                // Buscar a empresa do usuário
                const userCompany = await Company.getUserCompany(req.session.user.id);
                if (userCompany) {
                    res.locals.currentCompany = userCompany;
                }
            } catch (error) {
                console.error('Erro ao carregar empresa:', error);
            }
        }
    }
    next();
});

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));

app.get('/login', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/users');
    }
    res.render('login', { layout: false, error: null });
});

// Certifique-se de que este middleware está ANTES das rotas
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/companies', require('./routes/companies'));

app.use('/products', require('./routes/products'));


// Rota padrão
app.get('/', (req, res) => {
    if (req.session && req.session.user) {
        return res.redirect('/dashboard');
    }
    res.redirect('/login');
});

// Adicione esta rota para o dashboard
app.get('/dashboard', (req, res) => {
    if (!req.session || !req.session.user) {
        return res.redirect('/login');
    }
    res.redirect('/products/dashboard');
});

// Tratamento de erro 404
app.use((req, res) => {
    res.status(404).render('error', { message: 'Page not found' });
});

// Tratamento de erros gerais
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { message: 'Internal Server Error' });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});