const express = require('express');
const router = express.Router();

const db = require('../database');
const upload = require('../config/multer');

router.post(
    '/novo',
    upload.single('imagem'),
    async (req, res) => {

        try {

            const {
                nome,
                descricao,
                preco,
                estoque,
                categoria_id
            } = req.body;

            const imagem = req.file
                ? req.file.filename
                : null;

            await db.query(
                `
                INSERT INTO produtos
                (
                    categoria_id,
                    nome,
                    descricao,
                    preco,
                    estoque,
                    imagem
                )
                VALUES
                (?, ?, ?, ?, ?, ?)
                `,
                [
                    categoria_id,
                    nome,
                    descricao,
                    preco,
                    estoque,
                    imagem
                ]
            );

            res.send('Produto cadastrado');

        } catch (erro) {

            console.error(erro);
            res.send('Erro ao cadastrar');

        }

    }
);

module.exports = router;

router.get('/excluir/:id', async (req, res) => {

    await db.query(
        'DELETE FROM produtos WHERE id = ?',
        [req.params.id]
    );

    res.redirect('/admin/produtos/lista');

});

router.post('/editar/:id', async (req, res) => {

    const {
        nome,
        preco,
        estoque
    } = req.body;

    await db.query(
        `
        UPDATE produtos

        SET
        nome = ?,
        preco = ?,
        estoque = ?

        WHERE id = ?
        `,
        [
            nome,
            preco,
            estoque,
            req.params.id
        ]
    );

    res.redirect('/admin/produtos/lista');

});