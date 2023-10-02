/*
-----------------------------------------Changelog-----------------------------------------
27/08/2023
 • commenced work
- Tom Qiu

28/09/2023
 • Official start of project
 • Disabled collision detection
- Tom Qiu

2/10/2023
 • added tank and drone
 • reenabled collision detection
 • added 'blaster' created by Tiger
- Tom Qiu

-------------------------------------------------------------------------------------------
*/

// The support functions that might not be necessary
function isin(a, b) { // check is a in b
    for (var i = 0; i < b.length; i += 1) {
        if (a == b[i]) {
            return true;
        }
    }
    return false;
};

function randchoice(list, remove = false) { // chose 1 from a list and update list
    let length = list.length;
    let choice = randint(0, length-1);
    if (remove) {
        let chosen = list.splice(choice, 1);
        return [chosen, list];
    }
    return list[choice];
};

function randint(min, max, notequalto=false) { // Randint returns random interger between min and max (both included)
    if (max - min <= 1) {
        return min;
    }
    var gen = Math.floor(Math.random() * (max - min + 1)) + min;
    var i = 0; // 
    while (gen != min && gen != max && notequalto && i < 100) { // loop max 100 times
        gen = Math.floor(Math.random() * (max - min + 1)) + min;
        i += 1;
        console.log('calculating...');
    }
    if (i >= 100) {
        console.log('ERROR: could not generate suitable number');
    }
    return gen;
};

function replacehtml(text) {
    document.getElementById("game").innerHTML = text;
};

function addImage(img, x, y, cx, cy, scale, r, absolute, opacity=1) {
    var c = document.getElementById('main');
    var ctx = c.getContext("2d");
    ctx.globalAlpha = opacity;
    if (absolute) {
        ctx.setTransform(scale, 0, 0, scale, x, y); // sets scale and origin
        ctx.rotate(r);
        ctx.drawImage(img, -cx, -cy);
    } else {
        ctx.setTransform(scale, 0, 0, scale, x-player.x+display.x/2, y-player.y+display.y/2); // position relative to player
        ctx.rotate(r);
        ctx.drawImage(img, -cx, -cy);
    }
    ctx.globalAlpha = 1.0;
};

function clearCanvas(canvas) {
    var c = document.getElementById(canvas);
    var ctx = c.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, display.x, display.y);
    ctx.restore();
};

function drawLine(pos, r, length, style, absolute) {
    var c = document.getElementById("main");
    var ctx = c.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (style) {
        ctx.strokeStyle = style.colour;
        ctx.lineWidth = style.width;
        ctx.globalAlpha = style.opacity;
    }
    ctx.beginPath();
    if (absolute) {
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x + length * Math.cos(r), pos.y + length * Math.sin(r));
    } else {
        ctx.moveTo(pos.x-player.x+display.x/2, pos.y-player.y+display.y/2);
        ctx.lineTo(pos.x-player.x+display.x/2 + length * Math.cos(r), pos.y-player.y+display.y/2 + length * Math.sin(r));
    }
    ctx.stroke();
    ctx.restore();
};

function sufficient(ability, cargo) {
    var sufficient = true
    for (var i=0; i < Object.keys(ability.cost).length; i += 1) {
        if (cargo[Object.keys(ability.cost)[i]] < ability.cost[Object.keys(ability.cost)[i]]) {
            sufficient = false;
        }
    }
    if (sufficient) {
        if (ability.reload) {
            ability.reload = ability.reloadTime;
        }
        for (var i=0; i < Object.keys(ability.cost).length; i += 1) {
            cargo[Object.keys(ability.cost)[i]] -= ability.cost[Object.keys(ability.cost)[i]];
        }
    }
    return [sufficient, ability, cargo];
};

function getDist(sPos, tPos) { 
    // Mathematics METHods
    var dx = tPos.x - sPos.x;
    var dy = tPos.y - sPos.y;
    var dist = Math.sqrt(dx*dx+dy*dy);
    return dist;
};

function correctAngle(a) {
    a = a%(Math.PI*2);
    return a;
};

function adjustAngle(a) {
    if (a > Math.PI) {
        a -= 2*Math.PI;
    }
    return a;
};

function rotateAngle(r, rTarget, increment) {
    if (Math.abs(r) > Math.PI*4 || Math.abs(rTarget) > Math.PI*4) {
        throw "Error: You f*cked up the angle thing again...";
    }
    if (r == rTarget) {
        return correctAngle(r);
    }else if (rTarget - r <= Math.PI && rTarget - r > 0) {
        if (rTarget - r < increment) {
            r = rTarget;
        } else {
            r += increment;
        }
        return r;
    } else if (r - rTarget < Math.PI && r - rTarget > 0) {
        if (r - rTarget < increment) {
            r = rTarget;
        } else {
            r -= increment;
        }
        return correctAngle(r);
    } else {
        if (r < rTarget) {
            r += Math.PI*2;
        } else {
            rTarget += Math.PI*2;
        }
        return correctAngle(rotateAngle(r, rTarget, increment));
    }
};

function aim(initial, final) {
    if (initial == final) { 
        return 0;
    }
    let diff = {x: final.x - initial.x, y: initial.y - final.y};
    if (diff.x == 0) {
        if (diff.y > 0) {
            return 0;
        } else {
            return Math.PI;
        }
    } else if (diff.y == 0) {
        if (diff.x > 0) {
            return Math.PI/2;
        } else {
            return 3*Math.PI/2;
        }
    }
    let angle = Math.atan(Math.abs(diff.y / diff.x));
    if (diff.x > 0 && diff.y > 0) {
        return Math.PI/2 - angle;
    } else if (diff.x > 0 && diff.y < 0) {
        return Math.PI/2 + angle;
    } else if (diff.x < 0 && diff.y < 0) {
        return 3*Math.PI/2 - angle;
    } else {
        return 3*Math.PI/2 + angle;
    }
};

function toComponent(m, r) {
    return {x: m * Math.sin(r), y: -m * Math.cos(r)};
};

function offsetPoints(points, offset) {
    for (let i = 0; i < points.length; i++){
        points[i].x += offset.x;
        points[i].y += offset.y;
    }
    return points;
};

