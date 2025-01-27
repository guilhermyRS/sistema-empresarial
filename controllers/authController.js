const User = require('../models/User');
const bcrypt = require('bcryptjs');

class AuthController {
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await User.findByUsername(username);

            if (user && await bcrypt.compare(password, user.password)) {
                // Criar objeto de sessão
                req.session.user = {
                    id: user.id,
                    username: user.username,
                    role: user.role
                };

                // Se for admin, buscar empresa associada
                if (user.role === 'admin') {
                    const Company = require('../models/Company');
                    const userCompany = await Company.getUserCompany(user.id);
                    if (userCompany) {
                        req.session.user.companyId = userCompany.id;
                    }
                }

                res.redirect('/dashboard');
            } else {
                res.render('login', {
                    layout: false,
                    error: 'Credenciais inválidas'
                });
            }
        } catch (error) {
            console.error('Erro no login:', error);
            res.render('login', {
                layout: false,
                error: 'Erro ao realizar login'
            });
        }
    }
    static logout(req, res) {
        req.session.destroy();
        res.redirect('/login');
    }
}

module.exports = AuthController;