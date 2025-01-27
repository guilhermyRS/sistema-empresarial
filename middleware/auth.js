module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.session && req.session.user) {
            return next();
        }
        res.redirect('/login');
    },

    isMaster: (req, res, next) => {
        if (req.session && req.session.user && req.session.user.role === 'master') {
            return next();
        }
        res.status(403).render('error', { 
            message: 'Acesso negado. Esta ação requer privilégios de master.' 
        });
    },

    hasCompanyAccess: (req, res, next) => {
        if (req.session.user.role === 'master') {
            return next();
        }
        
        if (!req.session.user.companyId) {
            return res.redirect('/companies/select');
        }
        
        
        next();
    }
};