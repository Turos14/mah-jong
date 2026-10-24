// --- PAGE RÈGLES & COMBINAISONS (générée depuis data/fans.js) ---

function exampleHandHtml(spec, tileClass = 'tile-sm') {
    const hand = handFromSpec(spec);
    const groups = hand.groups.map(g => {
        const tiles = g.tiles.filter(Boolean).map(t => `<div class="${tileClass}">${tileImg(t)}</div>`).join('');
        return `<div class="flex gap-0.5 ${g.open ? 'opacity-90 ring-1 ring-amber-500/30 rounded' : ''}">${tiles}</div>`;
    });
    return `<div class="flex flex-wrap gap-x-3 gap-y-1.5">${groups.join('')}</div>`;
}

function renderRules() {
    document.getElementById('rules-intro').innerHTML = `
        <p>Le comptage suit le <strong class="text-slate-200">Mah-jong chinois officiel</strong> : 81 combinaisons de 1 à 88 points. Vocabulaire : <em>chow</em> = 3 tuiles qui se suivent, <em>pong</em> = 3 tuiles identiques, <em>kong</em> = 4 tuiles identiques.</p>
        <p>Dans le calculateur, les groupes sont exposés par défaut (décochez « Exposé » pour un groupe caché). On choisit le Mah-jong réalisé, on remplit les trous avec les tuiles du bandeau, et l'application détecte les combinaisons. La valeur de la main est la somme des combinaisons (en retirant celles déjà incluses dans une plus haute) et des fleurs (1 point chacune).</p>
        <p>Paiement d'une manche : le gagnant encaisse la valeur de sa main auprès de chaque adversaire (Tsumo) ou du joueur qui a défaussé (Ron), doublée si l'Est est concerné. Les autres joueurs règlent entre eux la différence de leurs mains (pongs, kongs et fleurs), doublée si l'Est est concerné.</p>
        <p class="text-xs text-slate-500">Le minimum officiel pour gagner est de 8 points hors fleurs ; l'application prévient sans bloquer. Vérifiez toujours la combinaison détectée : en cas de doute sur une règle de la maison, c'est votre table qui décide.</p>`;

    const typeEx = {
        standard: FANS.pureStraight.ex,
        knittedStraight: FANS.knittedStraight.ex,
        sevenPairs: FANS.sevenPairs.ex,
        orphans: FANS.thirteenOrphans.ex,
        knittedHonors: FANS.greaterHonorsKnitted.ex
    };
    document.getElementById('rules-types').innerHTML = Object.entries(HAND_TYPES).map(([key, t]) => `
        <div class="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-2">
            <div class="text-sm font-semibold text-emerald-400">${t.label}</div>
            <p class="text-xs text-slate-400">${t.hint}</p>
            ${exampleHandHtml(typeEx[key], 'tile-xs')}
        </div>`).join('');

    document.getElementById('rules-fans').innerHTML = FAN_TIERS.map(tier => {
        const ids = Object.keys(FANS).filter(id => FANS[id].fan === tier);
        const cards = ids.map(id => {
            const f = FANS[id];
            return `
            <div class="bg-slate-800/30 border border-slate-800 rounded-xl p-4 space-y-2">
                <div class="flex justify-between items-baseline gap-3">
                    <div class="text-sm font-semibold text-slate-100">${f.fr} <span class="text-slate-500 font-normal">${f.zh}</span></div>
                    <div class="text-emerald-400 font-bold whitespace-nowrap">${f.fan} pt${f.fan > 1 ? 's' : ''}</div>
                </div>
                <p class="text-xs text-slate-400">${f.desc}</p>
                ${f.ex ? exampleHandHtml(f.ex) : ''}
            </div>`;
        }).join('');
        return `
        <section class="space-y-3">
            <h3 class="text-base font-semibold text-slate-200 border-b border-slate-800 pb-2">${tier} point${tier > 1 ? 's' : ''} <span class="text-slate-500 text-xs font-normal">· ${ids.length} combinaison(s)</span></h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">${cards}</div>
        </section>`;
    }).join('');
}
