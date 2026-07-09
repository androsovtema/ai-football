/* ============================================================
   AI ФУТБОЛ — данные команд ЧМ-2026
   Реальные сборные, игроки и номера (состояние турнира: июль 2026,
   стадия 1/4 финала). Рейтинги 0-100 выведены из выступлений на ЧМ.
   ============================================================ */

window.TEAMS = [
  {
    id: 'ARG', name: 'Аргентина', flag: '🇦🇷',
    kit:  { p: '#7ec8e3', s: '#ffffff', gk: '#2e7d32', striped: true },
    kit2: { p: '#2b2b4e', s: '#7ec8e3', gk: '#c62828', striped: false },
    formation: '433',
    ratings: { atk: 92, def: 85, pas: 91, pace: 82, team: 90, exp: 96 },
    desc: 'Действующий чемпион мира. В 1/4 финала ЧМ-2026. Месси в 39 лет — лучший бомбардир турнира (8 голов) и единственный в истории, кто забивал в 7 матчах ЧМ подряд.',
    strengths: ['Месси — лидер бомбардиров ЧМ-2026', 'Самая опытная команда турнира', 'Точный комбинационный пас'],
    players: [
      { n: 23, name: 'E. Martínez', pos: 'GK' },
      { n: 26, name: 'Molina',      pos: 'DF' },
      { n: 13, name: 'Romero',      pos: 'DF' },
      { n: 19, name: 'Otamendi',    pos: 'DF' },
      { n: 3,  name: 'Tagliafico',  pos: 'DF' },
      { n: 7,  name: 'De Paul',     pos: 'MF' },
      { n: 24, name: 'E. Fernández',pos: 'MF' },
      { n: 20, name: 'Mac Allister',pos: 'MF' },
      { n: 10, name: 'Messi',       pos: 'FW', c: true, boost: { pass: 8, shoot: 7 } },
      { n: 9,  name: 'J. Álvarez',  pos: 'FW', boost: { shoot: 4 } },
      { n: 15, name: 'N. González', pos: 'FW' }
    ]
  },
  {
    id: 'FRA', name: 'Франция', flag: '🇫🇷',
    kit:  { p: '#1f3a93', s: '#ffffff', gk: '#e3c62c', striped: false },
    kit2: { p: '#ffffff', s: '#1f3a93', gk: '#e3c62c', striped: false },
    formation: '433',
    ratings: { atk: 93, def: 87, pas: 88, pace: 94, team: 86, exp: 91 },
    desc: 'В 1/4 финала играет с Марокко. Мбаппе забил 7 голов и обошёл Клозе в списке лучших бомбардиров в истории ЧМ. Самая быстрая атака турнира.',
    strengths: ['Мбаппе — 7 голов на турнире', 'Молниеносные контратаки', 'Опыт двух последних финалов ЧМ'],
    players: [
      { n: 16, name: 'Maignan',     pos: 'GK' },
      { n: 5,  name: 'Koundé',      pos: 'DF' },
      { n: 17, name: 'Saliba',      pos: 'DF' },
      { n: 4,  name: 'Upamecano',   pos: 'DF' },
      { n: 22, name: 'T. Hernández',pos: 'DF', boost: { pace: 4 } },
      { n: 8,  name: 'Tchouaméni',  pos: 'MF' },
      { n: 6,  name: 'Camavinga',   pos: 'MF' },
      { n: 14, name: 'Olise',       pos: 'MF', boost: { pass: 4 } },
      { n: 11, name: 'Dembélé',     pos: 'FW', boost: { pace: 5, pass: 4 } },
      { n: 15, name: 'M. Thuram',   pos: 'FW' },
      { n: 10, name: 'Mbappé',      pos: 'FW', c: true, boost: { pace: 8, shoot: 7 } }
    ]
  },
  {
    id: 'ESP', name: 'Испания', flag: '🇪🇸',
    kit:  { p: '#c8102e', s: '#f1bf00', gk: '#00695c', striped: false },
    kit2: { p: '#2c5f9e', s: '#ffffff', gk: '#f1bf00', striped: false },
    formation: '433',
    ratings: { atk: 89, def: 86, pas: 96, pace: 85, team: 95, exp: 88 },
    desc: 'Чемпион Европы. На ЧМ-2026 разгромила Австрию 3:0 и вышла на Бельгию в 1/4. Лучший контроль мяча на турнире, Ямаль — лидер по обводкам (17 удачных дриблингов).',
    strengths: ['Лучший пас и владение мячом на ЧМ', 'Идеальная сыгранность (тики-така)', 'Ямаль — лидер турнира по дриблингу'],
    players: [
      { n: 23, name: 'Unai Simón',  pos: 'GK' },
      { n: 2,  name: 'Porro',       pos: 'DF' },
      { n: 4,  name: 'Cubarsí',     pos: 'DF' },
      { n: 14, name: 'Laporte',     pos: 'DF' },
      { n: 24, name: 'Cucurella',   pos: 'DF' },
      { n: 16, name: 'Rodri',       pos: 'MF', c: true, boost: { pass: 6 } },
      { n: 20, name: 'Pedri',       pos: 'MF', boost: { pass: 5 } },
      { n: 10, name: 'Dani Olmo',   pos: 'MF' },
      { n: 19, name: 'Lamine Yamal',pos: 'FW', boost: { pace: 6, pass: 6 } },
      { n: 21, name: 'Oyarzabal',   pos: 'FW' },
      { n: 12, name: 'Baena',       pos: 'FW' }
    ]
  },
  {
    id: 'ENG', name: 'Англия', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    kit:  { p: '#f5f5f5', s: '#1a237e', gk: '#f9a825', striped: false },
    kit2: { p: '#8e2432', s: '#ffffff', gk: '#f9a825', striped: false },
    formation: '433',
    ratings: { atk: 91, def: 88, pas: 87, pace: 87, team: 85, exp: 88 },
    desc: 'В 1/4 финала против Норвегии. Выбила Мексику в 1/8. Кейн забил 6 голов — третий в гонке бомбардиров. Мощная, сбалансированная команда без слабых мест.',
    strengths: ['Кейн — 6 голов на турнире', 'Сильнейшая скамейка на ЧМ', 'Стандарты и мощная оборона'],
    players: [
      { n: 1,  name: 'Pickford',       pos: 'GK' },
      { n: 2,  name: 'Reece James',    pos: 'DF' },
      { n: 5,  name: 'Stones',         pos: 'DF' },
      { n: 6,  name: 'Guéhi',          pos: 'DF' },
      { n: 3,  name: 'Lewis-Skelly',   pos: 'DF' },
      { n: 4,  name: 'Rice',           pos: 'MF' },
      { n: 10, name: 'Bellingham',     pos: 'MF', boost: { shoot: 4, pass: 4 } },
      { n: 24, name: 'Palmer',         pos: 'MF', boost: { pass: 4 } },
      { n: 7,  name: 'Saka',           pos: 'FW', boost: { pace: 4 } },
      { n: 9,  name: 'Kane',           pos: 'FW', c: true, boost: { shoot: 7 } },
      { n: 11, name: 'Foden',          pos: 'FW' }
    ]
  },
  {
    id: 'NOR', name: 'Норвегия', flag: '🇳🇴',
    kit:  { p: '#d32f2f', s: '#ffffff', gk: '#455a64', striped: false },
    kit2: { p: '#f5f5f5', s: '#003087', gk: '#455a64', striped: false },
    formation: '433',
    ratings: { atk: 90, def: 79, pas: 82, pace: 89, team: 84, exp: 73 },
    desc: 'Главная сенсация ЧМ-2026: в 1/8 выбила Бразилию 2:1 (дубль Холанда в концовке). Холанд забил 7 голов в 4 матчах. Дебютант плей-офф, но с самым страшным нападающим.',
    strengths: ['Холанд — 7 голов, дубль Бразилии', 'Высокий прессинг и быстрые вертикальные атаки', 'Эдегор — творческий центр команды'],
    players: [
      { n: 1,  name: 'Nyland',      pos: 'GK' },
      { n: 2,  name: 'Ryerson',     pos: 'DF' },
      { n: 3,  name: 'Ajer',        pos: 'DF' },
      { n: 4,  name: 'Østigård',    pos: 'DF' },
      { n: 5,  name: 'Wolfe',       pos: 'DF' },
      { n: 6,  name: 'Berge',       pos: 'MF' },
      { n: 10, name: 'Ødegaard',    pos: 'MF', c: true, boost: { pass: 7 } },
      { n: 8,  name: 'P. Berg',     pos: 'MF' },
      { n: 19, name: 'Sørloth',     pos: 'FW' },
      { n: 9,  name: 'Haaland',     pos: 'FW', boost: { shoot: 9, pace: 5 } },
      { n: 11, name: 'Nusa',        pos: 'FW', boost: { pace: 5 } }
    ]
  },
  {
    id: 'BEL', name: 'Бельгия', flag: '🇧🇪',
    kit:  { p: '#c8102e', s: '#fdda24', gk: '#37474f', striped: false },
    kit2: { p: '#2b2b2b', s: '#fdda24', gk: '#c8102e', striped: false },
    formation: '4231',
    ratings: { atk: 86, def: 82, pas: 87, pace: 81, team: 82, exp: 90 },
    desc: 'В 1/4 финала против Испании. Прошла Сенегал 3:2 в дополнительное время и выбила хозяев-американцев. Последний танец золотого поколения Де Брёйне.',
    strengths: ['Де Брёйне — лучшие передачи в Европе', 'Опыт золотого поколения', 'Куртуа — вратарь мирового класса'],
    players: [
      { n: 1,  name: 'Courtois',    pos: 'GK', boost: { save: 6 } },
      { n: 21, name: 'Castagne',    pos: 'DF' },
      { n: 3,  name: 'Debast',      pos: 'DF' },
      { n: 5,  name: 'Theate',      pos: 'DF' },
      { n: 15, name: 'De Cuyper',   pos: 'DF' },
      { n: 24, name: 'A. Onana',    pos: 'MF' },
      { n: 8,  name: 'Tielemans',   pos: 'MF', c: true },
      { n: 7,  name: 'De Bruyne',   pos: 'MF', boost: { pass: 8 } },
      { n: 11, name: 'Doku',        pos: 'FW', boost: { pace: 6 } },
      { n: 9,  name: 'Lukaku',      pos: 'FW', boost: { shoot: 5 } },
      { n: 17, name: 'Trossard',    pos: 'FW' }
    ]
  },
  {
    id: 'MAR', name: 'Марокко', flag: '🇲🇦',
    kit:  { p: '#b71c1c', s: '#1b5e20', gk: '#f9a825', striped: false },
    kit2: { p: '#1b5e20', s: '#b71c1c', gk: '#f9a825', striped: false },
    formation: '433',
    ratings: { atk: 80, def: 90, pas: 82, pace: 88, team: 91, exp: 85 },
    desc: 'Полуфиналист ЧМ-2022 снова в 1/4: выбил Канаду в 1/8 и играет с Францией. Лучшая оборона турнира и невероятная слаженность. Хакими — лидер и мотор команды.',
    strengths: ['Лучшая оборона ЧМ-2026', 'Железная дисциплина и слаженность', 'Хакими — быстрейший защитник мира'],
    players: [
      { n: 1,  name: 'Bounou',      pos: 'GK', boost: { save: 5 } },
      { n: 2,  name: 'Hakimi',      pos: 'DF', c: true, boost: { pace: 7 } },
      { n: 5,  name: 'Aguerd',      pos: 'DF' },
      { n: 6,  name: 'El Yamiq',    pos: 'DF' },
      { n: 3,  name: 'Mazraoui',    pos: 'DF' },
      { n: 4,  name: 'Amrabat',     pos: 'MF' },
      { n: 8,  name: 'Ounahi',      pos: 'MF' },
      { n: 7,  name: 'El Khannouss',pos: 'MF' },
      { n: 10, name: 'Brahim Díaz', pos: 'FW', boost: { pass: 4 } },
      { n: 19, name: 'En-Nesyri',   pos: 'FW' },
      { n: 17, name: 'Ezzalzouli',  pos: 'FW' }
    ]
  },
  {
    id: 'SUI', name: 'Швейцария', flag: '🇨🇭',
    kit:  { p: '#d52b1e', s: '#ffffff', gk: '#6a1b9a', striped: false },
    kit2: { p: '#ffffff', s: '#d52b1e', gk: '#6a1b9a', striped: false },
    formation: '4231',
    ratings: { atk: 77, def: 87, pas: 84, pace: 78, team: 88, exp: 86 },
    desc: 'В 1/4 финала против Аргентины. Прошла Колумбию по пенальти 4:3 (решающий удар — Варгас) после 0:0. Дисциплина, порядок и хладнокровие — фирменный швейцарский стиль.',
    strengths: ['Победа над Колумбией по пенальти', 'Хладнокровие в решающие моменты', 'Джака — дирижёр и капитан'],
    players: [
      { n: 1,  name: 'Kobel',       pos: 'GK', boost: { save: 4 } },
      { n: 3,  name: 'Widmer',      pos: 'DF' },
      { n: 5,  name: 'Akanji',      pos: 'DF' },
      { n: 4,  name: 'Elvedi',      pos: 'DF' },
      { n: 13, name: 'Muheim',      pos: 'DF' },
      { n: 8,  name: 'Freuler',     pos: 'MF' },
      { n: 10, name: 'Xhaka',       pos: 'MF', c: true, boost: { pass: 5 } },
      { n: 15, name: 'Rieder',      pos: 'MF' },
      { n: 26, name: 'Ndoye',       pos: 'FW' },
      { n: 7,  name: 'Embolo',      pos: 'FW' },
      { n: 17, name: 'R. Vargas',   pos: 'FW' }
    ]
  },
  {
    id: 'BRA', name: 'Бразилия', flag: '🇧🇷',
    kit:  { p: '#ffdf00', s: '#009c3b', gk: '#0d47a1', striped: false },
    kit2: { p: '#002776', s: '#ffdf00', gk: '#009c3b', striped: false },
    formation: '433',
    ratings: { atk: 90, def: 82, pas: 87, pace: 92, team: 79, exp: 87 },
    desc: 'Пятикратный чемпион сенсационно вылетел в 1/8 от Норвегии (1:2). Индивидуально — одни из сильнейших: Винисиус — 2-й на ЧМ по дриблингу. Но сыгранность подвела.',
    strengths: ['Винисиус — 16 удачных обводок на ЧМ', 'Взрывная скорость флангов', 'Техника мирового уровня'],
    players: [
      { n: 1,  name: 'Alisson',     pos: 'GK', boost: { save: 5 } },
      { n: 2,  name: 'Vanderson',   pos: 'DF' },
      { n: 4,  name: 'Marquinhos',  pos: 'DF', c: true },
      { n: 3,  name: 'Militão',     pos: 'DF' },
      { n: 6,  name: 'Wendell',     pos: 'DF' },
      { n: 5,  name: 'Casemiro',    pos: 'MF' },
      { n: 8,  name: 'B. Guimarães',pos: 'MF' },
      { n: 10, name: 'Rodrygo',     pos: 'MF' },
      { n: 11, name: 'Raphinha',    pos: 'FW', boost: { shoot: 4 } },
      { n: 9,  name: 'João Pedro',  pos: 'FW' },
      { n: 7,  name: 'Vinícius Jr', pos: 'FW', boost: { pace: 7, pass: 4 } }
    ]
  },
  {
    id: 'POR', name: 'Португалия', flag: '🇵🇹',
    kit:  { p: '#8b1a1a', s: '#00693e', gk: '#f9a825', striped: false },
    kit2: { p: '#f5f5f5', s: '#8b1a1a', gk: '#f9a825', striped: false },
    formation: '433',
    ratings: { atk: 88, def: 84, pas: 89, pace: 83, team: 84, exp: 92 },
    desc: 'Прошла Хорватию 2:1, но уступила в 1/8 финала. Роналду в 41 год стал единственным футболистом, забивавшим на шести разных чемпионатах мира.',
    strengths: ['Роналду — голы на 6 разных ЧМ', 'Один из лучших центров поля в мире', 'Бруну Фернандеш — мастер последнего паса'],
    players: [
      { n: 22, name: 'D. Costa',      pos: 'GK' },
      { n: 20, name: 'Cancelo',       pos: 'DF' },
      { n: 4,  name: 'Rúben Dias',    pos: 'DF' },
      { n: 13, name: 'G. Inácio',     pos: 'DF' },
      { n: 19, name: 'Nuno Mendes',   pos: 'DF' },
      { n: 23, name: 'Vitinha',       pos: 'MF', boost: { pass: 4 } },
      { n: 8,  name: 'B. Fernandes',  pos: 'MF', boost: { pass: 6 } },
      { n: 18, name: 'João Neves',    pos: 'MF' },
      { n: 10, name: 'B. Silva',      pos: 'FW' },
      { n: 7,  name: 'Ronaldo',       pos: 'FW', c: true, boost: { shoot: 8 } },
      { n: 17, name: 'Leão',          pos: 'FW', boost: { pace: 5 } }
    ]
  },
  {
    id: 'USA', name: 'США', flag: '🇺🇸',
    kit:  { p: '#f5f5f5', s: '#b22234', gk: '#00897b', striped: false },
    kit2: { p: '#1c2d5a', s: '#ffffff', gk: '#00897b', striped: false },
    formation: '433',
    ratings: { atk: 79, def: 79, pas: 77, pace: 86, team: 81, exp: 76 },
    desc: 'Хозяева турнира. Уверенно прошли Боснию 2:0, но уступили Бельгии в 1/8 финала. Молодая, атлетичная команда во главе с Пулишичем.',
    strengths: ['Атлетизм и скорость', 'Поддержка домашних трибун', 'Пулишич — капитан и звезда'],
    players: [
      { n: 1,  name: 'Turner',       pos: 'GK' },
      { n: 2,  name: 'Dest',         pos: 'DF' },
      { n: 3,  name: 'C. Richards',  pos: 'DF' },
      { n: 13, name: 'Ream',         pos: 'DF' },
      { n: 5,  name: 'A. Robinson',  pos: 'DF', boost: { pace: 4 } },
      { n: 4,  name: 'Adams',        pos: 'MF' },
      { n: 8,  name: 'McKennie',     pos: 'MF' },
      { n: 6,  name: 'Musah',        pos: 'MF' },
      { n: 21, name: 'Weah',         pos: 'FW' },
      { n: 20, name: 'Balogun',      pos: 'FW' },
      { n: 10, name: 'Pulisic',      pos: 'FW', c: true, boost: { pace: 4, shoot: 4 } }
    ]
  },
  {
    id: 'MEX', name: 'Мексика', flag: '🇲🇽',
    kit:  { p: '#046a38', s: '#ffffff', gk: '#5d4037', striped: false },
    kit2: { p: '#f5f5f5', s: '#046a38', gk: '#5d4037', striped: false },
    formation: '433',
    ratings: { atk: 78, def: 80, pas: 79, pace: 82, team: 84, exp: 82 },
    desc: 'Хозяева турнира. Уверенно обыграли Эквадор 2:0 в 1/16, но уступили Англии в 1/8 финала. Сыгранная команда с молодой звездой Морой.',
    strengths: ['Сыгранность и командный дух', 'Домашняя поддержка', 'Мора — открытие турнира'],
    players: [
      { n: 1,  name: 'Malagón',     pos: 'GK' },
      { n: 2,  name: 'J. Sánchez',  pos: 'DF' },
      { n: 3,  name: 'C. Montes',   pos: 'DF' },
      { n: 5,  name: 'J. Vásquez',  pos: 'DF' },
      { n: 23, name: 'Gallardo',    pos: 'DF' },
      { n: 4,  name: 'E. Álvarez',  pos: 'MF', c: true },
      { n: 6,  name: 'Lira',        pos: 'MF' },
      { n: 26, name: 'Mora',        pos: 'MF', boost: { pass: 4 } },
      { n: 22, name: 'Lozano',      pos: 'FW', boost: { pace: 4 } },
      { n: 9,  name: 'R. Jiménez',  pos: 'FW' },
      { n: 10, name: 'A. Vega',     pos: 'FW' }
    ]
  }
];

/* Схемы: координаты (x — от своих ворот 0..1, y — 0..1), порядок = порядок в составе */
window.FORMATIONS = {
  '433': [
    [0.045, 0.50],
    [0.18, 0.14], [0.15, 0.37], [0.15, 0.63], [0.18, 0.86],
    [0.34, 0.28], [0.31, 0.50], [0.34, 0.72],
    [0.55, 0.16], [0.58, 0.50], [0.55, 0.84]
  ],
  '4231': [
    [0.045, 0.50],
    [0.18, 0.14], [0.15, 0.37], [0.15, 0.63], [0.18, 0.86],
    [0.30, 0.38], [0.30, 0.62], [0.44, 0.50],
    [0.52, 0.15], [0.58, 0.50], [0.52, 0.85]
  ]
};

window.overallRating = function (t) {
  const r = t.ratings;
  return Math.round((r.atk + r.def + r.pas + r.pace + r.team + r.exp) / 6);
};