function roman(number) {
    if (number <= 0 || number >= 4000) {
        var symbols = ['0','1','2','3','4','5','6','7','8','9','¡','£','¢','∞','§','¶','œ','ß','∂','∫','∆','√','µ','†','¥','ø'];
        return `${randchoice(symbols)}${randchoice(symbols)}${randchoice(symbols)}`;
    }
    
    const romanNumerals = {
        M: 1000,
        CM: 900,
        D: 500,
        CD: 400,
        C: 100,
        XC: 90,
        L: 50,
        XL: 40,
        X: 10,
        IX: 9,
        V: 5,
        IV: 4,
        I: 1
    };
    
    let romanNumeral = '';
    
    for (let key in romanNumerals) {
        while (number >= romanNumerals[key]) {
            romanNumeral += key;
            number -= romanNumerals[key];
        }
    }
    return romanNumeral;
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

function toColour(colour) {
    return `rgba(${colour.r}, ${colour.g}, ${colour.b}, ${colour.a})`;
};

function drawCircle(x, y, radius, fill, stroke, strokeWidth, opacity=1) { // draw a circle
    var canvas = document.getElementById('main');
    var ctx = canvas.getContext("2d");
    ctx.resetTransform();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.lineWidth = strokeWidth;
        ctx.strokeStyle = stroke;
        ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
};

function displaytxt(txt, pos) {
    var canvas = document.getElementById("canvasOverlay");
    var ctx = canvas.getContext("2d");
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // Set the font and text color
    ctx.font = "20px Verdana";
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    // Display the points on the canvas
    ctx.fillText(txt, pos.x, pos.y);
    ctx.stroke();
    ctx.restore();
};

function rotatePolygon(point, r) {
    let points = JSON.parse(JSON.stringify(point));
    for (let i = 0; i < points.length; i++) {
        points[i].x = point[i].x * Math.cos(r) - point[i].y * Math.sin(r); 
        points[i].y = point[i].x * Math.sin(r) + point[i].y * Math.cos(r); 
    }
    return points
};

function drawPolygon(point, offset, r, fill, stroke, absolute, debug=false) {
    let points = JSON.parse(JSON.stringify(point));
    if (points.length < 3) {
        throw "Error: Your polygon needs to have at least 3 points dumbass";
    }
    points = rotatePolygon(points, r)
    var canvas = document.getElementById('main');
    var ctx = canvas.getContext("2d");
    ctx.resetTransform();
    ctx.beginPath();
    if (absolute) {
        ctx.moveTo(points[0].x + offset.x, points[0].y + offset.y);
        if (debug) {displaytxt(`(${Math.round(points[0].x + offset.x)}, ${Math.round(points[0].y + offset.y)})`, {x: points[0].x + offset.x, y: points[0].y + offset.y});}
    } else {
        ctx.moveTo(points[0].x-player.x+display.x/2 + offset.x, points[0].y-player.y+display.y/2 + offset.y);
        if (debug) {displaytxt(`(${Math.round(points[0].x + offset.x)}, ${Math.round(points[0].y + offset.y)})`, {x: points[0].x-player.x+display.x/2 + offset.x, y: points[0].y-player.y+display.y/2 + offset.y});}
        //if (debug) {displaytxt(`(${Math.round(points[0].x-player.x+display.x/2 + offset.x)}, ${Math.round(points[0].y-player.y+display.y/2 + offset.y)})`, {x: points[0].x-player.x+display.x/2 + offset.x, y: points[0].y-player.y+display.y/2 + offset.y});}
    }
    for (let i = 1; i < points.length; i++) {
        if (absolute) {
            ctx.lineTo(points[i].x + offset.x, points[i].y + offset.y);
            if (debug) {displaytxt(`(${Math.round(points[i].x + offset.x)}, ${Math.round(points[i].y + offset.y)})`, {x: points[i].x + offset.x, y: points[i].y + offset.y});}
        } else {
            ctx.lineTo(points[i].x-player.x+display.x/2 + offset.x, points[i].y-player.y+display.y/2 + offset.y);
            if (debug) {displaytxt(`(${Math.round(points[i].x + offset.x)}, ${Math.round(points[i].y + offset.y)})`, {x: points[i].x-player.x+display.x/2 + offset.x, y: points[i].y-player.y+display.y/2 + offset.y});}
            //if (debug) {displaytxt(`(${Math.round(points[i].x-player.x+display.x/2 + offset.x)}, ${Math.round(points[i].y-player.y+display.y/2 + offset.y)})`, {x: points[i].x-player.x+display.x/2 + offset.x, y: points[i].y-player.y+display.y/2 + offset.y});}
        }
    }
    ctx.closePath();
    if (fill) {
        ctx.fillStyle = fill;
        ctx.fill();
    }
    if (stroke) {
        ctx.lineWidth = stroke.width;
        ctx.strokeStyle = stroke.colour;
        ctx.stroke();
    }
};

function drawLight(x, y, radius) {
    var canvas = document.getElementById('main');
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;

    ctx.fill();
};

function calculateDamage(bullet, ship) { // TODO: Might need reworking
    if (bullet.dmg > 0 && bullet.team != ship.team) {
        if (bullet.dmg > ship.shield.shieldCap) {
            bullet.dmg -= ship.shield.shield*(ship.shield.shield/bullet.dmg);
            ship.shield.shield = 0;
            ship.shield.cooldown = 300;
        } else {
            if (bullet.dmg < ship.shield.shield*0.1) {
                ship.shield.shield -= bullet.dmg/2;
                bullet.dmg = 0;
            } else if (bullet.dmg < ship.shield.shield*0.75) {
                ship.shield.shield -= bullet.dmg;
                bullet.dmg = 0;
                ship.shield.cooldown += 5;
            } else {
                bullet.dmg -= ship.shield.shield*0.75;
                ship.shield.shield *= 0.25;
                ship.shield.cooldown += 15;
            }
        }
        if (ship.shield.cooldown > 300) {
            ship.shield.cooldown = 300;
        }
        if (ship.shield.shield < 0) {
            ship.shield.shield = 0;
        }
        if (bullet.dmg < 0) {
            bullet.dmg = 0;
        }
        if (ship.upgrades) {
            if (ship.upgrades[19]) {
                bullet.dmg *= (1-(ship.upgrades[19].level-1)*0.1);
            }
        }
        ship.hp -= bullet.dmg;
        if (0-ship.hp > bullet.dmg*0.5) {
            bullet.v *= (0-ship.hp)/bullet.dmg;
            bullet.dmg = 0-ship.hp;
        } else {
            bullet.dmg = 0;
        }
    }
    return [bullet, ship];
};

function bar(image, pos, size, step) {
    for (var i = 0; i < size; i += 1) {
        addImage('main', data.img[image], pos.x+i*step, pos.y, data.dim[image].x, data.dim[image].x, 1, 0)
    }
};

function healthBar(size, ship, step) {
    var length = size * step;
    var pos = {x: ship.x-length/2, y: ship.y + data.center[ship.type].y*1.5};
    var top = Math.round(ship.shield.shield / ship.shield.shieldCap * size);
    var bottom = Math.round(ship.hp / data.construction[ship.type].hp * size);
    bar('GREYCIRCLE', pos, size, step);
    bar('BLUECIRCLE', pos, top, step);
    bar('SILVERCIRCLE', pos, bottom, step);
};

function PlayerUiBar(level, max, pos, dim, fillColour, border) {
    var c = document.getElementById("main");
    var ctx = c.getContext("2d");

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (border != -1) {
        ctx.fillStyle = '#696969';
        ctx.fillRect(pos.x, pos.y, dim.x, dim.y);
    } else {
        border = 0;
    }
  
    const fillPercentage = level / max;
    ctx.fillStyle = fillColour;
    ctx.fillRect(pos.x+border, pos.y+border, fillPercentage * (dim.x-border*2), dim.y-border*2);

    ctx.restore();
};

function grid(spacing) { // TODO: update colours
    var start = (player.y - display.y / 2) < 0 ? Math.ceil((player.y - display.y / 2) / spacing) * spacing : Math.floor((player.y - display.y / 2) / spacing) * spacing - spacing * 2;
    var end = (player.y + display.y / 2) < 0 ? Math.ceil((player.y + display.y / 2) / spacing) * spacing : Math.floor((player.y + display.y / 2) / spacing) * spacing + spacing * 2;
    for (let i = start; i <= end; i += spacing) {
        drawLine({x:(player.x - display.x / 2) - spacing,y:i}, r=0, display.x+spacing*2, {colour:'#999999',width:5,opacity:0.5});
    }
    start = (player.x - display.x / 2) < 0 ? Math.ceil((player.x - display.x / 2) / spacing) * spacing : Math.floor((player.x - display.x / 2) / spacing) * spacing - spacing * 2;
    end = (player.x + display.x / 2) < 0 ? Math.ceil((player.x + display.x / 2) / spacing) * spacing : Math.floor((player.x + display.x / 2) / spacing) * spacing + spacing * 2;
    for (var i = start; i < end; i += spacing) {
        drawLine({x:i,y:(player.y - display.y / 2) -spacing}, r=Math.PI/2, display.y+spacing*2, {colour:'#999999',width:5,opacity:0.5});
    }
};

function drawExplosions(explosion) {
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, explosion.r, '#fccbb1', '#f7b28d', 0.1, 0.5*explosion.transparancy);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, explosion.r, false, '#f7b28d', 5, 0.5);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, Math.max(explosion.r-20, 0), false, '#fcd8d2', 20, 0.3*explosion.transparancy);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, Math.max(explosion.r-15, 0), false, '#fcd8d2', 15, 0.3*explosion.transparancy);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, Math.max(explosion.r-10, 0), false, '#fcd8d2', 10, 0.3*explosion.transparancy);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, Math.max(explosion.r-5, 0), false, '#fcd8d2', 5, 0.3*explosion.transparancy);
    drawLight(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, explosion.maxR+explosion.r/2);
    if (explosion.r >= explosion.maxR) {
        explosion.transparancy *=0.9;
        explosion.r*=1.1;
    }
    if (explosion.transparancy > 0.25) {
        handleMotion(explosion);
        explosion.r += 2;
        if (explosion.r > explosion.maxR) {
            explosion.r = explosion.maxR;
        }
        return explosion;
    }
    return false;
};

