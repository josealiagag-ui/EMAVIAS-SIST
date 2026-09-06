const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'emavias.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

function initDatabase() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create obras table
  db.exec(`
    CREATE TABLE IF NOT EXISTS obras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      codigo TEXT NOT NULL,
      unidad TEXT NOT NULL,
      ubicacion TEXT NOT NULL,
      zona TEXT NOT NULL,
      longitud REAL DEFAULT 0,
      ancho REAL DEFAULT 1,
      area REAL DEFAULT 0,
      tipo TEXT NOT NULL,
      grupo TEXT,
      estado TEXT DEFAULT 'Planificado',
      personal INTEGER DEFAULT 0,
      horas INTEGER DEFAULT 8,
      boleta_mezcla TEXT,
      cant_mezcla REAL DEFAULT 0,
      tipo_ligante TEXT,
      cant_ligante REAL DEFAULT 0,
      observaciones TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create despachos table
  db.exec(`
    CREATE TABLE IF NOT EXISTS despachos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      hora TEXT NOT NULL,
      n_boleta TEXT NOT NULL,
      volqueta TEXT NOT NULL,
      conductor TEXT NOT NULL,
      vol_m3 REAL DEFAULT 0,
      tipo_mezcla TEXT NOT NULL,
      temperatura REAL DEFAULT 0,
      planta TEXT,
      responsable TEXT,
      codigo_obra TEXT NOT NULL,
      destino TEXT,
      obra_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (obra_id) REFERENCES obras(id) ON DELETE SET NULL
    )
  `);

  // Seed default users
  const usersCount = db.prepare('SELECT COUNT(*) as cnt FROM users').get();
  if (usersCount.cnt === 0) {
    const insertUser = db.prepare(
      'INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)'
    );
    insertUser.run('admin', bcrypt.hashSync('1234', 10), 'Administrador', 'Administrador del Sistema');
    insertUser.run('tony', bcrypt.hashSync('emavias2025', 10), 'Tony Aliaga', 'Técnico de Costeo de Obras');
    insertUser.run('gerente', bcrypt.hashSync('gerencia', 10), 'Gerente Técnico', 'Gerente Técnico');
    console.log('✅ Usuarios por defecto creados');
  }

  // Seed obras data
  const obrasCount = db.prepare('SELECT COUNT(*) as cnt FROM obras').get();
  if (obrasCount.cnt === 0) {
    const insertObra = db.prepare(`
      INSERT INTO obras (fecha,codigo,unidad,ubicacion,zona,longitud,ancho,area,tipo,grupo,estado,personal,horas,boleta_mezcla,cant_mezcla,tipo_ligante,cant_ligante,observaciones)
      VALUES (@fecha,@codigo,@unidad,@ubicacion,@zona,@longitud,@ancho,@area,@tipo,@grupo,@estado,@personal,@horas,@boleta_mezcla,@cant_mezcla,@tipo_ligante,@cant_ligante,@observaciones)
    `);
    const obras = [
      {fecha:'2025-11-19',codigo:'EMA-36',unidad:'MALLASILLA',ubicacion:'CALLE 9',zona:'MALLASILLA',longitud:398,ancho:1,area:398,tipo:'ASFALTADO',grupo:'ASFALTO 3',estado:'Completado',personal:12,horas:8,boleta_mezcla:'3174',cant_mezcla:8.12,tipo_ligante:'MC30',cant_ligante:180,observaciones:'Calle 9 tramo completo'},
      {fecha:'2025-11-20',codigo:'EMA-37',unidad:'MALLASILLA',ubicacion:'CALLE S/N 09',zona:'MALLASILLA',longitud:636,ancho:1,area:636,tipo:'ASFALTADO',grupo:'ASFALTO 3',estado:'Completado',personal:12,horas:8,boleta_mezcla:'3181',cant_mezcla:11.28,tipo_ligante:'MC30',cant_ligante:250,observaciones:'Calle S/N 09 tramo completo'},
      {fecha:'2025-10-07',codigo:'EMA-38',unidad:'MALLASILLA',ubicacion:'CALLE 3 Y CALLE 2',zona:'MALLASILLA',longitud:202.97,ancho:1,area:202.97,tipo:'ASFALTADO',grupo:'ASFALTO 2',estado:'Completado',personal:10,horas:8,boleta_mezcla:'3017',cant_mezcla:5.05,tipo_ligante:'MC30',cant_ligante:90,observaciones:'Calle 3 y 2 empalme'},
      {fecha:'2025-09-18',codigo:'EMA-33',unidad:'SAN ANTONIO',ubicacion:'CALLE LOS GLADIOLOS',zona:'TIHUANACU',longitud:427.02,ancho:1,area:427.02,tipo:'ASFALTADO',grupo:'ASFALTO 2',estado:'Completado',personal:12,horas:8,boleta_mezcla:'2965',cant_mezcla:10.50,tipo_ligante:'MC70',cant_ligante:200,observaciones:'Los Gladiolos tramo 1'},
      {fecha:'2026-01-15',codigo:'EMA-45',unidad:'CENTRO',ubicacion:'AV. MARISCAL SANTA CRUZ',zona:'CENTRO',longitud:520,ancho:2,area:1040,tipo:'ASFALTADO',grupo:'ASFALTO 1',estado:'En Ejecucion',personal:16,horas:9,boleta_mezcla:'3350',cant_mezcla:22.4,tipo_ligante:'RC250',cant_ligante:450,observaciones:'Av. Mariscal tramo principal'},
      {fecha:'2026-02-10',codigo:'EMA-46',unidad:'SUR',ubicacion:'CALLE MEXICO',zona:'SUR',longitud:310,ancho:1.5,area:465,tipo:'BACHEO',grupo:'BACHEO 1',estado:'Planificado',personal:8,horas:8,boleta_mezcla:'',cant_mezcla:0,tipo_ligante:'',cant_ligante:0,observaciones:''},
    ];
    obras.forEach(o => insertObra.run(o));
    console.log('✅ Obras de ejemplo cargadas');
  }

  // Seed despachos data
  const despachosCnt = db.prepare('SELECT COUNT(*) as cnt FROM despachos').get();
  if (despachosCnt.cnt === 0) {
    const insertDesp = db.prepare(`
      INSERT INTO despachos (fecha,hora,n_boleta,volqueta,conductor,vol_m3,tipo_mezcla,temperatura,planta,responsable,codigo_obra,destino)
      VALUES (@fecha,@hora,@n_boleta,@volqueta,@conductor,@vol_m3,@tipo_mezcla,@temperatura,@planta,@responsable,@codigo_obra,@destino)
    `);
    const despachos = [
      {fecha:'2025-11-19',hora:'07:30',n_boleta:'3174',volqueta:'CV-01',conductor:'Alanez Mercado Victor Hugo',vol_m3:8,tipo_mezcla:'Bacheo',temperatura:160,planta:'Ciber',responsable:'Victor 21',codigo_obra:'EMA-36',destino:'Mallasilla Calle 9'},
      {fecha:'2025-11-19',hora:'09:15',n_boleta:'3175',volqueta:'VH-39',conductor:'Bautista Llanos Ramiro',vol_m3:8,tipo_mezcla:'Bacheo',temperatura:158,planta:'Ciber',responsable:'Victor 21',codigo_obra:'EMA-36',destino:'Mallasilla Calle 9'},
      {fecha:'2025-11-19',hora:'11:00',n_boleta:'3176',volqueta:'CV-02',conductor:'Chipana Ticona Nelson Fredy',vol_m3:8,tipo_mezcla:'Bacheo',temperatura:162,planta:'Ciber',responsable:'Victor 21',codigo_obra:'EMA-36',destino:'Mallasilla Calle 9'},
      {fecha:'2025-11-20',hora:'07:00',n_boleta:'3181',volqueta:'CV-01',conductor:'Pusarico Condori Jorge',vol_m3:8,tipo_mezcla:'Carpeta',temperatura:160,planta:'Ciber',responsable:'INTECONS',codigo_obra:'EMA-37',destino:'Mallasilla Calle S/N 09'},
      {fecha:'2025-11-20',hora:'08:45',n_boleta:'3182',volqueta:'VH-39',conductor:'Magarinos Loredo Jaime',vol_m3:8,tipo_mezcla:'Carpeta',temperatura:157,planta:'Ciber',responsable:'INTECONS',codigo_obra:'EMA-37',destino:'Mallasilla Calle S/N 09'},
      {fecha:'2025-10-07',hora:'07:00',n_boleta:'3017',volqueta:'CV-02',conductor:'Bautista Llanos Ramiro',vol_m3:6,tipo_mezcla:'Bacheo',temperatura:155,planta:'OMIP',responsable:'DEMTV',codigo_obra:'EMA-38',destino:'Mallasilla Calle 3 y Calle 2'},
      {fecha:'2025-09-18',hora:'07:30',n_boleta:'2965',volqueta:'CV-01',conductor:'Pusarico Condori Jorge',vol_m3:10,tipo_mezcla:'Carpeta',temperatura:163,planta:'Ciber',responsable:'Victor 21',codigo_obra:'EMA-33',destino:'San Antonio Calle Los Gladiolos'},
      {fecha:'2025-09-18',hora:'09:00',n_boleta:'2966',volqueta:'VH-39',conductor:'Magarinos Loredo Jaime',vol_m3:10,tipo_mezcla:'Carpeta',temperatura:161,planta:'Ciber',responsable:'Victor 21',codigo_obra:'EMA-33',destino:'San Antonio Calle Los Gladiolos'},
      {fecha:'2026-01-15',hora:'06:30',n_boleta:'3350',volqueta:'CV-01',conductor:'Alanez Mercado Victor Hugo',vol_m3:12,tipo_mezcla:'Carpeta',temperatura:165,planta:'Ciber',responsable:'INTECONS',codigo_obra:'EMA-45',destino:'Av. Mariscal Santa Cruz'},
      {fecha:'2026-01-15',hora:'08:15',n_boleta:'3351',volqueta:'CV-02',conductor:'Bautista Llanos Ramiro',vol_m3:12,tipo_mezcla:'Carpeta',temperatura:164,planta:'Ciber',responsable:'INTECONS',codigo_obra:'EMA-45',destino:'Av. Mariscal Santa Cruz'},
    ];
    despachos.forEach(d => insertDesp.run(d));
    console.log('✅ Despachos de ejemplo cargados');
  }

  console.log('✅ Base de datos inicializada correctamente');
}

module.exports = { db, initDatabase };
