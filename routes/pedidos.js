const express = require('express');
const router = express.Router();

const db = require('../database');

router.get('/finalizar', async (req, res) => {

    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    try {

        const usuarioId = req.session.usuario.id;

        const [carrinho] = await db.query(
            `
            SELECT *
            FROM carrinhos
            WHERE usuario_id = ?
            `,
            [usuarioId]
        );

        if (carrinho.length === 0) {
            return res.send('Carrinho vazio');
        }

        const carrinhoId = carrinho[0].id;

        const [itens] = await db.query(
            `
            SELECT
                ic.*,
                p.preco

            FROM itens_carrinho ic

            INNER JOIN produtos p
            ON p.id = ic.produto_id

            WHERE ic.carrinho_id = ?
            `,
            [carrinhoId]
        );

        if (itens.length === 0) {
            return res.send('Carrinho vazio');
        }

        let total = 0;

        itens.forEach(item => {
            total += item.preco * item.quantidade;
        });

        const [pedido] = await db.query(
            `
            INSERT INTO pedidos
            (
                usuario_id,
                valor_total
            )
            VALUES
            (?, ?)
            `,
            [usuarioId, total]
        );

        const pedidoId = pedido.insertId;

        for (const item of itens) {

            await db.query(
                `
                INSERT INTO itens_pedido
                (
                    pedido_id,
                    produto_id,
                    quantidade,
                    preco_unitario
                )
                VALUES
                (?, ?, ?, ?)
                `,
                [
                    pedidoId,
                    item.produto_id,
                    item.quantidade,
                    item.preco
                ]
            );

        await db.query(
            `
            UPDATE produtos

            SET estoque = estoque - ?

            WHERE id = ?
            `,
        [
            item.quantidade,
            item.produto_id
        ]
        );

        }

        await db.query(
            `
            DELETE FROM itens_carrinho
            WHERE carrinho_id = ?
            `,
            [carrinhoId]
        );

        res.redirect('/meus-pedidos');

    } catch (erro) {

        console.error(erro);
        res.send('Erro ao finalizar pedido');

    }

});

module.exports = router;