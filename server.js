const express = require('express');
const session = require('express-session');
const db = require('./database');
const authRoutes = require('./routes/auth');
const path = require('path');
const auth = require('./middleware/auth');
const admin = require('./middleware/admin');

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret: 'novastore',
    resave: false,
    saveUninitialized: false
}));

app.use(express.static('public'));

app.use('/auth', authRoutes);

app.get('/', async (req, res) => {

    try {

        const [categorias] = await db.query(
            'SELECT * FROM categorias'
        );

        const [produtos] = await db.query(
            'SELECT * FROM produtos WHERE ativo = true'
        );

        let html = `
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <link
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
            rel="stylesheet">

            <link
            rel="stylesheet"
            href="/css/style.css">

            <title>NovaStore</title>

        </head>

        <body>

            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">

                <div class="container">

                    <a
                    class="navbar-brand"
                    href="/">

                        NovaStore

                    </a>

                    <button
                    class="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#menu">

                        <span
                        class="navbar-toggler-icon">
                        </span>

                    </button>

                    <div
                    class="collapse navbar-collapse"
                    id="menu">

                        <ul class="navbar-nav me-auto">

                            <li class="nav-item">

                                <a
                                class="nav-link"
                                href="/">

                                    Início

                                </a>

                            </li>

                            <li class="nav-item">

                                <a
                                class="nav-link"
                                href="/carrinho">

                                    Carrinho

                                </a>

                            </li>

                            <li class="nav-item">

                                <a
                                class="nav-link"
                                href="/meus-pedidos">

                                    Meus Pedidos

                                </a>

                            </li>

                        </ul>

                        <form
                        action="/buscar"
                        method="GET"
                        class="d-flex">

                            <input
                            class="form-control me-2"
                            type="text"
                            name="nome"
                            placeholder="Pesquisar">

                            <button
                            class="btn btn-outline-light">

                                Buscar

                            </button>

                        </form>

                    </div>

                </div>

            </nav>

            <div class="container mt-4">

            <h4>
                Categorias
            </h4>

            <div class="mb-4">

                <a
                href="/"
                class="btn btn-secondary me-2">

                    Todas

                </a>
        `;

        categorias.forEach(categoria => {

            html += `
            <a
            href="/categoria/${categoria.id}"
            class="btn btn-outline-primary me-2">

                ${categoria.nome}

            </a>
            `;

        });

        html += `
            </div>

            <div class="row">
        `;

        produtos.forEach(produto => {

            html += `
            <div class="col-md-4 mb-4">

                <div class="card h-100">

                    <img
                    src="${produto.imagem ? '/uploads/' + produto.imagem : 'https://via.placeholder.com/300x250?text=Sem+Imagem'}"
                    class="card-img-top"
                    style="height:250px;object-fit:cover;">

                    <div class="card-body">

                        <h5>
                            <a
                            href="/produto/${produto.id}"
                            style="text-decoration:none;">
                                ${produto.nome}
                            </a>
                        </h5>

                        <p>
                            ${produto.descricao}
                        </p>

                        <h4 class="text-success">
                            R$ ${produto.preco}
                        </h4>

                        <p>
                            Estoque:
                            ${produto.estoque}
                        </p>

                        <a
                        href="/carrinho/adicionar/${produto.id}"
                        class="btn btn-success">

                            Adicionar ao Carrinho

                        </a>

                    </div>

                </div>

            </div>
            `;

        });

        html += `
            </div>

        </div>

        </body>

        </html>
        `;

        res.send(html);

    } catch (erro) {

        console.error(erro);

        res.send(
            'Erro ao carregar produtos'
        );

    }

});

app.get('/buscar', async (req, res) => {

    const nome = req.query.nome || '';

    const [produtos] = await db.query(
        `
        SELECT *
        FROM produtos
        WHERE nome LIKE ?
        `,
        [`%${nome}%`]
    );

    let html = `
    <!DOCTYPE html>

    <html>

    <head>

        <meta charset="UTF-8">

        <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet">

        <title>Busca</title>

    </head>

    <body>

    <div class="container mt-4">

        <h1>Resultado da Busca</h1>

        <a href="/" class="btn btn-secondary mb-3">
            Voltar
        </a>

        <div class="row">
    `;

    produtos.forEach(produto => {

        html += `
        <div class="col-md-4 mb-4">

            <div class="card h-100">

           ${produto.imagem ? `
            <img src="/uploads/${produto.imagem}" class="card-img-top" style="height:250px;object-fit:cover;">
            ` : `
            <img src="https://via.placeholder.com/300x250?text=Sem+Imagem" class="card-img-top" style="height:250px;object-fit:cover;">
            `}

                <div class="card-body">

                    <h4>${produto.nome}</h4>

                    <p>${produto.descricao}</p>

                    <h3 class="text-success">
                        R$ ${produto.preco}
                    </h3>

                    <p>
                        Estoque:
                        ${produto.estoque}
                    </p>

                    <a
                    href="/carrinho/adicionar/${produto.id}"
                    class="btn btn-success">

                        Adicionar ao Carrinho

                    </a>

                </div>

            </div>

        </div>
        `;

    });

    html += `
        </div>

    </div>

    </body>

    </html>
    `;

    res.send(html);

});

