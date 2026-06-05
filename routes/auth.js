const express = require('express');
const router = express.Router();
const db = require('../database');

router.post('/cadastro', async (req, res) => {

    try {

        const {
            nome,
            email,
            senha
        } = req.body;

        await db.query(
            `INSERT INTO usuarios
            (nome, email, senha)
            VALUES (?, ?, ?)`,
            [nome, email, senha]
        );

        res.send('Usuário cadastrado!');

    } catch (erro) {

        console.error(erro);
        res.send('Erro ao cadastrar');

    }

});

router.post('/login', async (req, res) => {

    try {

        const {
            email,
            senha
        } = req.body;

        const [usuarios] = await db.query(
            `SELECT * FROM usuarios
             WHERE email = ?
             AND senha = ?`,
            [email, senha]
        );

        if (usuarios.length === 0) {
            return res.send('Login inválido');
        }

        req.session.usuario = usuarios[0];

        if (usuarios[0].tipo_usuario === 'admin') {
            return res.redirect('/admin');
                }

            res.redirect('/');

    } catch (erro) {

        console.error(erro);
        res.send('Erro no login');

    }

});

module.exports = router;

router.get('/logout', (req, res) => {

    req.session.destroy();

    res.redirect('/login');

});