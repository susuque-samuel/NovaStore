const express = require('express');
const router = express.Router();

const db = require('../database');

router.get(
    '/adicionar/:id',
    async (req, res) => {

        if (!req.session.usuario) {
            return res.redirect('/login');
        }

        const produtoId = req.params.id;

        let [carrinho] = await db.query(
            `
            SELECT * FROM carrinhos
            WHERE usuario_id = ?
            `,
            [req.session.usuario.id]
        );

        let carrinhoId;

        if (carrinho.length === 0) {

            const [novo] = await db.query(
                `
                INSERT INTO carrinhos
                (usuario_id)
                VALUES (?)
                `,
                [req.session.usuario.id]
            );

            carrinhoId = novo.insertId;

        } else {

            carrinhoId = carrinho[0].id;

        }

        const [produto] = await db.query(
            `
            SELECT *
            FROM produtos
            WHERE id = ?
            `,
            [produtoId]
        );

        if(produto[0].estoque <= 0){

            return res.send(
        'Produto sem estoque.'
    );

}

        await db.query(
            `
            INSERT INTO itens_carrinho
            (
                carrinho_id,
                produto_id,
                quantidade
            )
            VALUES
            (?, ?, 1)
            `,
            [
                carrinhoId,
                produtoId
            ]
        );

        res.redirect('/');

    }
);

module.exports = router;