app.get('/categoria/:id', async (req, res) => {

    try {

        const [categorias] = await db.query(
            'SELECT * FROM categorias'
        );

        const [produtos] = await db.query(
            `
            SELECT *
            FROM produtos
            WHERE categoria_id = ?
            `,
            [req.params.id]
        );

        let html = `
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <link
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
            rel="stylesheet">

            <link
            rel="stylesheet"
            href="/css/style.css">

            <title>NovaStore</title>

        </head>

        <body>

        <div class="container mt-4">

            <h1 class="mb-4">
                NovaStore
            </h1>

            <form
            action="/buscar"
            method="GET"
            class="mb-4">

                <div class="input-group">

                    <input
                    type="text"
                    name="nome"
                    class="form-control"
                    placeholder="Pesquisar produto">

                    <button
                    class="btn btn-primary">

                        Buscar

                    </button>

                </div>

            </form>

            <h4>
                Categorias
            </h4>

            <div class="mb-4">

                <a
                href="/"
                class="btn btn-secondary me-2">

                    Todas

                </a>
        `;

        categorias.forEach(categoria => {

            html += `
            <a
            href="/categoria/${categoria.id}"
            class="btn btn-outline-primary me-2">

                ${categoria.nome}

            </a>
            `;

        });

        html += `
            </div>

            <div class="row">
        `;

        produtos.forEach(produto => {

            html += `
            <div class="col-md-4 mb-4">

                <div class="card h-100">

                    <img
                    src="${produto.imagem ? '/uploads/' + produto.imagem : 'https://via.placeholder.com/300x250?text=Sem+Imagem'}"
                    class="card-img-top"
                    style="height:250px;object-fit:cover;">

                    <div class="card-body">

                        <h5>
                            ${produto.nome}
                        </h5>

                        <p>
                            ${produto.descricao}
                        </p>

                        <h4 class="text-success">
                            R$ ${produto.preco}
                        </h4>

                        <p>
                            Estoque:
                            ${produto.estoque}
                        </p>

                        <a
                        href="/carrinho/adicionar/${produto.id}"
                        class="btn btn-success">

                            Adicionar ao Carrinho

                        </a>

                    </div>

                </div>

            </div>
            `;

        });

        html += `
            </div>

        </div>

        </body>

        </html>
        `;

        res.send(html);

    } catch (erro) {

        console.error(erro);

        res.send(
            'Erro ao carregar categoria'
        );

    }

});

app.get('/produto/:id', async (req, res) => {

    try {

        const [produtos] = await db.query(
            `
            SELECT p.*, c.nome categoria

            FROM produtos p

            LEFT JOIN categorias c
            ON c.id = p.categoria_id

            WHERE p.id = ?
            `,
            [req.params.id]
        );

        if(produtos.length === 0){

            return res.send(
                'Produto não encontrado'
            );

        }

        const produto = produtos[0];

        let html = `
        <!DOCTYPE html>

        <html>

        <head>

            <meta charset="UTF-8">

            <link
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
            rel="stylesheet">

            <title>
                ${produto.nome}
            </title>

        </head>

        <body>

        <div class="container mt-5">

            <a
            href="/"
            class="btn btn-secondary mb-4">

                Voltar

            </a>

            <div class="row">

                <div class="col-md-5">

                    <img
                    src="${produto.imagem ? '/uploads/' + produto.imagem : 'https://via.placeholder.com/500x500?text=Sem+Imagem'}"
                    class="img-fluid rounded">

                </div>

                <div class="col-md-7">

                    <h1>
                        ${produto.nome}
                    </h1>

                    <p>
                        Categoria:
                        ${produto.categoria || 'Sem categoria'}
                    </p>

                    <h2 class="text-success">

                        R$ ${produto.preco}

                    </h2>

                    <p>

                        Estoque:
                        ${produto.estoque}

                    </p>

                    <hr>

                    <p>

                        ${produto.descricao}

                    </p>

                    <a
                    href="/carrinho/adicionar/${produto.id}"
                    class="btn btn-success btn-lg">

                        Adicionar ao Carrinho

                    </a>

                </div>

            </div>

        </div>

        </body>

        </html>
        `;

        res.send(html);

    } catch(err){

        console.log(err);

        res.send(
            'Erro ao carregar produto'
        );

    }

});