function normalDistribution(mean, sDiv) {
    let u = 0;
    let v = 0;
    while (u === 0) u = Math.random(); 
    while (v === 0) v = Math.random(); 
    let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return mean + z * sDiv;
};

function raySegmentIntersection(pointIn, segmentIn) {
    let point = vMath(pointIn, 1.1, 'multiply');
    let segment = {start: vMath(segmentIn.start, 1.1, 'multiply'), end: vMath(segmentIn.end, 1.1, 'multiply')};
    let A1 = adjustAngle(correctAngle(aim(point, segment.start)));
    let A2 = adjustAngle(correctAngle(aim(point, segment.end)));
    if ((A1 >= 0 && A2 <= 0 || A2 >= 0 && A1 <= 0) && Math.abs(A1) + Math.abs(A2) < Math.PI) {
        return true;
    }
    return false;
};

function pointInPolygon(point, polygon) {
    let inside = false;
    let cnt = 0;
    if (raySegmentIntersection(point, {start: polygon[0], end: polygon[polygon.length-1]})) {
        inside = !inside;
        cnt++;
    }
    for (let i = 0; i < polygon.length-1; i++) {
        if (raySegmentIntersection(point, {start: polygon[i], end: polygon[i+1]})) {
            inside = !inside;
            cnt++;
        }
    }
    return inside;
};

function vMath(v1, v2, mode) { // Does not have dot product lmao, doesn't even have projection
    switch (mode) {
        case 'addition':
        case 'add':
            return {x: v1.x+v2.x, y: v1.y+v2.y};
        case 'subtraction':
        case 'subtract':
            return {x: v1.x-v2.x, y: v1.y-v2.y};
        case 'scalar multiplication':
        case 'multiplication':
        case 'multiply': // v2 is now a scalar
            return {x: v1.x*v2, y: v1.y*v2};
        case 'division':
        case 'divide': // v2 is now a scalar
            return {x: v1.x/v2, y: v1.y/v2};
        default:
            throw 'are you f*cking retarded?';
    }
};

function circleToPolygon(pos, r, sides) {
    let step = Math.PI*2/sides;
    let polygon = [];
    for(let i = 0; i < sides; i++) {
        polygon.push(vMath(toComponent(r, step*i),pos,'add'));
    }
    return polygon;
};

