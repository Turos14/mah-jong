// --- CATALOGUE DES COMBINAISONS (Mah-jong chinois officiel, 81 combinaisons) ---
// Valeurs vérifiées : paliers 1, 2, 4, 6, 8, 12, 16, 24, 32, 48, 64, 88 (il n'y a pas de palier à 5).
// Vocabulaire : suite = chow, brelan = pung, carré = kong.
// Note : dans le livret papier, "Knitted Straight" et "Lesser Honors" sont inversés, et
// "7 Shifted Pairs" est légendé sur l'image des Neuf portes ; on suit ici les noms officiels.
//
// fan : valeur ; fr/zh : noms ; desc : règle résumée ; excl : combinaisons non cumulables (déjà incluses).
// ex  : exemple de main (voir handFromSpec) ; absent pour les combinaisons liées à la façon de gagner.

const FANS = {
    // ---- 88 ----
    bigFourWinds: { fan: 88, fr: 'Grands quatre vents', zh: '大四喜', desc: 'Quatre brelans ou carrés de vents (Est, Sud, Ouest, Nord) et une paire quelconque.', excl: ['prevalentWind', 'seatWind', 'bigThreeWinds', 'littleFourWinds', 'allPungs', 'pungTerminalsOrHonors'], ex: { g: ['p:we we we', 'p:ws ws ws', 'p:ww ww ww', 'p:wn wn wn'], pr: 'm5 m5' } },
    bigThreeDragons: { fan: 88, fr: 'Grands trois dragons', zh: '大三元', desc: 'Trois brelans ou carrés de dragons (rouge, vert, blanc).', excl: ['dragonPung', 'twoDragonPungs'], ex: { g: ['p:dr dr dr', 'p:dg dg dg', 'p:dw dw dw', 'c:m1 m2 m3'], pr: 'p9 p9' } },
    allGreen: { fan: 88, fr: 'Tout vert', zh: '绿一色', desc: 'Main composée uniquement de tuiles vertes : bambous 2, 3, 4, 6, 8 et dragon vert.', excl: ['halfFlush'], ex: { g: ['c:s2 s3 s4', 'c:s2 s3 s4', 'p:s6 s6 s6', 'p:dg dg dg'], pr: 's8 s8' } },
    nineGates: { fan: 88, fr: 'Neuf portes', zh: '九莲宝灯', desc: 'Main cachée d\'une seule famille : 1112345678999 + une tuile quelconque de la même famille.', excl: ['fullFlush', 'concealedHand', 'pungTerminalsOrHonors', 'noHonors', 'oneVoidedSuit'], ex: { g: ['p:p1 p1 p1', 'c:p2 p3 p4', 'c:p6 p7 p8', 'p:p9 p9 p9'], pr: 'p5 p5' } },
    fourKongs: { fan: 88, fr: 'Quatre carrés', zh: '四杠', desc: 'Quatre carrés (cachés ou exposés) et une paire.', excl: ['threeKongs', 'twoMeldedKongs', 'twoConcealedKongs', 'concealedKong', 'meldedKong', 'allPungs', 'singleWait'], ex: { g: ['k:we we we we', 'k:p5 p5 p5 p5', 'k:s7 s7 s7 s7', 'k:m3 m3 m3 m3'], pr: 'dr dr' } },
    sevenShiftedPairs: { fan: 88, fr: 'Sept paires consécutives', zh: '连七对', desc: 'Sept paires d\'une même famille, de valeurs qui se suivent (ex. 11 22 33 44 55 66 77).', excl: ['fullFlush', 'sevenPairs', 'concealedHand', 'noHonors', 'oneVoidedSuit'], ex: { t: 'sevenPairs', g: ['x:m1 m1', 'x:m2 m2', 'x:m3 m3', 'x:m4 m4', 'x:m5 m5', 'x:m6 m6', 'x:m7 m7'] } },
    thirteenOrphans: { fan: 88, fr: 'Treize orphelins', zh: '十三幺', desc: 'Les 13 tuiles « orphelines » (1 et 9 des trois familles, quatre vents, trois dragons) + une tuile de plus qui forme une paire.', excl: ['allTypes', 'concealedHand', 'singleWait'], ex: { t: 'orphans', g: ['f:p1 p9 s1 s9 m1 m9 we ws ww wn dr dg dw p1'] } },
    // ---- 64 ----
    allTerminals: { fan: 64, fr: 'Tout en bouts', zh: '清幺九', desc: 'Main composée uniquement de 1 et de 9 (brelans/carrés et paire, aucun honneur).', excl: ['allTerminalsAndHonors', 'allPungs', 'pungTerminalsOrHonors', 'noHonors', 'outsideHand', 'doublePung'], ex: { g: ['p:p1 p1 p1', 'p:s1 s1 s1', 'p:m9 m9 m9', 'p:p9 p9 p9'], pr: 's9 s9' } },
    littleFourWinds: { fan: 64, fr: 'Petits quatre vents', zh: '小四喜', desc: 'Trois brelans ou carrés de vents et une paire du quatrième vent.', excl: ['bigThreeWinds'], ex: { g: ['p:we we we', 'p:ws ws ws', 'p:ww ww ww', 'c:m1 m2 m3'], pr: 'wn wn' } },
    littleThreeDragons: { fan: 64, fr: 'Petits trois dragons', zh: '小三元', desc: 'Deux brelans ou carrés de dragons et une paire du troisième dragon.', excl: ['twoDragonPungs', 'dragonPung'], ex: { g: ['p:dr dr dr', 'p:dg dg dg', 'c:m1 m2 m3', 'c:p4 p5 p6'], pr: 'dw dw' } },
    allHonors: { fan: 64, fr: 'Tout en honneurs', zh: '字一色', desc: 'Main composée uniquement de vents et de dragons.', excl: ['allTerminalsAndHonors', 'allPungs', 'pungTerminalsOrHonors', 'outsideHand'], ex: { g: ['p:we we we', 'p:ws ws ws', 'p:dr dr dr', 'p:dg dg dg'], pr: 'dw dw' } },
    fourConcealedPungs: { fan: 64, fr: 'Quatre brelans cachés', zh: '四暗刻', desc: 'Quatre brelans ou carrés cachés (non pris sur une défausse) et une paire.', excl: ['allPungs', 'concealedHand', 'fullyConcealedHand', 'twoConcealedPungs', 'threeConcealedPungs'], ex: { g: ['p:m2 m2 m2', 'p:p4 p4 p4', 'p:s6 s6 s6', 'p:m8 m8 m8'], pr: 'p5 p5' } },
    pureTerminalChows: { fan: 64, fr: 'Double dragon pur', zh: '一色双龙会', desc: 'Dans une seule famille : suites 123 ×2 et 789 ×2, et une paire de 5.', excl: ['fullFlush', 'allChows', 'pureDoubleChow', 'twoTerminalChows', 'noHonors', 'oneVoidedSuit'], ex: { g: ['c:m1 m2 m3', 'c:m1 m2 m3', 'c:m7 m8 m9', 'c:m7 m8 m9'], pr: 'm5 m5' } },
    // ---- 48 ----
    quadrupleChow: { fan: 48, fr: 'Quatre suites identiques', zh: '一色四同顺', desc: 'Quatre suites identiques dans la même famille.', excl: ['pureTripleChow', 'pureDoubleChow', 'tileHog'], ex: { g: ['c:p2 p3 p4', 'c:p2 p3 p4', 'c:p2 p3 p4', 'c:p2 p3 p4'], pr: 'we we' } },
    fourPureShiftedPungs: { fan: 48, fr: 'Quatre brelans consécutifs', zh: '一色四节高', desc: 'Quatre brelans ou carrés de valeurs consécutives dans la même famille.', excl: ['pureShiftedPungs', 'allPungs'], ex: { g: ['p:s2 s2 s2', 'p:s3 s3 s3', 'p:s4 s4 s4', 'p:s5 s5 s5'], pr: 'm9 m9' } },
    // ---- 32 ----
    fourPureShiftedChows: { fan: 32, fr: 'Quatre suites décalées', zh: '一色四步高', desc: 'Quatre suites de la même famille qui montent de 1 (ou de 2) à chaque fois.', excl: ['pureShiftedChows'], ex: { g: ['c:m2 m3 m4', 'c:m3 m4 m5', 'c:m4 m5 m6', 'c:m5 m6 m7'], pr: 'wn wn' } },
    threeKongs: { fan: 32, fr: 'Trois carrés', zh: '三杠', desc: 'Trois carrés (cachés ou exposés).', excl: ['twoMeldedKongs', 'twoConcealedKongs'], ex: { g: ['k:s1 s1 s1 s1', 'k:p5 p5 p5 p5', 'k:m4 m4 m4 m4', 'c:m1 m2 m3'], pr: 'p8 p8' } },
    allTerminalsAndHonors: { fan: 32, fr: 'Bouts et honneurs', zh: '混幺九', desc: 'Main composée uniquement de 1, de 9 et d\'honneurs.', excl: ['allPungs', 'pungTerminalsOrHonors', 'outsideHand'], ex: { g: ['p:m1 m1 m1', 'p:p9 p9 p9', 'p:ws ws ws', 'p:dr dr dr'], pr: 'we we' } },
    // ---- 24 ----
    sevenPairs: { fan: 24, fr: 'Sept paires', zh: '七对', desc: 'Sept paires (main cachée sans brelan ni suite).', excl: ['concealedHand', 'singleWait'], ex: { t: 'sevenPairs', g: ['x:m1 m1', 'x:m6 m6', 'x:m7 m7', 'x:p8 p8', 'x:s9 s9', 'x:we we', 'x:dg dg'] } },
    greaterHonorsKnitted: { fan: 24, fr: 'Grande combinaison irrégulière', zh: '七星不靠', desc: 'Les 7 honneurs + 7 tuiles « tressées » (147 / 258 / 369 réparties dans les trois familles).', excl: ['allTypes', 'concealedHand', 'fullyConcealedHand', 'singleWait'], ex: { t: 'knittedHonors', g: ['f:we ws ww wn dr dg dw m1 m4 m7 p2 p5 s3 s6'] } },
    allEvenPungs: { fan: 24, fr: 'Brelans pairs', zh: '全双刻', desc: 'Quatre brelans/carrés et une paire, tous de valeurs paires (2, 4, 6, 8).', excl: ['allPungs', 'allSimples', 'noHonors'], ex: { g: ['p:p2 p2 p2', 'p:p4 p4 p4', 'p:s6 s6 s6', 'p:m8 m8 m8'], pr: 'p6 p6' } },
    fullFlush: { fan: 24, fr: 'Couleur pure', zh: '清一色', desc: 'Main composée d\'une seule famille, sans aucun honneur.', excl: ['noHonors', 'oneVoidedSuit'], ex: { g: ['c:m1 m2 m3', 'c:m4 m5 m6', 'c:m7 m8 m9', 'p:m2 m2 m2'], pr: 'm5 m5' } },
    pureTripleChow: { fan: 24, fr: 'Trois suites identiques', zh: '一色三同顺', desc: 'Trois suites identiques dans la même famille.', excl: ['pureDoubleChow'], ex: { g: ['c:m2 m3 m4', 'c:m2 m3 m4', 'c:m2 m3 m4', 'p:p5 p5 p5'], pr: 's3 s3' } },
    pureShiftedPungs: { fan: 24, fr: 'Trois brelans consécutifs', zh: '一色三节高', desc: 'Trois brelans ou carrés de valeurs consécutives dans la même famille.', excl: [], ex: { g: ['p:s3 s3 s3', 'p:s4 s4 s4', 'p:s5 s5 s5', 'c:m1 m2 m3'], pr: 'we we' } },
    upperTiles: { fan: 24, fr: 'Tout en grandes', zh: '全大', desc: 'Main composée uniquement de tuiles 7, 8 et 9.', excl: ['upperFour', 'noHonors'], ex: { g: ['c:m7 m8 m9', 'p:p7 p7 p7', 'c:s7 s8 s9', 'p:p9 p9 p9'], pr: 'm8 m8' } },
    middleTiles: { fan: 24, fr: 'Tout en moyennes', zh: '全中', desc: 'Main composée uniquement de tuiles 4, 5 et 6.', excl: ['allSimples', 'noHonors'], ex: { g: ['c:m4 m5 m6', 'c:p4 p5 p6', 'c:s4 s5 s6', 'p:p5 p5 p5'], pr: 'p6 p6' } },
    lowerTiles: { fan: 24, fr: 'Tout en petites', zh: '全小', desc: 'Main composée uniquement de tuiles 1, 2 et 3.', excl: ['lowerFour', 'noHonors'], ex: { g: ['c:m1 m2 m3', 'c:p1 p2 p3', 'p:s2 s2 s2', 'p:m3 m3 m3'], pr: 's1 s1' } },
    // ---- 16 ----
    pureStraight: { fan: 16, fr: 'Grand dragon pur', zh: '清龙', desc: 'Trois suites 123, 456 et 789 dans la même famille.', excl: ['shortStraight', 'twoTerminalChows'], ex: { g: ['c:m1 m2 m3', 'c:m4 m5 m6', 'c:m7 m8 m9', 'p:p5 p5 p5'], pr: 's2 s2' } },
    threeSuitedTerminalChows: { fan: 16, fr: 'Double dragon trois couleurs', zh: '三色双龙会', desc: 'Suites 123 et 789 dans deux familles, et une paire de 5 dans la troisième.', excl: ['allChows', 'noHonors', 'mixedDoubleChow', 'twoTerminalChows'], ex: { g: ['c:m1 m2 m3', 'c:m7 m8 m9', 'c:p1 p2 p3', 'c:p7 p8 p9'], pr: 's5 s5' } },
    pureShiftedChows: { fan: 16, fr: 'Trois suites décalées', zh: '一色三步高', desc: 'Trois suites de la même famille qui montent de 1 (ou de 2) à chaque fois.', excl: [], ex: { g: ['c:p2 p3 p4', 'c:p3 p4 p5', 'c:p4 p5 p6', 'p:m9 m9 m9'], pr: 'dw dw' } },
    allFives: { fan: 16, fr: 'Tout avec des cinq', zh: '全带五', desc: 'Chaque suite, brelan et la paire contient un 5.', excl: ['allSimples', 'noHonors'], ex: { g: ['c:m3 m4 m5', 'p:p5 p5 p5', 'c:s4 s5 s6', 'c:m5 m6 m7'], pr: 's5 s5' } },
    triplePung: { fan: 16, fr: 'Triple brelan', zh: '三同刻', desc: 'Trois brelans ou carrés de même valeur dans les trois familles.', excl: ['doublePung'], ex: { g: ['p:m4 m4 m4', 'p:p4 p4 p4', 'p:s4 s4 s4', 'c:m1 m2 m3'], pr: 'dw dw' } },
    threeConcealedPungs: { fan: 16, fr: 'Trois brelans cachés', zh: '三暗刻', desc: 'Trois brelans ou carrés cachés.', excl: ['twoConcealedPungs'], ex: { g: ['p:m2 m2 m2', 'p:p6 p6 p6', 'p:s9 s9 s9', 'co:m4 m5 m6'], pr: 'we we' } },
    // ---- 12 ----
    lesserHonorsKnitted: { fan: 12, fr: 'Petite combinaison irrégulière', zh: '全不靠', desc: '14 tuiles toutes différentes : tuiles « tressées » (147 / 258 / 369 réparties dans les trois familles) et honneurs, sans former les 7 honneurs.', excl: ['allTypes', 'concealedHand'], ex: { t: 'knittedHonors', g: ['f:we ws ww wn dr dg m1 m4 m7 p2 p5 p8 s3 s6'] } },
    knittedStraight: { fan: 12, fr: 'Dragon tressé', zh: '组合龙', desc: 'Les 9 tuiles 147, 258 et 369 réparties dans les trois familles, plus une suite/brelan et une paire.', excl: [], ex: { t: 'knittedStraight', g: ['n:m1 m4 m7', 'n:p2 p5 p8', 'n:s3 s6 s9', 'c:m2 m3 m4'], pr: 'dr dr' } },
    upperFour: { fan: 12, fr: 'Grandes (plus de 5)', zh: '大于5', desc: 'Main composée uniquement de tuiles 6, 7, 8 et 9.', excl: ['noHonors'], ex: { g: ['c:m6 m7 m8', 'c:p7 p8 p9', 'p:s9 s9 s9', 'c:s6 s7 s8'], pr: 'm6 m6' } },
    lowerFour: { fan: 12, fr: 'Petites (moins de 5)', zh: '小于5', desc: 'Main composée uniquement de tuiles 1, 2, 3 et 4.', excl: ['noHonors'], ex: { g: ['c:m1 m2 m3', 'c:p2 p3 p4', 'p:s1 s1 s1', 'c:s2 s3 s4'], pr: 'm4 m4' } },
    bigThreeWinds: { fan: 12, fr: 'Trois grands vents', zh: '三风刻', desc: 'Trois brelans ou carrés de vents.', excl: [], ex: { g: ['p:we we we', 'p:ws ws ws', 'p:ww ww ww', 'c:m1 m2 m3'], pr: 'p5 p5' } },
    // ---- 8 ----
    mixedStraight: { fan: 8, fr: 'Dragon mixte', zh: '花龙', desc: 'Suites 123, 456 et 789 dans trois familles différentes.', excl: [], ex: { g: ['c:m1 m2 m3', 'c:p4 p5 p6', 'c:s7 s8 s9', 'p:dr dr dr'], pr: 'we we' } },
    reversibleTiles: { fan: 8, fr: 'Tuiles réversibles', zh: '推不倒', desc: 'Main composée uniquement de tuiles symétriques : cercles 1-2-3-4-5-8-9, bambous 2-4-5-6-8-9 et dragon blanc.', excl: ['oneVoidedSuit'], ex: { g: ['c:p2 p3 p4', 'c:s4 s5 s6', 'p:p8 p8 p8', 'p:dw dw dw'], pr: 's9 s9' } },
    mixedTripleChow: { fan: 8, fr: 'Trois suites identiques de trois couleurs', zh: '三色三同顺', desc: 'La même suite dans les trois familles.', excl: [], ex: { g: ['c:m2 m3 m4', 'c:p2 p3 p4', 'c:s2 s3 s4', 'p:dr dr dr'], pr: 'we we' } },
    mixedShiftedPungs: { fan: 8, fr: 'Trois brelans décalés trois couleurs', zh: '三色三节高', desc: 'Trois brelans ou carrés de valeurs consécutives dans les trois familles.', excl: [], ex: { g: ['p:m3 m3 m3', 'p:p4 p4 p4', 'p:s5 s5 s5', 'c:m7 m8 m9'], pr: 'we we' } },
    chickenHand: { fan: 8, fr: 'Main poule', zh: '无番和', desc: 'Main qui ne rapporte aucune autre combinaison (les fleurs ne comptent pas).', excl: [], ex: { g: ['co:m1 m2 m3', 'co:p5 p6 p7', 'c:s2 s3 s4', 'po:m6 m6 m6'], pr: 'ws ws' } },
    lastTileDraw: { fan: 8, fr: 'Dernière tuile du mur', zh: '妙手回春', desc: 'Gagner en piochant la toute dernière tuile du mur.', excl: ['selfDrawn'] },
    lastTileClaim: { fan: 8, fr: 'Dernière défausse', zh: '海底捞月', desc: 'Gagner sur la toute dernière tuile défaussée de la partie.', excl: [] },
    outWithReplacement: { fan: 8, fr: 'Tuile de remplacement', zh: '杠上开花', desc: 'Gagner avec la tuile de remplacement piochée après avoir annoncé un carré.', excl: ['selfDrawn'] },
    robbingTheKong: { fan: 8, fr: 'Vol de carré', zh: '抢杠和', desc: 'Gagner en prenant la tuile qu\'un adversaire ajoute à un brelan exposé pour faire un carré.', excl: ['lastTile'] },
    // ---- 6 ----
    allPungs: { fan: 6, fr: 'Tout en brelans', zh: '碰碰和', desc: 'Quatre brelans ou carrés et une paire.', excl: [], ex: { g: ['po:m3 m3 m3', 'po:p5 p5 p5', 'p:s7 s7 s7', 'po:dr dr dr'], pr: 'm8 m8' } },
    halfFlush: { fan: 6, fr: 'Couleur mixte', zh: '混一色', desc: 'Une seule famille et des honneurs (au moins un).', excl: [], ex: { g: ['c:m1 m2 m3', 'c:m4 m5 m6', 'p:m9 m9 m9', 'p:dr dr dr'], pr: 'we we' } },
    mixedShiftedChows: { fan: 6, fr: 'Trois suites décalées trois couleurs', zh: '三色三步高', desc: 'Trois suites qui montent de 1 à chaque fois, dans trois familles différentes.', excl: [], ex: { g: ['c:m1 m2 m3', 'c:p2 p3 p4', 'c:s3 s4 s5', 'p:dw dw dw'], pr: 'we we' } },
    allTypes: { fan: 6, fr: 'Cinq familles', zh: '五门齐', desc: 'Les trois familles, un vent et un dragon sont tous présents.', excl: [], ex: { g: ['c:m2 m3 m4', 'c:p5 p6 p7', 'p:s9 s9 s9', 'p:dr dr dr'], pr: 'we we' } },
    meldedHand: { fan: 6, fr: 'Main exposée', zh: '全求人', desc: 'Les quatre groupes sont exposés et la main est gagnée sur une défausse (en attendant la paire).', excl: ['singleWait'], ex: { g: ['co:m1 m2 m3', 'po:p5 p5 p5', 'co:s2 s3 s4', 'po:m6 m6 m6'], pr: 'ws ws' } },
    twoConcealedKongs: { fan: 6, fr: 'Deux carrés cachés', zh: '双暗杠', desc: 'Deux carrés cachés.', excl: ['concealedKong'], ex: { g: ['k:m5 m5 m5 m5', 'k:p6 p6 p6 p6', 'c:s2 s3 s4', 'c:m1 m2 m3'], pr: 'ws ws' } },
    twoDragonPungs: { fan: 6, fr: 'Deux brelans de dragons', zh: '双箭刻', desc: 'Deux brelans ou carrés de dragons.', excl: ['dragonPung'], ex: { g: ['p:dr dr dr', 'p:dg dg dg', 'c:m1 m2 m3', 'c:p4 p5 p6'], pr: 'm4 m4' } },
    // ---- 4 ----
    outsideHand: { fan: 4, fr: 'Main extérieure', zh: '全带幺', desc: 'Chaque suite, brelan et la paire contient un 1, un 9 ou un honneur.', excl: [], ex: { g: ['c:m1 m2 m3', 'c:p7 p8 p9', 'p:s9 s9 s9', 'p:dr dr dr'], pr: 'we we' } },
    fullyConcealedHand: { fan: 4, fr: 'Main entièrement cachée', zh: '不求人', desc: 'Aucun groupe exposé et victoire en piochant soi-même la tuile.', excl: ['concealedHand', 'selfDrawn'] },
    twoMeldedKongs: { fan: 4, fr: 'Deux carrés exposés', zh: '双明杠', desc: 'Deux carrés exposés.', excl: ['meldedKong'] },
    lastTile: { fan: 4, fr: 'Dernière tuile', zh: '和绝张', desc: 'Gagner avec la dernière tuile restante de sa sorte (les trois autres sont déjà visibles).', excl: [] },
    // ---- 2 ----
    dragonPung: { fan: 2, fr: 'Brelan de dragons', zh: '箭刻', desc: 'Brelan ou carré de dragons (2 par brelan).', excl: [] },
    prevalentWind: { fan: 2, fr: 'Vent dominant', zh: '圈风刻', desc: 'Brelan ou carré du vent dominant de la partie.', excl: [] },
    seatWind: { fan: 2, fr: 'Vent du joueur', zh: '门风刻', desc: 'Brelan ou carré du vent de sa place.', excl: [] },
    concealedHand: { fan: 2, fr: 'Main cachée', zh: '门前清', desc: 'Aucun groupe exposé, mais victoire sur une défausse.', excl: [] },
    allChows: { fan: 2, fr: 'Tout en suites', zh: '平和', desc: 'Quatre suites et une paire non honneur.', excl: ['noHonors'] },
    tileHog: { fan: 2, fr: 'Quatre en un', zh: '四归一', desc: 'Les quatre exemplaires d\'une tuile dans la main sans en faire un carré (2 par tuile).', excl: [] },
    doublePung: { fan: 2, fr: 'Double brelan', zh: '双同刻', desc: 'Deux brelans de même valeur dans deux familles différentes.', excl: [] },
    twoConcealedPungs: { fan: 2, fr: 'Deux brelans cachés', zh: '双暗刻', desc: 'Deux brelans ou carrés cachés.', excl: [] },
    concealedKong: { fan: 2, fr: 'Carré caché', zh: '暗杠', desc: 'Un carré caché (2 par carré).', excl: [] },
    allSimples: { fan: 2, fr: 'Tout en simples', zh: '断幺', desc: 'Aucun 1, aucun 9 et aucun honneur.', excl: ['noHonors'] },
    // ---- 1 ----
    pureDoubleChow: { fan: 1, fr: 'Suites jumelles', zh: '一般高', desc: 'Deux suites identiques dans la même famille.', excl: [] },
    mixedDoubleChow: { fan: 1, fr: 'Suites jumelles de deux couleurs', zh: '喜相逢', desc: 'Deux suites identiques dans deux familles différentes.', excl: [] },
    shortStraight: { fan: 1, fr: 'Petit dragon', zh: '连六', desc: 'Deux suites qui se suivent dans la même famille (ex. 123 et 456).', excl: [] },
    twoTerminalChows: { fan: 1, fr: 'Suites extrêmes', zh: '老少副', desc: 'Suites 123 et 789 dans la même famille.', excl: [] },
    pungTerminalsOrHonors: { fan: 1, fr: 'Brelan de bouts ou d\'honneurs', zh: '幺九刻', desc: 'Brelan ou carré de 1, de 9 ou de vent (hors vent du joueur / dominant et dragons), 1 par brelan.', excl: [] },
    meldedKong: { fan: 1, fr: 'Carré exposé', zh: '明杠', desc: 'Un carré exposé (1 par carré).', excl: [] },
    oneVoidedSuit: { fan: 1, fr: 'Une famille manquante', zh: '缺一门', desc: 'Une seule des trois familles est absente de la main.', excl: [] },
    noHonors: { fan: 1, fr: 'Sans honneurs', zh: '无字', desc: 'Aucun vent ni dragon dans la main.', excl: [] },
    edgeWait: { fan: 1, fr: 'Attente de bord', zh: '边张', desc: 'Gagner sur le 3 d\'une suite 123 ou le 7 d\'une suite 789.', excl: [] },
    closedWait: { fan: 1, fr: 'Attente au milieu', zh: '嵌张', desc: 'Gagner sur la tuile du milieu d\'une suite.', excl: [] },
    singleWait: { fan: 1, fr: 'Attente sur la paire', zh: '单钓将', desc: 'Gagner en complétant la paire (attente d\'une seule tuile).', excl: [] },
    selfDrawn: { fan: 1, fr: 'Pioche du mur', zh: '自摸', desc: 'Gagner en piochant soi-même la tuile gagnante.', excl: [] },
    flower: { fan: 1, fr: 'Fleur / saison', zh: '花牌', desc: 'Chaque fleur ou saison vaut 1 (ne compte pas dans le minimum de 8 des règles officielles).', excl: [] }
};

const FAN_TIERS = [88, 64, 48, 32, 24, 16, 12, 8, 6, 4, 2, 1];

// --- Types de mah-jong (façon de remplir la main) ---
const HAND_TYPES = {
    standard: { label: 'Mah-jong classique (4 groupes + paire)', hint: 'Quatre suites, brelans ou carrés, plus une paire.' },
    knittedStraight: { label: 'Dragon tressé (147 / 258 / 369 + 1 groupe + paire)', hint: 'Trois groupes « tressés » dans les trois familles, un groupe normal et une paire.' },
    sevenPairs: { label: 'Sept paires', hint: 'Sept paires (dont les sept paires consécutives).' },
    orphans: { label: 'Treize orphelins', hint: '13 tuiles orphelines + 1 tuile en double.' },
    knittedHonors: { label: 'Combinaison irrégulière (honneurs + tressées)', hint: '14 tuiles toutes différentes : honneurs et tuiles 147 / 258 / 369.' }
};
