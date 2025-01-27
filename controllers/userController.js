const User = require('../models/User');

class UserController {
    static async list(req, res) {
        try {
            const users = await User.getAll();
            res.render('users/list', { 
                users, 
                userRole: req.session.user.role 
            });
        } catch (error) {
            console.error('Error listing users:', error);
            res.status(500).render('error', { message: 'Error fetching users' });
        }
    }

    static async create(req, res) {
        try {
            if (req.method === 'GET') {
                return res.render('users/create');
            }

            await User.create(req.body);
            res.redirect('/users');
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).render('users/create', { error: 'Error creating user' });
        }
    }

    static async update(req, res) {
        try {
            const userId = req.params.id;

            if (req.method === 'GET') {
                const user = await User.findById(userId);
                if (!user) {
                    return res.status(404).render('error', { message: 'User not found' });
                }
                return res.render('users/edit', { user, error: null });
            }

            // Para requisições POST/PUT
            const userData = {
                username: req.body.username,
                password: req.body.password, // Será ignorado se vazio
                role: req.body.role
            };

            await User.update(userId, userData);
            res.redirect('/users');
        } catch (error) {
            console.error('Error updating user:', error);
            const user = await User.findById(req.params.id);
            res.status(500).render('users/edit', { 
                user, 
                error: 'Error updating user: ' + error.message 
            });
        }
    }

    static async delete(req, res) {
        try {
            await User.delete(req.params.id);
            res.redirect('/users');
        } catch (error) {
            console.error('Error deleting user:', error);
            res.status(500).render('error', { message: 'Error deleting user' });
        }
    }
}

module.exports = UserController;