// The return of the excessively overcomplicated data storage system
const data = {
    mech: {
        x: 0,
        y: 0,
        r: 0, // direction of motion
        vx: 0,
        vy: 0,
        mouseR: 0, // current Aim
        lastMoved: 69,
        v: 2, // normal walking speed
        vr: 180 / 60 / 180 * Math.PI, // rotation of tracks (feet)
        tr: 360 / 60 / 180 * Math.PI, // rotation of turret (main body)
        keyboard: [],
        aimPos: {x: 69, y: 69},
        collisionR: 150,
        directControl: false,
        type: 'mech',
        parts: [
            {
                id: 'LowerBodyContainer',
                facing: 'body',
                type: 'circle', 
                rOffset: 0,
                size: 35,
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(140, 140, 140, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                collision: true,
                hp: 500,
                isHit: 0,
                connected: [
                    {
                        id: 'foot1',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -10, y: 60},
                            {x: 10, y: 60},
                            {x: 15, y: 50},
                            {x: 15, y: -50},
                            {x: 10, y: -60},
                            {x: -10, y: -60},
                            {x: -15, y: -50},
                            {x: -15, y: 50},
                        ],
                        offset: {x: -30, y: -5},
                        style: {
                            fill: 'rgba(130, 130, 130, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'foot2',
                        facing: 'body',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -10, y: 60},
                            {x: 10, y: 60},
                            {x: 15, y: 50},
                            {x: 15, y: -50},
                            {x: 10, y: -60},
                            {x: -10, y: -60},
                            {x: -15, y: -50},
                            {x: -15, y: 50},
                        ],
                        offset: {x: 30, y: -5},
                        style: {
                            fill: 'rgba(130, 130, 130, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lowerBody',
                        facing: 'body',
                        type: 'circle', 
                        rOffset: 0,
                        size: 35,
                        offset: {x: 0, y: 0},
                        style: {
                            fill: 'rgba(140, 140, 140, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                ],
                groundCollision: true,
            },
            {
                id: 'mainBody',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -60, y: 40},
                    {x: 60, y: 40},
                    {x: 70, y: 30},
                    {x: 70, y: -30},
                    {x: 60, y: -40},
                    {x: -60, y: -40},
                    {x: -70, y: -30},
                    {x: -70, y: 30},
                ],
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(210, 210, 210, 1)',
                    stroke: {colour: '#696969', width: 10},
                },
                collision: true,
                hp: 5000,
                collideDmg: 500,
                isHit: 0,
                connected: [
                    {
                        id: 'armLeft',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -20, y: 50},
                            {x: 20, y: 50},
                            {x: 25, y: 40},
                            {x: 25, y: -60},
                            {x: 20, y: -70},
                            {x: -20, y: -70},
                            {x: -25, y: -60},
                            {x: -25, y: 40},
                        ],
                        offset: {x: -100, y: 0},
                        style: {
                            fill: 'rgba(200, 200, 200, 1)',
                            stroke: {colour: '#696969', width: 10},
                        },
                        collision: true,
                        hp: 3000,
                        collideDmg: 500,
                        isHit: 0,
                        connected: [
                            {
                                id: 'GattlingGunContainer',
                                facing: 'turret',
                                type: 'polygon', 
                                rOffset: 0,
                                size: [
                                    {x: -30, y: 0},
                                    {x: 30, y: 0},
                                    {x: 30, y: 20},
                                    {x: -30, y: 20},
                                ],
                                offset: {x: -100, y: -90},
                                style: {
                                    fill: 'rgba(150, 150, 150, 1)',
                                    stroke: {colour: '#696969', width: 5},
                                },
                                collision: false,
                                hp: Infinity,
                                isHit: 0,
                                connected: [
                                    {
                                        id: 'GattlingGunBarrel1',
                                        facing: 'turret',
                                        type: 'polygon', 
                                        rOffset: 0,
                                        size: [
                                            {x: -10, y: 0},
                                            {x: 10, y: 0},
                                            {x: 10, y: 100},
                                            {x: -10, y: 100},
                                        ],
                                        offset: {x: -85, y: -190},
                                        style: {
                                            fill: 'rgba(150, 150, 150, 1)',
                                            stroke: {colour: '#696969', width: 5},
                                        },
                                        collision: false,
                                        hp: Infinity,
                                        isHit: 0,
                                        connected: [],
                                    },
                                    {
                                        id: 'GattlingGunBarrel2',
                                        facing: 'turret',
                                        type: 'polygon', 
                                        rOffset: 0,
                                        size: [
                                            {x: -10, y: 0},
                                            {x: 10, y: 0},
                                            {x: 10, y: 100},
                                            {x: -10, y: 100},
                                        ],
                                        offset: {x: -115, y: -190},
                                        style: {
                                            fill: 'rgba(150, 150, 150, 1)',
                                            stroke: {colour: '#696969', width: 5},
                                        },
                                        collision: false,
                                        hp: Infinity,
                                        isHit: 0,
                                        connected: [],
                                    },
                                    {
                                        id: 'GattlingGunMainBarrel',
                                        facing: 'turret',
                                        type: 'polygon', 
                                        rOffset: 0,
                                        size: [
                                            {x: -10, y: 0},
                                            {x: 10, y: 0},
                                            {x: 10, y: 110},
                                            {x: -10, y: 110},
                                        ],
                                        offset: {x: -100, y: -200},
                                        style: {
                                            fill: 'rgba(150, 150, 150, 1)',
                                            stroke: {colour: '#696969', width: 5},
                                        },
                                        cannon: {
                                            keybind: 'click',
                                            x: 0,
                                            y: 0,
                                            reload: {c: 0, t: 1},
                                            spread: Math.PI/24,
                                            bullet: {
                                                type: 'circle', 
                                                cType: 'point', 
                                                size: 5,
                                                style: {
                                                    fill: {r: 100, g: 100, b: 100, a: 1},
                                                    stroke: {colour: {r: 69, g: 69, b: 69, a: 1}, width: 2},
                                                },
                                                decay: {
                                                    life: 100, 
                                                    fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                                    strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                                    size: 1
                                                },
                                                dmg: 20,
                                                v: 25,
                                                vDrag: 0.99,
                                                vr: 0,
                                                rDrag: 0,
                                                friendly: true,
                                            },
                                        },
                                        collision: false,
                                        hp: Infinity,
                                        isHit: 0,
                                        connected: [],
                                    },
                                    {
                                        id: 'GattlingGunPart',
                                        facing: 'turret',
                                        type: 'polygon', 
                                        rOffset: 0,
                                        size: [
                                            {x: -30, y: 0},
                                            {x: 30, y: 0},
                                            {x: 30, y: 10},
                                            {x: -30, y: 10},
                                        ],
                                        offset: {x: -100, y: -150},
                                        style: {
                                            fill: 'rgba(150, 150, 150, 1)',
                                            stroke: {colour: '#696969', width: 5},
                                        },
                                        collision: false,
                                        hp: Infinity,
                                        isHit: 0,
                                        connected: [],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        id: 'armRight',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -20, y: 50},
                            {x: 20, y: 50},
                            {x: 25, y: 40},
                            {x: 25, y: -60},
                            {x: 20, y: -70},
                            {x: -20, y: -70},
                            {x: -25, y: -60},
                            {x: -25, y: 40},
                        ],
                        offset: {x: 100, y: 0},
                        style: {
                            fill: 'rgba(200, 200, 200, 1)',
                            stroke: {colour: '#696969', width: 10},
                        },
                        collision: true,
                        hp: 3000,
                        collideDmg: 500,
                        isHit: 0,
                        connected: [
                            {
                                id: 'gunRight',
                                facing: 'turret',
                                type: 'polygon', 
                                rOffset: Math.PI,
                                size: [
                                    {x: -25, y: 25},
                                    {x: 25, y: 25},
                                    {x: 20, y: 0},
                                    {x: -20, y: 0},
                                ],
                                offset: {x: 100, y: -70},
                                style: {
                                    fill: 'rgba(150, 150, 150, 1)',
                                    stroke: {colour: '#696969', width: 5},
                                },
                                cannon: {
                                    keybind: 'click',
                                    x: 0,
                                    y: 25,
                                    reload: {c: 0, t: 0},
                                    spread: 0,
                                    bullet: {
                                        type: 'polygon', 
                                        size: [
                                            {x: -25, y: 0},
                                            {x: -15, y: 15},
                                            {x: -15, y: 30},
                                            {x: -20, y: 35},
                                            {x: -25, y: 200},
                                            {x: 0, y: 250},
                                            {x: 25, y: 200},
                                            {x: 20, y: 35},
                                            {x: 15, y: 30},
                                            {x: 15, y: 15},
                                            {x: 25, y: 0},
                                        ],
                                        style: {
                                            fill: {r: 50, g: 200, b: 255, a: 0.3},
                                            stroke: {colour: {r: 50, g: 200, b: 255, a: 0.3}, width: 5},
                                        },
                                        decay: {
                                            life: 5, 
                                            fillStyle: {r: 0, g: 0, b: 0, a: -0.05}, 
                                            strokeStyle: {r: 0, g: 0, b: 0, a: -0.05}, 
                                            size: 1
                                        },
                                        dmg: 1000,
                                        v: -1,
                                        vDrag: 1,
                                        vr: 0,
                                        rDrag: 1,
                                    },
                                },
                                collision: false,
                                hp: Infinity,
                                isHit: 0,
                                connected: [],
                            },
                        ],
                    },
                    {
                        id: 'head',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 25,
                        offset: {x: 0, y: 0},
                        style: {
                            fill: 'rgba(69, 69, 69, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                ],
            },
        ],
    },
    tank: {
        x: 0,
        y: 0,
        r: 0, // direction of motion
        vx: 0,
        vy: 0,
        mouseR: 0, // current Aim
        v: 2.5, // top speed
        vr: 45 / 60 / 180 * Math.PI, // rotation of tracks (feet)
        tr: 150 / 60 / 180 * Math.PI, // rotation of turret (main body)
        keyboard: [],
        aimPos: {x: 69, y: 69},
        collisionR: 140,
        reverse: false,
        directControl: false,
        type: 'tank',
        parts: [
            {
                id: 'mainBodyContainer',
                facing: 'body',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -90, y: -100},
                    {x: 90, y: -100},
                    {x: 90, y: 100},
                    {x: -90, y: 100},
                ],
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(210, 210, 210, 1)',
                    stroke: {colour: '#696969', width: 10},
                },
                collision: true,
                hp: 20000,
                isHit: 0,
                connected: [
                    {
                        id: 'tracks1',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -15, y: 130},
                            {x: 15, y: 130},
                            {x: 25, y: 120},
                            {x: 25, y: -120},
                            {x: 15, y: -130},
                            {x: -15, y: -130},
                            {x: -25, y: -120},
                            {x: -25, y: 120},
                        ],
                        offset: {x: -90, y: 0},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 10},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                        groundCollision: true,
                    },
                    {
                        id: 'tracks2',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -15, y: 130},
                            {x: 15, y: 130},
                            {x: 25, y: 120},
                            {x: 25, y: -120},
                            {x: 15, y: -130},
                            {x: -15, y: -130},
                            {x: -25, y: -120},
                            {x: -25, y: 120},
                        ],
                        offset: {x: 90, y: 0},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 10},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                        groundCollision: true,
                    },
                ],
            },
            {
                id: 'turretBody',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -50, y: 60},
                    {x: 50, y: 60},
                    {x: 50, y: -45},
                    {x: 25, y: -70},
                    {x: -25, y: -70},
                    {x: -50, y: -45},
                ],
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(210, 210, 210, 1)',
                    stroke: {colour: '#696969', width: 10},
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [
                    {
                        id: 'turretBarrel',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -12, y: 100},
                            {x: -12, y: 0},
                            {x: 12, y: 0},
                            {x: 12, y: 100},
                        ],
                        offset: {x: 0, y: -170},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 10},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'tankCannon',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -15, y: 30},
                            {x: -15, y: 0},
                            {x: 15, y: 0},
                            {x: 15, y: 30},
                        ],
                        offset: {x: 0, y: -200},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 10},
                        },
                        cannon: {
                            keybind: 'click',
                            x: 0,
                            y: 0,
                            reload: {c: 0, t: 90},
                            spread: Math.PI/96,
                            bullet: {
                                type: 'circle', 
                                cType: 'point', 
                                size: 12,
                                style: {
                                    fill: {r: 100, g: 100, b: 100, a: 1},
                                    stroke: {colour: {r: 69, g: 69, b: 69, a: 1}, width: 3},
                                },
                                decay: {
                                    life: 150, 
                                    fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    size: 1
                                },
                                dmg: 1000,
                                v: 30,
                                vDrag: 0.99,
                                vr: 0,
                                rDrag: 0,
                                friendly: true,
                            },
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                ],
            }
        ],
    },
    drone: {
        x: 0,
        y: 0,
        r: 0, // direction of motion
        vx: 0,
        vy: 0,
        mouseR: 0, // current Aim
        v: 15, // top speed
        tr: 360 / 60 / 180 * Math.PI, // rotation of turret (main body)
        keyboard: [],
        aimPos: {x: 69, y: 69},
        collisionR: 120,
        isMoving: false,
        directControl: false,
        type: 'drone',
        parts: [
            {
                id: 'mainBodyContainer',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -75, y: -75},
                    {x: 75, y: -75},
                    {x: 75, y: 75},
                    {x: -75, y: 75},
                ],
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(210, 210, 210, 1)',
                    stroke: {colour: '#696969', width: 10},
                },
                collision: true,
                hp: 1000,
                isHit: 0,
                connected: [
                    {
                        id: 'defaultSniper',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -10, y: 0},
                            {x: 10, y: 0},
                            {x: 10, y: 120},
                            {x: -10, y: 120},
                        ],
                        offset: {x: 0, y: -200},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        cannon: {
                            keybind: 'click',
                            x: 0,
                            y: 0,
                            reload: {c: 0, t: 30},
                            spread: Math.PI/480,
                            bullet: {
                                type: 'polygon', 
                                cType: 'point', 
                                size: [
                                    {x: -8, y: 5},
                                    {x: 0, y: -20},
                                    {x: 8, y: 5},
                                ],
                                style: {
                                    fill: {r: 255, g: 100, b: 100, a: 1},
                                    stroke: {colour: {r: 255, g: 69, b: 69, a: 1}, width: 3},
                                },
                                decay: {
                                    life: 180, 
                                    fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    size: 1
                                },
                                dmg: 750,
                                v: 60,
                                vDrag: 1,
                                vr: 0,
                                rDrag: 0,
                                friendly: true,
                            },
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                ],
            },
        ],
    },
    template: {
        physics: {
            x: 0,     // x coordinate
            y: 0,     // y coordinate
            vx: 0,    // x component of velocity
            vy: 0,    // y component of velocity
            ax: 0,    // x component of acceleration
            ay: 0,    // y component of acceleration
            r: 0,     // rotation
            vr: 0,    // angular velocity
            ar: 0,    // angular acceleration
            vDrag: 1, // drag (multiply by velocities to slow them down)
            rDrag: 1, // angular drag (multiply by velocities to slow them down)
            maxV: 25, // terminal velocity (25pixels/tick)
            maxRV: Math.PI/15, // terminal angular velocity (720˚/second)
        },
        particle: {
            type: 'circle', // circle or polygon
            size: 10, // radius if circle, array of points if polygon
            style: {
                fill: {r: 255, g: 255, b: 255, a: 1},
                stroke: {colour: {r: 255, g: 255, b: 255, a: 1}, width: 2},
            },
            decay: {
                life: Infinity, // how many ticks the particle persists for
                fillStyle: {r: 0, g: 0, b: 0, a: 0}, // add to fill style
                strokeStyle: {r: 0, g: 0, b: 0, a: 0}, // add to stroke style
                size: 1 // multiply size by this
            }
        },
        weapons: {
            debugWeapon: {
                id: 'debugWeapon',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -10, y: 0},
                    {x: 10, y: 0},
                    {x: 10, y: 30},
                    {x: -10, y: 30},
                ],
                offset: {x: 0, y: -100},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 0, t: 6},
                    spread: 0,
                    bullet: {
                        type: 'circle', 
                        cType: 'point', 
                        size: 8,
                        style: {
                            fill: {r: 100, g: 100, b: 100, a: 1},
                            stroke: {colour: {r: 69, g: 69, b: 69, a: 1}, width: 3},
                        },
                        decay: {
                            life: 999999999, 
                            fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            size: 1
                        },
                        dmg: 1,
                        v: 0,
                        vr: 0,
                        vDrag: 0.99,
                        rDrag: 0,
                        friendly: true,
                    },
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [],
            },
            GattlingGun: {
                id: 'GattlingGunContainer',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -30, y: 0},
                    {x: 30, y: 0},
                    {x: 30, y: 20},
                    {x: -30, y: 20},
                ],
                offset: {x: 0, y: -90},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [
                    {
                        id: 'GattlingGunBarrel1',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -10, y: 0},
                            {x: 10, y: 0},
                            {x: 10, y: 100},
                            {x: -10, y: 100},
                        ],
                        offset: {x: 15, y: -190},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'GattlingGunBarrel2',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -10, y: 0},
                            {x: 10, y: 0},
                            {x: 10, y: 100},
                            {x: -10, y: 100},
                        ],
                        offset: {x: -15, y: -190},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'GattlingGunMainBarrel',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -10, y: 0},
                            {x: 10, y: 0},
                            {x: 10, y: 110},
                            {x: -10, y: 110},
                        ],
                        offset: {x: 0, y: -200},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        cannon: {
                            keybind: 'click',
                            x: 0,
                            y: 0,
                            reload: {c: 0, t: 1},
                            spread: Math.PI/24,
                            bullet: {
                                type: 'circle', 
                                cType: 'point', 
                                size: 5,
                                style: {
                                    fill: {r: 100, g: 100, b: 100, a: 1},
                                    stroke: {colour: {r: 69, g: 69, b: 69, a: 1}, width: 2},
                                },
                                decay: {
                                    life: 100, 
                                    fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    size: 1
                                },
                                dmg: 20,
                                v: 25,
                                vDrag: 0.99,
                                vr: 0,
                                rDrag: 0,
                                friendly: true,
                            },
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'GattlingGunPart',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -30, y: 0},
                            {x: 30, y: 0},
                            {x: 30, y: 10},
                            {x: -30, y: 10},
                        ],
                        offset: {x: 0, y: -150},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: Infinity,
                        isHit: 0,
                        connected: [],
                    },
                ],
            },
            MachineGun: {
                id: 'defaultMachineGun',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -10, y: 0},
                    {x: 10, y: 0},
                    {x: 10, y: 30},
                    {x: -10, y: 30},
                ],
                offset: {x: 0, y: -100},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 0, t: 6},
                    spread: Math.PI/48,
                    bullet: {
                        type: 'circle', 
                        cType: 'point', 
                        size: 8,
                        style: {
                            fill: {r: 100, g: 100, b: 100, a: 1},
                            stroke: {colour: {r: 69, g: 69, b: 69, a: 1}, width: 3},
                        },
                        decay: {
                            life: 120, 
                            fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            size: 1
                        },
                        dmg: 100,
                        v: 20,
                        vDrag: 0.99,
                        vr: 0,
                        rDrag: 0,
                        friendly: true,
                    },
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [],
            },
            SpikeLauncher: {
                id: 'spikeLauncher',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -30, y: -30},
                    {x: 30, y: -30},
                    {x: 10, y: 0},
                    {x: -10, y: 0},
                ],
                offset: {x: -100, y: -70},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: '1',
                    x: 0,
                    y: -40,
                    reload: {c: 0, t: 5},
                    spread: Math.PI/24,
                    bullet: {
                        type: 'polygon',
                        cType: 'point',  
                        size: [
                            {x: 0, y: 5*4},
                            {x: -1.299*4, y: 0.75*4},
                            {x: -4.330*4, y: -2.5*4},
                            {x: 0, y: -1.5*4},
                            {x: 4.330*4, y: -2.5*4},
                            {x: 1.299*4, y: 0.75*4}
                        ],
                        style: {
                            fill: {r: 255, g: 100, b: 50, a: 1},
                            stroke: {colour: {r: 255, g: 0, b: 0, a: 1}, width: 3},
                        },
                        decay: {
                            life: 600, 
                            fillStyle: {r: -0.1, g: 0, b: 0, a: 0}, 
                            strokeStyle: {r: -0.1, g: 0, b: 0, a: 0}, 
                            size: 1.0005
                        },
                        dmg: 100,
                        v: 20,
                        vDrag: 0.97,
                        vr: Math.PI/20,
                        rDrag: 0.98,
                    },
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [],
            },
            Blaster: {
                id: 'blaster',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -30, y: -30},
                    {x: 30, y: -30},
                    {x: 10, y: 0},
                    {x: -10, y: 0},
                ],
                offset: {x: 0, y: -70},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: '2',
                    x: 0,
                    y: -40,
                    reload: {c: 0, t: 2},
                    spread: Math.PI/100,
                    bullet: {
                        type: 'circle', 
                        size: 5,
                        style: {
                            fill: {r: 20, g: 150, b: 150, a: 1},
                            stroke: {colour: {r: 0, g: 250, b: 250, a: 1}, width: 3},
                        },
                        decay: {
                            life: 100, 
                            fillStyle: {r: -0.1, g: -0.1, b: -0.1, a: 0}, 
                            strokeStyle: {r: -0.1, g: -0.1, b: -0.1, a: 0}, 
                            size: 1.0005
                        },
                        dmg: 20,
                        v: 20,
                        vDrag: 0.97,
                        vr: Math.PI/20,
                        rDrag: 0.98,
                    },
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [],
            },
            EnergySword: {
                id: 'energySword',
                facing: 'turret',
                type: 'polygon', 
                rOffset: Math.PI,
                size: [
                    {x: -25, y: 25},
                    {x: 25, y: 25},
                    {x: 20, y: 0},
                    {x: -20, y: 0},
                ],
                offset: {x: 100, y: -70},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 25,
                    reload: {c: 0, t: 0},
                    spread: 0,
                    bullet: {
                        type: 'polygon', 
                        size: [
                            {x: -25, y: 0},
                            {x: -15, y: 15},
                            {x: -15, y: 30},
                            {x: -20, y: 35},
                            {x: -25, y: 200},
                            {x: 0, y: 250},
                            {x: 25, y: 200},
                            {x: 20, y: 35},
                            {x: 15, y: 30},
                            {x: 15, y: 15},
                            {x: 25, y: 0},
                        ],
                        style: {
                            fill: {r: 50, g: 200, b: 255, a: 0.3},
                            stroke: {colour: {r: 50, g: 200, b: 255, a: 0.3}, width: 5},
                        },
                        decay: {
                            life: 5, 
                            fillStyle: {r: 0, g: 0, b: 0, a: -0.05}, 
                            strokeStyle: {r: 0, g: 0, b: 0, a: -0.05}, 
                            size: 1
                        },
                        dmg: 1000,
                        v: -1,
                        vDrag: 1,
                        vr: 0,
                        rDrag: 1,
                    },
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [],
            },
            Cannon: {
                id: 'tankCannon',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -15, y: 30},
                    {x: -15, y: 0},
                    {x: 15, y: 0},
                    {x: 15, y: 30},
                ],
                offset: {x: 0, y: -200},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 10},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 0, t: 90},
                    spread: Math.PI/96,
                    bullet: {
                        type: 'circle', 
                        cType: 'point', 
                        size: 12,
                        style: {
                            fill: {r: 100, g: 100, b: 100, a: 1},
                            stroke: {colour: {r: 69, g: 69, b: 69, a: 1}, width: 3},
                        },
                        decay: {
                            life: 150, 
                            fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            size: 1
                        },
                        dmg: 1000,
                        v: 30,
                        vDrag: 0.99,
                        vr: 0,
                        rDrag: 0,
                        friendly: true,
                    },
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [],
            },
            Sniper: {
                id: 'defaultSniper',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -10, y: 0},
                    {x: 10, y: 0},
                    {x: 10, y: 120},
                    {x: -10, y: 120},
                ],
                offset: {x: 0, y: -200},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 0, t: 30},
                    spread: Math.PI/480,
                    bullet: {
                        type: 'polygon', 
                        cType: 'point', 
                        size: [
                            {x: -8, y: 5},
                            {x: 0, y: -20},
                            {x: 8, y: 5},
                        ],
                        style: {
                            fill: {r: 255, g: 100, b: 100, a: 1},
                            stroke: {colour: {r: 255, g: 69, b: 69, a: 1}, width: 3},
                        },
                        decay: {
                            life: 180, 
                            fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            size: 1
                        },
                        dmg: 750,
                        v: 60,
                        vDrag: 1,
                        vr: 0,
                        rDrag: 0,
                        friendly: true,
                    },
                },
                collision: false,
                hp: Infinity,
                isHit: 0,
                connected: [],
            },
        },
    }
};