app.listen(3000, () => {
    console.log('NovaStore rodando em http://localhost:3000');
});

app.get('/login', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'views', 'login.html')
    );
});

app.get('/cadastro', (req, res) => {
    res.sendFile(
        path.join(__dirname, 'views', 'cadastro.html')
    );
});

app.get('/admin', admin, async (req, res) => {

    const [[produtos]] =
    await db.query(
        'SELECT COUNT(*) total FROM produtos'
    );

    const [[usuarios]] =
    await db.query(
        'SELECT COUNT(*) total FROM usuarios'
    );

    const [[pedidos]] =
    await db.query(
        'SELECT COUNT(*) total FROM pedidos'
    );

    res.send(`

    <h1>Painel Administrativo</h1>

    <hr>

    <h3>
        📦 Produtos:
        ${produtos.total}
    </h3>

    <h3>
        👥 Usuários:
        ${usuarios.total}
    </h3>

    <h3>
        🛒 Pedidos:
        ${pedidos.total}
    </h3>

    <br>

    <a href="/admin/produtos/lista">
        Produtos
    </a>

    <br><br>

    <a href="/admin/usuarios">
        Usuários
    </a>

    <br><br>

    <a href="/admin/pedidos">
        Pedidos
    </a>

    `);

});

app.use('/uploads', express.static('uploads'));

const produtosRoutes =
require('./routes/produtos');

app.use('/produtos', produtosRoutes);

app.get('/admin/produtos', admin, (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            'views',
            'admin',
            'produtos.html'
        )
    );

});

const carrinhoRoutes =
require('./routes/carrinho');

app.use('/carrinho', carrinhoRoutes);

app.get('/carrinho', async (req, res) => {

    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    const [itens] = await db.query(
        `
        SELECT
            ic.id,
            p.nome,
            p.preco,
            p.imagem,
            ic.quantidade

        FROM itens_carrinho ic

        INNER JOIN produtos p
        ON p.id = ic.produto_id

        INNER JOIN carrinhos c
        ON c.id = ic.carrinho_id

        WHERE c.usuario_id = ?
        `,
        [req.session.usuario.id]
    );

    let html = `
    <h1>Carrinho</h1>
    `;

    itens.forEach(item => {

        html += `
        <p>
            ${item.nome}
            -
            R$ ${item.preco}
        </p>
        `;

    });

    html += `
    <br>
    <a href="/finalizar">
        Finalizar Pedido
    </a>
    `;

    res.send(html);

});

const pedidosRoutes =
require('./routes/pedidos');

app.use('/', pedidosRoutes);

// Criar histórico de pedidos

app.get('/meus-pedidos', async (req, res) => {

    if (!req.session.usuario) {
        return res.redirect('/login');
    }

    const [pedidos] = await db.query(
        `
        SELECT *
        FROM pedidos
        WHERE usuario_id = ?
        ORDER BY id DESC
        `,
        [req.session.usuario.id]
    );

    let html = `
    <h1>Meus Pedidos</h1>
    <hr>
    `;

    pedidos.forEach(pedido => {

        html += `
        <div>

            <strong>Pedido #${pedido.id}</strong>

            <br>

            Total:
            R$ ${pedido.valor_total}

            <br>

            Status:
            ${pedido.status}

            <hr>

        </div>
        `;

    });

    res.send(html);

});

// historico

app.get('/admin/pedidos', admin, async (req, res) => {

    const [pedidos] = await db.query(
        `
        SELECT
            p.*,
            u.nome

        FROM pedidos p

        INNER JOIN usuarios u
        ON u.id = p.usuario_id

        ORDER BY p.id DESC
        `
    );

    let html = `
        <table class="table table-striped">

        <thead>
        <tr>

        <th>ID</th>
        <th>Cliente</th>
        <th>Total</th>
        <th>Status</th>
        <th>Ações</th>

        </tr>
        </thead>

        <tbody>
    `;

    pedidos.forEach(pedido => {

    html += `
        <tr>

            <td>${pedido.id}</td>

            <td>${pedido.nome}</td>

            <td>R$ ${pedido.valor_total}</td>

            <td>${pedido.status}</td>

            <td>

                <a
                href="/admin/pedido/${pedido.id}"
                class="btn btn-primary btn-sm">

                    Ver

                </a>

                <a
                href="/admin/pedido/${pedido.id}/status/pago"
                class="btn btn-success btn-sm">

                    Pago

                </a>

                <a
                href="/admin/pedido/${pedido.id}/status/enviado"
                class="btn btn-warning btn-sm">

                    Enviado

                </a>

                <a
                href="/admin/pedido/${pedido.id}/status/entregue"
                class="btn btn-dark btn-sm">

                    Entregue

                </a>

            </td>

        </tr>
        `;

    });

        html += `
            </tbody>
            </table>
            `;

    res.send(html);

});

