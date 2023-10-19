function scientific(n) {
    let num = Math.round(n);
    let exp = num.toString().length - 3;
    num /= 10**exp;
    num = Math.round(num)/100;
    return `${num}×10^${exp+2}`;
};

function spesificHeat(Q, m, c, T) {
    console.log(`Q=mc∆T`);
    if (Q == undefined) {
        console.log(`Q=${m}×${c}×${T}`);
        console.log(`Q=${m*c*T}J`);
        if (m*c*T > 1000) {
            console.log(`Q=${scientific(m*c*T)}J`);
        }
    } else if (m == undefined) {
        console.log(`${Q}=m×${c}×${T}`);
        console.log(`m=${Q/(c*T)}kg`);
        if (Q/(c*T) > 1000) {
            console.log(`Q=${scientific(Q/(c*T))}kg`);
        }
    } else if (c == undefined) {
        console.log(`${Q}=${m}×c×${T})`);
        console.log(`c=${Q/(m*T)}kJ kg^-1 K^-1`);
        if (Q/(m*T) > 1000) {
            console.log(`T=${scientific(Q/(m*T))}kJ kg^-1 K^-1`);
        }
    } else if (T) {
        console.log(`${Q}=${m}×${c}×∆T)`);
        console.log(`∆T=${Q/(m*c)}K`);
        if (Q/(m*c) > 1000) {
            console.log(`∆T=${scientific(Q/(m*c))}K`);
        }
    }
};

function latentHeat(Q, m, L) {
    console.log(`Q=mL`);
    if (Q == undefined) {
        console.log(`Q=${m}×${L}`);
        console.log(`Q=${m*L}J`);
        if (m*L > 1000) {
            console.log(`Q=${scientific(m*L)}J`);
        }
    } else if (m == undefined) {
        console.log(`${Q}=m×${L}`);
        console.log(`m=${Q/L}kg`);
        if (Q/L > 1000) {
            console.log(`Q=${scientific(Q/L)}kg`);
        }
    } else if (L == undefined) {
        console.log(`${Q}=${m}×L)`);
        console.log(`L=${Q/m}kJ kg^-1 K^-1`);
        if (Q/m > 1000) {
            console.log(`L=${scientific(Q/m)}kJ kg^-1 K^-1`);
        }
    }
};

function temperature(dT, Ti, Tf, unit='℃') {
    console.log(`∆T=T_f-T_i`);
    if (dT == undefined) {
        console.log(`∆T=${Tf}-${Ti}`);
        console.log(`∆T=${Tf-Ti}${unit}`);
    } else if (Ti == undefined) {
        console.log(`${dT}=${Tf}-T_i`);
        console.log(`T_i=${dT-Tf}${unit}`);
    } else if (Tf == undefined) {
        console.log(`${dT}=T_f-${Ti}`);
        console.log(`T_f=${dT-Ti}${unit}`);
    }
}

spesificHeat(undefined, 0.25, 4100, '∆T');