var projectiles = [];
var particles = [];
var entities = [];
// Loading savegames TODO: add saving entire game not just player
var player = {};
//localStorage.removeItem('player');
var savedPlayer = localStorage.getItem('player');
if (savedPlayer !== null) {
    console.log('loading previous save');
    player = JSON.parse(savedPlayer);
    console.log(savedPlayer);
} else {
    // No saved data found
    console.log('no save found, creating new player');
    player = JSON.parse(JSON.stringify(data.mech));
    drone = JSON.parse(JSON.stringify(data.drone));
    tank = JSON.parse(JSON.stringify(data.tank));
    mech = JSON.parse(JSON.stringify(data.mech));
    mech.x += 500;
    entities.push(JSON.parse(JSON.stringify(mech)));
    tank.x += 1000;
    entities.push(JSON.parse(JSON.stringify(tank)));
    drone.x += 1500;
    entities.push(JSON.parse(JSON.stringify(drone)));
    player.directControl = true;
    let leftWeapon = JSON.parse(JSON.stringify(data.template.weapons.Blaster));
    leftWeapon.offset.x -= 100;
    player.parts[1].connected[0].connected = [leftWeapon];
    entities.push(player);
};

// Steal Data (get inputs)
var mousepos = {x:0,y:0};
var display = {x:window.innerWidth, y:window.innerHeight};
console.log(entities);
window.onkeyup = function(e) {
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].directControl) {
            entities[i].keyboard[e.key.toLowerCase()] = false; 
        }
    }
};
window.onkeydown = function(e) {
    for (var i = 0; i < entities.length; i++) {
        if (entities[i].directControl) {
            entities[i].keyboard[e.key.toLowerCase()] = true; 
        }
    }
};
document.addEventListener('mousedown', function(event) {
    if (event.button === 0) { // Check if left mouse button was clicked
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].directControl) {
                entities[i].keyboard.click = true;
            }
        }
    }
});
document.addEventListener('mouseup', function(event) {
    if (event.button === 0) { // Check if left mouse button was released
        for (var i = 0; i < entities.length; i++) {
            if (entities[i].directControl) {
                entities[i].keyboard.click = false;
            }
        }
    }
});
window.addEventListener("resize", function () {
    if (t > 0) {
        display = {x:window.innerWidth,y:window.innerHeight};
        replacehtml(`<canvas id="main" width="${display.x}" height="${display.y}" style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas><canvas id="canvasOverlay" width="${display.x}" height="${display.y}" style="position: absolute; top: 0; left: 0; z-index: 2;"></canvas>`);
    }
});
function tellPos(p){
    mousepos = {x: p.pageX, y:p.pageY};
};
window.addEventListener('mousemove', tellPos, false);
var buttons = document.getElementsByClassName('button');

