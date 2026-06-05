function admin(req, res, next) {

    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    if (req.session.usuario.tipo_usuario !== 'admin') {
        return res.send('Acesso negado');
    }

    next();
}

module.exports = admin;