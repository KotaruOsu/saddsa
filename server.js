const http = require('http');
const url = require('url');

// База данных пользователей (в памяти)
let users = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
];

// Функция для парсинга тела запроса
function parseBody(req, callback) {
    let body = '';
    req.on('data', chunk => {
        body += chunk.toString();
    });
    req.on('end', () => {
        try {
            const parsedBody = body ? JSON.parse(body) : {};
            callback(null, parsedBody);
        } catch (error) {
            callback(error, null);
        }
    });
}

// Создаем сервер
const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const method = req.method;

    // Устанавливаем CORS заголовки
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // Обработка preflight запросов
    if (method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // GET /users - получить всех пользователей
    if (method === 'GET' && pathname === '/users') {
        res.writeHead(200);
        res.end(JSON.stringify(users));
    }
    
    // GET /users/:id - получить конкретного пользователя
    else if (method === 'GET' && pathname.match(/^\/users\/\d+$/)) {
        const id = parseInt(pathname.split('/')[2]);
        const user = users.find(u => u.id === id);
        
        if (user) {
            res.writeHead(200);
            res.end(JSON.stringify(user));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'User not found' }));
        }
    }
    
    // POST /users/add - добавить нового пользователя
    else if (method === 'POST' && pathname === '/users/add') {
        parseBody(req, (err, body) => {
            if (err) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
                return;
            }
            
            if (!body.name) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Name is required' }));
                return;
            }
            
            const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
            const newUser = { id: newId, name: body.name };
            users.push(newUser);
            
            res.writeHead(201);
            res.end(JSON.stringify(newUser));
        });
    }
    
    // DELETE /users/:id - удалить пользователя
    else if (method === 'DELETE' && pathname.match(/^\/users\/\d+$/)) {
        const id = parseInt(pathname.split('/')[2]);
        const userIndex = users.findIndex(u => u.id === id);
        
        if (userIndex !== -1) {
            const deletedUser = users[userIndex];
            users.splice(userIndex, 1);
            res.writeHead(200);
            res.end(JSON.stringify({ 
                status: 'OK', 
                message: 'User deleted successfully',
                deletedUser: deletedUser 
            }));
        } else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'User not found' }));
        }
    }
    
    // 404 - эндпоинт не найден
    else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Endpoint not found' }));
    }
});

// Запускаем сервер на порту (укажите ваш порт, например 3000)
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Test endpoints:`);
    console.log(`  GET    /users`);
    console.log(`  GET    /users/:id`);
    console.log(`  POST   /users/add`);
    console.log(`  DELETE /users/:id`);
});