// Game related stuff
function load() {
    console.log('Startin the game...');
    replacehtml(`<canvas id="main" width="${display.x}" height="${display.y}" style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas><canvas id="canvasOverlay" width="${display.x}" height="${display.y}" style="position: absolute; top: 0; left: 0; z-index: 2;"></canvas>`);
    game();
};

function handlePlayerMotion(unit) {
    if (unit.directControl) {
        unit.aimPos = mousepos;
    } else {
        if (unit.keyboard.aimPos) {
            unit.aimPos = unit.keyboard.aimPos;
        }
    }
    unit.mouseR = rotateAngle(unit.mouseR, aim(vMath(vMath(vMath(display,0.5,'multiply'),player,'subtract'),unit,'add'), vMath(vMath(unit.aimPos,player,'subtract'),unit,'add')), unit.tr);
    unit.lastMoved += 1;
    switch (unit.type) {
        case 'mech':
            unit.vx = 0;
            unit.vy = 0;
            let mechSpeed = unit.v;
            unit.r = correctAngle(unit.r);
            if (unit.keyboard.capslock) {
                mechSpeed *= 4;
            }
            if (unit.keyboard.shift) {
                mechSpeed *= 2.5;
            }
            let mechIsMoving = false;
            let mechVector = {x: 0, y: 0}; // special maths
            if (unit.keyboard.w || unit.keyboard.arrowup) { 
                mechVector.y -= 1
                mechIsMoving = true;
            }
            if (unit.keyboard.s || unit.keyboard.arrowdown) {
                mechVector.y += 1
                mechIsMoving = true;
            }
            if (unit.keyboard.a || unit.keyboard.arrowleft) { 
                mechVector.x -= 1
                mechIsMoving = true;
            }
            if (unit.keyboard.d || unit.keyboard.arrowright) { 
                mechVector.x += 1
                mechIsMoving = true;
            }
            if (mechIsMoving) {
                if (unit.lastMoved >= 20) {
                    unit.r = aim({x:0, y: 0}, mechVector);
                } else {
                    unit.r = rotateAngle(unit.r, aim({x:0, y: 0}, mechVector), unit.vr);
                }
                let mechVelocity = toComponent(mechSpeed, unit.r);
                unit.x += mechVelocity.x;
                unit.y += mechVelocity.y;
                unit.vx = mechVelocity.x;
                unit.vy = mechVelocity.y;
                unit.lastMoved = -1;
            }
            break;
        case 'tank':
            let tankTopSpeed = unit.v;
            unit.r = correctAngle(unit.r);
            if (unit.keyboard.capslock) {
                tankTopSpeed *= 2;
            }
            if (unit.keyboard.shift) {
                tankTopSpeed *= 1.5;
            }
            let tankSpeed = Math.sqrt(unit.vx**2+unit.vy**2);
            if (unit.reverse) {
                tankSpeed = -Math.abs(tankSpeed);
            }
            if (unit.keyboard.w || unit.keyboard.arrowup) { 
                tankSpeed += tankTopSpeed/10;
            }
            if (unit.keyboard.s || unit.keyboard.arrowdown) {
                tankSpeed -= tankTopSpeed/10;
            }
            if (unit.keyboard.a || unit.keyboard.arrowleft) { 
                unit.r = rotateAngle(unit.r, unit.r-unit.vr, unit.vr);
            }
            if (unit.keyboard.d || unit.keyboard.arrowright) { 
                unit.r = rotateAngle(unit.r, unit.r+unit.vr, unit.vr);
            }
            if (tankSpeed < 0) {
                unit.reverse = true;
            } else {
                unit.reverse = false;
            }
            tankSpeed = Math.abs(tankSpeed);
            if (tankSpeed > tankTopSpeed) {
                tankSpeed = Math.max(tankTopSpeed, tankSpeed-0.25*tankTopSpeed);
            }
            if (tankSpeed < -tankTopSpeed*0.75) {
                tankSpeed = Math.min(-tankTopSpeed*0.75, tankSpeed+0.25*tankTopSpeed);
            }
            let tankR = unit.r;
            if (unit.reverse) {
                tankR = correctAngle(unit.r+Math.PI);
            }
            let tankVelocity = toComponent(Math.abs(tankSpeed), tankR);
            unit.x += tankVelocity.x;
            unit.y += tankVelocity.y;
            unit.vx = tankVelocity.x;
            unit.vy = tankVelocity.y;
            break;
        case 'drone':
            let droneTopSpeed = unit.v;
            if (unit.keyboard.capslock) {
                droneTopSpeed *= 2;
            }
            if (unit.keyboard.shift) {
                droneTopSpeed *= 1.5;
            }
            unit.isMoving = false;
            if (unit.directControl) {
                let droneVector = {x: 0, y: 0}; // special maths
                if (unit.keyboard.w || unit.keyboard.arrowup) { 
                    droneVector.y -= 1
                    unit.isMoving = true;
                }
                if (unit.keyboard.s || unit.keyboard.arrowdown) {
                    droneVector.y += 1
                    unit.isMoving = true;
                }
                if (unit.keyboard.a || unit.keyboard.arrowleft) { 
                    droneVector.x -= 1
                    unit.isMoving = true;
                }
                if (unit.keyboard.d || unit.keyboard.arrowright) { 
                    droneVector.x += 1
                    unit.isMoving = true;
                }
                if (unit.isMoving) {
                    unit.r = aim({x:0, y: 0}, droneVector);
                }
            }
            if (unit.isMoving) {
                let droneAcceleration = toComponent(droneTopSpeed/60, unit.r);
                unit.vx += droneAcceleration.x;
                unit.vy += droneAcceleration.y;
                let droneVelocity = Math.sqrt(unit.vx**2+unit.vy**2);
                if (droneVelocity > unit.v) {
                    let reduction = unit.v / droneVelocity;
                    unit.vx *= reduction;
                    unit.vy *= reduction;
                }
            }
            unit.x += unit.vx;
            unit.y += unit.vy;
            unit.vx *= 0.995;
            unit.vy *= 0.995;
            break;
        default:
            throw 'ERROR: are you f*king retarded? Tf is that unit type?';

    };
    //console.log(unit.keyboard);
    return unit;
};

