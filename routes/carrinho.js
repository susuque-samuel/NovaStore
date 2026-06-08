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
            SELECT *
            FROM carrinhos
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

        const p = produto[0];

        if (!p) {
            return res.send('Produto não encontrado.');
        }

        if (p.estoque <= 0) {
            return res.send('Produto sem estoque.');
        }

        const [itemExistente] = await db.query(
            `
            SELECT *
            FROM itens_carrinho
            WHERE carrinho_id = ?
            AND produto_id = ?
            `,
            [
                carrinhoId,
                produtoId
            ]
        );

        if (itemExistente.length > 0) {

            if (
                itemExistente[0].quantidade >= p.estoque
            ) {

                return res.send(
                    'Estoque insuficiente.'
                );

            }

            await db.query(
                `
                UPDATE itens_carrinho
                SET quantidade = quantidade + 1
                WHERE id = ?
                `,
                [itemExistente[0].id]
            );

        } else {

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

        }

        res.redirect('/');

    }
);

module.exports = router;