// 

app.get('/admin/produtos/lista', admin, async (req, res) => {

    const [produtos] = await db.query(
        'SELECT * FROM produtos'
    );

    let html = `
    <h1>Produtos</h1>

    <a href="/admin/produtos">
        Novo Produto
    </a>

    <hr>
    `;

    produtos.forEach(produto => {

        html += `
        <p>

            ${produto.nome}

            -

            R$ ${produto.preco}

            -

            <a href="/admin/produtos/editar/${produto.id}">
                Editar
            </a>

            -

            <a href="/admin/produtos/excluir/${produto.id}">
                Excluir
            </a>

        </p>
        `;

    });

    res.send(html);

});

//

app.get('/admin/produtos/editar/:id', admin, async (req, res) => {

    const [produto] = await db.query(
        'SELECT * FROM produtos WHERE id = ?',
        [req.params.id]
    );

    const p = produto[0];

    res.send(`

    <form
    action="/produtos/editar/${p.id}"
    method="POST">

        <input
        name="nome"
        value="${p.nome}">

        <br><br>

        <input
        name="preco"
        value="${p.preco}">

        <br><br>

        <input
        name="estoque"
        value="${p.estoque}">

        <br><br>

        <button>
            Salvar
        </button>

    </form>

    `);

});

app.use('/admin/produtos', produtosRoutes);

app.get('/admin/usuarios', admin, async (req, res) => {

    const [usuarios] = await db.query(
        `
        SELECT *
        FROM usuarios
        ORDER BY id
        `
    );

    let html = `
    <!DOCTYPE html>

    <html>

    <head>

        <meta charset="UTF-8">

        <link
        href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
        rel="stylesheet">
        <link rel="stylesheet" href="/css/style.css">
        <title>Usuários</title>

    </head>

    <body>

    <div class="container mt-5">

        <h1>Gerenciar Usuários</h1>

        <table class="table table-striped">

            <thead>

                <tr>

                    <th>ID</th>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Tipo</th>
                    <th>Ações</th>

                </tr>

            </thead>

            <tbody>
    `;

    usuarios.forEach(usuario => {

        html += `
        <tr>

            <td>${usuario.id}</td>

            <td>${usuario.nome}</td>

            <td>${usuario.email}</td>

            <td>${usuario.tipo_usuario}</td>

            <td>

                <a
                href="/admin/usuarios/promover/${usuario.id}"
                class="btn btn-success btn-sm">

                    Admin

                </a>

                <a
                href="/admin/usuarios/cliente/${usuario.id}"
                class="btn btn-warning btn-sm">

                    Cliente

                </a>

                <a
                href="/admin/usuarios/excluir/${usuario.id}"
                class="btn btn-danger btn-sm">

                    Excluir

                </a>

            </td>

        </tr>
        `;

    });

    html += `
            </tbody>

        </table>

    </div>

    </body>

    </html>
    `;

    res.send(html);

});

app.get('/admin/usuarios/promover/:id', admin, async (req, res) => {

    await db.query(
        `
        UPDATE usuarios
        SET tipo_usuario = 'admin'
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.redirect('/admin/usuarios');

});

app.get('/admin/usuarios/cliente/:id', admin, async (req, res) => {

    await db.query(
        `
        UPDATE usuarios
        SET tipo_usuario = 'cliente'
        WHERE id = ?
        `,
        [req.params.id]
    );

    res.redirect('/admin/usuarios');

});

app.get('/admin/usuarios/excluir/:id', admin, async (req, res) => {

    const id = req.params.id;

    if(id == req.session.usuario.id){

        return res.send(
            'Você não pode excluir sua própria conta.'
        );

    }

    await db.query(
        `
        DELETE FROM usuarios
        WHERE id = ?
        `,
        [id]
    );

    res.redirect('/admin/usuarios');

});

app.get('/admin/pedido/:id', admin, async (req, res) => {

    const [itens] = await db.query(
        `
        SELECT
            ip.*,
            p.nome

        FROM itens_pedido ip

        INNER JOIN produtos p
        ON p.id = ip.produto_id

        WHERE ip.pedido_id = ?
        `,
        [req.params.id]
    );

    let html = `
    <h1>Pedido #${req.params.id}</h1>
    <hr>
    `;

    itens.forEach(item => {

        html += `
        <p>

            ${item.nome}

            -

            Quantidade:
            ${item.quantidade}

            -

            R$ ${item.preco_unitario}

        </p>
        `;

    });

    res.send(html);

});

app.get('/admin/pedido/:id/status/:status',admin,async (req, res) => {

    await db.query(
        `
        UPDATE pedidos

        SET status = ?

        WHERE id = ?
        `,
        [
            req.params.status,
            req.params.id
        ]
    );

    res.redirect('/admin/pedidos');

});