function polygonCollision(polygon1, polygon2) {
    for (let i = 0; i < polygon1.length; i++) {
        if (pointInPolygon(polygon1[i], polygon2)) {
            return true;
        }
    }
    for (let i = 0; i < polygon2.length; i++) {
        if (pointInPolygon(polygon2[i], polygon1)) {
            return true;
        }
    }
    return false;
};

function simulatePhysics(objects) {
    let newObjs = [];
    for (let i = 0; i < objects.length; i++) {
        let newObj = JSON.parse(JSON.stringify(objects[i]));
        newObj.vx += newObj.ax;
        newObj.vy += newObj.ay;
        newObj.vr += newObj.ar;
        newObj.vx *= newObj.vDrag;
        newObj.vy *= newObj.vDrag;
        newObj.vr *= newObj.rDrag;
        let velocity = Math.sqrt(Math.abs(newObj.vx**2) + Math.abs(newObj.vy**2));
        if (velocity > newObj.maxV) {
            let reduction = newObj.maxV / velocity;
            newObj.vx *= reduction;
            newObj.vy *= reduction;
        }
        newObj.vr = Math.min(newObj.vr, newObj.maxRV);
        newObj.x += newObj.vx;
        newObj.y += newObj.vy;
        newObj.r += newObj.vr;
        newObjs.push(newObj);
    }
    return newObjs;
};

function renderParticles(particles) {
    for (let i = 0; i < particles.length; i++) {
        let obj = particles[i];
        if (obj.type == 'circle') {
            drawCircle(obj.x-player.x+display.x/2, obj.y-player.y+display.y/2, obj.size, toColour(obj.style.fill), toColour(obj.style.stroke.colour), obj.style.stroke.width, opacity=1);
        } else if (obj.type == 'polygon') {
            drawPolygon(obj.size, {x: obj.x, y: obj.y}, obj.r, toColour(obj.style.fill), {colour: toColour(obj.style.stroke.colour), width: obj.style.stroke.width}, false);
        } else {
            throw 'ERROR: unsupported particle type';
        }
    }
};

function recursiveParts(unit, parts, f) {
    for (let i = 0; i < parts.length; i++) {
        parts[i] = f(unit, parts[i]);
        parts[i].connected = recursiveParts(unit, parts[i].connected, f);
    }
    return parts;
};

function renderPart(unit, part) {
    if (part.type == 'polygon') {
        let np = offsetPoints(rotatePolygon(JSON.parse(JSON.stringify(part.size)), part.rOffset), part.offset);
        let facing = unit.r;
        if (part.facing == 'turret') {
            facing = unit.mouseR;
        }
        drawPolygon(np, {x: unit.x, y: unit.y}, facing, part.style.fill, part.style.stroke, false);
    } else {
        drawCircle(display.x/2 - player.x + unit.x + part.offset.x, display.y/2 - player.y + unit.y + part.offset.y, part.size, part.style.fill, part.style.stroke.colour, part.style.stroke.width, 1);
    }
    return part;
};

function renderUnit(unit) {
    unit.parts = recursiveParts(unit, unit.parts, renderPart);
    drawCircle(display.x/2 - player.x + unit.x, display.y/2 - player.y + unit.y, unit.collisionR, 'rgba(255, 255, 255, 0.1)', 'rgba(255, 0, 0, 0.9)', 5, 1);
};

function shoot(unit, part) {
    if (part.cannon) {
        if (part.cannon.reload.c > 0) {
            part.cannon.reload.c -= 1;
        } else {
            if (unit.keyboard[part.cannon.keybind]) {
                part.cannon.reload.c = part.cannon.reload.t;
                let facing = unit.r;
                if (part.facing == 'turret') {
                    facing = unit.mouseR;
                }
                let bullet = Object.assign({}, JSON.parse(JSON.stringify(data.template.physics)), JSON.parse(JSON.stringify(part.cannon.bullet)));
                bullet.x = unit.x + ((part.offset.x) * Math.cos(facing) - (part.offset.y) * Math.sin(facing));
                bullet.y = unit.y + ((part.offset.x) * Math.sin(facing) + (part.offset.y) * Math.cos(facing));
                bullet.x += (part.cannon.x * Math.cos(facing + part.rOffset) - (part.cannon.y) * Math.sin(facing + part.rOffset));
                bullet.y += ((part.cannon.x) * Math.sin(facing + part.rOffset) + (part.cannon.y) * Math.cos(facing + part.rOffset));
                facing += normalDistribution(0, part.cannon.spread);
                let res = toComponent(bullet.v, facing + part.rOffset);
                bullet.vx = res.x + unit.vx;
                bullet.vy = res.y + unit.vy;
                bullet.r = facing + part.rOffset;
                bullet.vr = part.cannon.bullet.vr;
                bullet.rDrag = part.cannon.bullet.rDrag;
                projectiles.push(bullet);
            }
        }
    }
    return part;
};

