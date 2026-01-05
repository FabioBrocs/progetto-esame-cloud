require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;

// Middleware CORS: permette al frontend (Vercel) di chiamare questo server
app.use(cors()); 

// Middleware per leggere JSON
app.use(express.json());

// Configurazione Database con supporto SSL per Azure
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: 3306,
    ssl: {
        rejectUnauthorized: false 
    }
};

let db;

// Connessione al Database
async function connectDB() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log("Database Azure connesso con successo!");
    } catch (err) {
        console.error("Errore connessione DB:", err.message);
    }
}
connectDB();

// --- LOGICA DI SICUREZZA ---
const SECRET = process.env.APP_SECRET;

function generaSalt() {
    return crypto.randomBytes(8).toString('hex');
}

function creaHash(password, salt) {
    const stringaDaHashing = password + SECRET + salt;
    return crypto.createHash('md5').update(stringaDaHashing).digest('hex');
}

// --- ROTTE API ---

app.post('/api/registrazione', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ errore: "Dati mancanti" });

    const salt = generaSalt();
    const hash = creaHash(password, salt);

    try {
        const query = "INSERT INTO utenti (username, password_hash, salt) VALUES (?, ?, ?)";
        await db.execute(query, [username, hash, salt]);
        res.json({ messaggio: "Utente registrato correttamente!" });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ errore: "Username già esistente" });
        } else {
            res.status(500).json({ errore: "Errore del server" });
        }
    }
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const query = "SELECT * FROM utenti WHERE username = ?";
        const [rows] = await db.execute(query, [username]);

        if (rows.length === 0) return res.status(401).json({ errore: "Utente non trovato" });

        const utente = rows[0];
        const hashDaVerificare = creaHash(password, utente.salt);

        if (hashDaVerificare === utente.password_hash) {
            res.json({ 
                messaggio: "Login effettuato!", 
                utente: utente.username,
                idUtente: utente.id
            });
        } else {
            res.status(401).json({ errore: "Password errata" });
        }
    } catch (err) {
        res.status(500).json({ errore: "Errore nel login" });
    }
});

app.get('/api/note/:utenteId', async (req, res) => {
    try {
        const query = "SELECT * FROM note WHERE utente_id = ? ORDER BY data_creazione DESC";
        const [rows] = await db.execute(query, [req.params.utenteId]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ errore: "Errore nel recupero delle note" });
    }
});

app.post('/api/note', async (req, res) => {
    const { utenteId, contenuto } = req.body;
    if (!contenuto) return res.status(400).json({ errore: "Nota vuota" });

    try {
        const query = "INSERT INTO note (utente_id, contenuto) VALUES (?, ?)";
        await db.execute(query, [utenteId, contenuto]);
        res.json({ messaggio: "Nota salvata!" });
    } catch (err) {
        res.status(500).json({ errore: "Errore nel salvataggio" });
    }
});

app.delete('/api/note/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = "DELETE FROM note WHERE id = ?";
        await db.execute(query, [id]);
        res.json({ messaggio: "Nota eliminata con successo!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ errore: "Errore durante l'eliminazione della nota" });
    }
});

app.listen(PORT, () => {
    console.log(`Server in ascolto su porta ${PORT}`);
});