function handleShooting(unit) {
    unit.parts = recursiveParts(unit, unit.parts, shoot);
    return unit;
};

function handleDecay(objs) {
    let newObjs = []
    for (let i = 0; i < objs.length; i++) {
        let obj = objs[i];
        //console.log(obj);
        obj.decay.life -= 1;
        if(obj.decay.life > 0) {
            if (obj.type == 'polygon') {
                for (let j = 0; j < obj.size.length; j++) {
                    obj.size[j].x *= obj.decay.size;
                    obj.size[j].y *= obj.decay.size;
                }
            } else {
                obj.size *= obj.decay.size;
            }
            obj.style.fill.r += obj.decay.fillStyle.r;
            obj.style.fill.g += obj.decay.fillStyle.g;
            obj.style.fill.b += obj.decay.fillStyle.b;
            obj.style.fill.a += obj.decay.fillStyle.a;
            obj.style.stroke.r += obj.decay.strokeStyle.r;
            obj.style.stroke.g += obj.decay.strokeStyle.g;
            obj.style.stroke.b += obj.decay.strokeStyle.b;
            obj.style.stroke.a += obj.decay.strokeStyle.a;
            newObjs.push(obj);
        }
    }
    return newObjs;
};

function recursiveCollision(unit, parts, object) {
    let pts = JSON.parse(JSON.stringify(parts));
    let obj = JSON.parse(JSON.stringify(object));
    for (let i = 0; i < pts.length; i++) {
        if (pts[i].collision) {
            let collide = false;
            if (pts[i].type == 'polygon') {
                let cType = '';
                if (obj.cType) {
                    cType = obj.cType;
                } else {
                    cType = obj.type;
                }
                let facing = unit.r;
                if (pts[i].facing == 'turret') {
                    facing = unit.mouseR;
                }
                let points = offsetPoints(rotatePolygon(offsetPoints(JSON.parse(JSON.stringify(pts[i].size)), pts[i].offset), facing), unit);
                switch (cType) {
                    case 'point':
                        if (pointInPolygon(obj, points)) {
                            collide = true;
                        }
                        break;
                    case 'circle':
                        let r = obj.size;
                        let notCircle = circleToPolygon(obj, r, 10); // a decagon is close enough to a circle
                        if (polygonCollision(notCircle, points)) {
                            collide = true;
                        }
                        break;
                    case 'polygon': // unreliable
                        if (polygonCollision(offsetPoints(rotatePolygon(JSON.parse(JSON.stringify(obj.size)), obj.r), obj), points)) {
                            collide = true;
                        }
                        break;
                    default:
                        throw `ERROR: wtf is this object type! ${cType}`;
                }
            } else {
                //console.log(getDist(offsetPoints(JSON.parse(JSON.stringify([pts[i].offset])), unit)[0], obj));
                let cType = '';
                if (obj.cType) {
                    cType = obj.cType;
                } else {
                    cType = obj.type;
                }
                switch (cType) {
                    case 'point':
                        if (getDist(vMath(JSON.parse(JSON.stringify(pts[i].offset)), unit, 'add'), obj) <= pts[i].size) {
                            collide = true;
                        }
                        break;
                    case 'circle':
                        let r = obj.size;
                        if (getDist(vMath(JSON.parse(JSON.stringify(pts[i].offset)), unit, 'add'), obj) <= pts[i].size + r) {
                            collide = true;
                        }
                        break;
                    case 'polygon':
                        let notCircle = circleToPolygon(pts[i], pts[i].size, 10); // a decagon is close enough to a circle
                        if (polygonCollision(notCircle, obj.size)) {
                            collide = true;
                        }
                        break;
                    default:
                        throw `ERROR: wtf is this object type! ${cType}`;
                }
            }
            if (collide) {
                pts[i].hp -= obj.dmg;
                pts[i].isHit=5;
                obj.dmg = 0; // have to do this to stop it hitting multiple pts (this is inefficient but hard to fix. maybe rework this to not use recursion? bfs?)
                return [pts, obj];
            }
        }
        let res = recursiveCollision(unit, pts[i].connected, obj);
        pts[i].connected = res[0];
        obj = res[1];
    }
    return [pts, obj];
};

function handleCollisions(units, projectiles) {
    let newProj = [];
    if (projectiles.length && units.length) {
        for (let i = 0; i < projectiles.length; i++) {
            for (let j = 0; j < units.length; j++) {
                if (getDist(projectiles[i], units[j]) <= units[j].collisionR) {
                    let res = recursiveCollision(units[j], units[j].parts, projectiles[i]);
                    units[j].parts = res[0];
                    projectiles[i] = res[1];
                }
            }
            if (projectiles[i].dmg != 0) {
                newProj.push(projectiles[i]);
            }
        }
        return [units, newProj];
    }
    return [units, projectiles];
};

function handleGroundCollisions(units, obstacles) {
    for (let i = 0; i < units.length; i++) {
        let unit = units[i];
        for (let j = 0; j < units.length; j++) {
            let obstacle = obstacles[j]
            if ((obstacle.type == 'ground' && unit.type != 'drone') || obstacle.type == 'tall') {

            }
        }
    }
};

function main() {
    clearCanvas('main');
    clearCanvas('canvasOverlay');
    grid(200);
    const points = [
        {x: 100, y: 100},
        {x: 200, y: 50},
        {x: 150, y: 100},
        {x: 200, y: 200}
    ];
    drawPolygon(points, {x: 100, y: 100}, 0, 'rgba(0, 0, 255, 0.75)', {colour: '#696969', width: 10}, false);
    drawPolygon(points, {x: 100, y: 100}, Math.PI/2, 'rgba(0, 0, 255, 0.75)', {colour: '#696969', width: 10}, false);
    drawPolygon(points, {x: 100, y: 100}, Math.PI, 'rgba(0, 0, 255, 0.75)', {colour: '#696969', width: 10}, false);
    drawPolygon(points, {x: 100, y: 100}, 3*Math.PI/2, 'rgba(0, 0, 255, 0.75)', {colour: '#696969', width: 10}, false);
    const points2 = [
        {x: 0, y: 0},
        {x: 100, y: 0},
        {x: 100, y: 100},
        {x: 0, y: 100}
    ];
    drawPolygon(points2, {x: 0, y: 0}, Math.PI/4, 'rgba(255, 0, 0, 0.75)', {colour: '#696969', width: 10}, false);
    drawPolygon(points2, {x: 0, y: 0}, false, 'rgba(0, 255, 0, 0.5)', {colour: '#696969', width: 10}, false);
    const square = [
        {x: 0, y: 0},
        {x: 100, y: 0},
        {x: 100, y: 100},
        {x: 0, y: 100}
    ];
    drawPolygon(square, {x: 0, y: 0}, false, 'rgba(0, 0, 255, 0.5)', {colour: '#696969', width: 10}, false);

    let res = handleCollisions(entities, projectiles);
    entities = res[0];
    projectiles = res[1];

    for (let i = 0; i < entities.length; i++) {
        entities[i] = handlePlayerMotion(entities[i]);
        entities[i] = handleShooting(entities[i]);
        renderUnit(entities[i]);
    }
    projectiles = simulatePhysics(projectiles);
    //console.log(projectiles);
    projectiles = handleDecay(projectiles);
    renderParticles(projectiles);
};

var t=0;
async function game() {
    while (1) {
        main();
        await sleep(1000/60);
        t++;
    }
};
