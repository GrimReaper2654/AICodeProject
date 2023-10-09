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

5/10/2023
 • added obstacle collision (1/4)
- Tom Qiu

5/10/2023
 • improved obstacle collision (2/4)
- Tom Qiu

6/10/2023
 • finished obstacle collision (4/4)
 • updated colour scheme
 • added line collision (used for melee weapons with long hitboxes)
 • added hp gauge
- Tom Qiu

7/10/2023
 • fixed shield colour (hp > maxhp)
 • added armour to tank
 • added explosions
- Tom Qiu

8/10/2023
 • created level 1 map
- Tiger

9/10/2023
 • centered wall parts
 • fixed obstacle collision (5/4)
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
        console.log(r, rTarget);
        r = correctAngle(r);
        rTarget = correctAngle(rTarget);
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
        drawLine({x:(player.x - display.x / 2) - spacing,y:i}, r=0, display.x+spacing*2, {colour:'#000000',width:10,opacity:0.05});
    }
    start = (player.x - display.x / 2) < 0 ? Math.ceil((player.x - display.x / 2) / spacing) * spacing : Math.floor((player.x - display.x / 2) / spacing) * spacing - spacing * 2;
    end = (player.x + display.x / 2) < 0 ? Math.ceil((player.x + display.x / 2) / spacing) * spacing : Math.floor((player.x + display.x / 2) / spacing) * spacing + spacing * 2;
    for (var i = start; i < end; i += spacing) {
        drawLine({x:i,y:(player.y - display.y / 2) -spacing}, r=Math.PI/2, display.y+spacing*2, {colour:'#000000',width:10,opacity:0.05});
    }
};

function handleExplosion(explosion) {
    //console.log(explosion);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, explosion.r, '#fccbb1', '#f7b28d', 0.1, 0.2*explosion.transparancy);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, explosion.r, false, '#f7b28d', 5, 0.2);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, Math.max(explosion.r-20, 0), false, '#fcd8d2', 20, 0.1*explosion.transparancy);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, Math.max(explosion.r-15, 0), false, '#fcd8d2', 15, 0.1*explosion.transparancy);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, Math.max(explosion.r-10, 0), false, '#fcd8d2', 10, 0.1*explosion.transparancy);
    drawCircle(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, Math.max(explosion.r-5, 0), false, '#fcd8d2', 5, 0.1*explosion.transparancy);
    drawLight(explosion.x-r-player.x+display.x/2, explosion.y-r-player.y+display.y/2, explosion.r*1.1);
    if (explosion.r >= explosion.maxR) {
        explosion.transparancy *= 0.75;
        explosion.r *= 1.2;
        explosion.active = false;
    }
    if (explosion.r < explosion.maxR) {
        explosion.active = true;
        explosion.r += explosion.expandSpeed;
        if (explosion.r > explosion.maxR) {
            explosion.r = explosion.maxR;
        }
    }
    if (explosion.transparancy > 0.25) {
        return explosion;
    } return false;
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
        case '||':
        case 'magnitude':
            return Math.sqrt(v1.x**2+v1.y**2);
        case '+': 
        case 'addition':
        case 'add':
            return {x: v1.x+v2.x, y: v1.y+v2.y};
        case '-': 
        case 'subtraction':
        case 'subtract':
            return {x: v1.x-v2.x, y: v1.y-v2.y};
        case '*': 
        case 'x': 
        case 'scalar multiplication':
        case 'multiplication':
        case 'multiply': // v2 is now a scalar
            return {x: v1.x*v2, y: v1.y*v2};
        case '/': 
        case 'division':
        case 'divide': // v2 is now a scalar
            return {x: v1.x/v2, y: v1.y/v2};
        case '•': 
        case '.': 
        case 'dot product': 
            return v1.x * v2.x + v1.y * v2.y;
        case 'cross product': // chat gpt, I believe in you (I doubt this is correct)
            return v1.x * v2.y - v1.y * v2.x;
        case 'projection':
        case 'vector resolute':
        return vMath(v2, vMath(v1, v2, '.')/vMath(v2, null, '||')**2, 'x');
        default:
            throw 'what are you trying to do to to that poor vector?';
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
        v: 5, // normal walking speed
        vr: 180 / 60 / 180 * Math.PI, // rotation of tracks (feet)
        tr: 360 / 60 / 180 * Math.PI, // rotation of turret (main body)
        keyboard: [],
        aimPos: {x: 69, y: 69},
        collisionR: 500,
        groundCollisionR: 80,
        tallCollisionR: 150,
        directControl: false,
        type: 'mech',
        alive: true,
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
                collision: false,
                hp: 1,
                maxHp: 1,
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
                        hp: 1,
                        maxHp: 1,
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
                        hp: 1,
                        maxHp: 1,
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
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                ],
                groundCollision: true,
            },
            {
                id: 'mainBodycontainer',
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
                collision: false,
                hp: 1,
                maxHp: 1,
                collideDmg: 0,
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
                        maxHp: 3000,
                        collideDmg: 500,
                        isHit: 0,
                        connected: [
                            {
                                id: 'leftArmMain',
                                type: 'circle', 
                                facing: 'body',
                                rOffset: 0,
                                size: 0,
                                offset: {x: 0, y: 0},
                                style: {
                                    fill: 'rgba(0, 0, 0, 0)',
                                    stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                                },
                                collision: false,
                                hp: 1,
                                maxHp: 1,
                                isHit: 0,
                                connected: [],
                            },
                            {
                                id: 'leftArmSide',
                                type: 'circle', 
                                facing: 'body',
                                rOffset: 0,
                                size: 0,
                                offset: {x: 0, y: 0},
                                style: {
                                    fill: 'rgba(0, 0, 0, 0)',
                                    stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                                },
                                collision: false,
                                hp: 1,
                                maxHp: 1,
                                isHit: 0,
                                connected: [],
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
                        maxHp: 3000,
                        collideDmg: 500,
                        isHit: 0,
                        connected: [
                            {
                                id: 'rightArmMain',
                                type: 'circle', 
                                facing: 'body',
                                rOffset: 0,
                                size: 0,
                                offset: {x: 0, y: 0},
                                style: {
                                    fill: 'rgba(0, 0, 0, 0)',
                                    stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                                },
                                collision: false,
                                hp: 1,
                                maxHp: 1,
                                isHit: 0,
                                connected: [],
                            },
                            {
                                id: 'rightArmSide',
                                type: 'circle', 
                                facing: 'body',
                                rOffset: 0,
                                size: 0,
                                offset: {x: 0, y: 0},
                                style: {
                                    fill: 'rgba(0, 0, 0, 0)',
                                    stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                                },
                                collision: false,
                                hp: 1,
                                maxHp: 1,
                                isHit: 0,
                                connected: [],
                            },
                        ],
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
                        maxHp: 5000,
                        collideDmg: 500,
                        isHit: 0,
                        core: true,
                        connected: [
                            {
                                id: 'back',
                                type: 'circle', 
                                facing: 'body',
                                rOffset: 0,
                                size: 0,
                                offset: {x: 0, y: 0},
                                style: {
                                    fill: 'rgba(0, 0, 0, 0)',
                                    stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                                },
                                collision: false,
                                hp: 1,
                                maxHp: 1,
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
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [
                            {
                                id: 'headTurret',
                                type: 'circle', 
                                facing: 'body',
                                rOffset: 0,
                                size: 0,
                                offset: {x: 0, y: 0},
                                style: {
                                    fill: 'rgba(0, 0, 0, 0)',
                                    stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                                },
                                collision: false,
                                hp: 1,
                                maxHp: 1,
                                isHit: 0,
                                connected: [],
                            },
                        ],
                    },
                ],
            },
        ],
        effects: [],
    },
    tank: {
        x: 0,
        y: 0,
        r: 0, // direction of motion
        vx: 0,
        vy: 0,
        mouseR: 0, // current Aim
        v: 4, // top speed
        vr: 45 / 60 / 180 * Math.PI, // rotation of tracks (feet)
        tr: 150 / 60 / 180 * Math.PI, // rotation of turret (main body)
        keyboard: [],
        aimPos: {x: 69, y: 69},
        collisionR: 500,
        groundCollisionR: 120,
        tallCollisionR: 180,
        reverse: false,
        directControl: false,
        type: 'tank',
        alive: true,
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
                core: true,
                hp: 10000,
                maxHp: 10000,
                isHit: 0,
                connected: [
                    {
                        id: 'frontArmour',
                        facing: 'body',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -90, y: -10},
                            {x: 0, y: -25},
                            {x: 90, y: -10},
                            {x: 90, y: 0},
                            {x: -90, y: 0},
                        ],
                        offset: {x: 0, y: -100},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 10},
                        },
                        collision: true,
                        hp: 5000,
                        maxHp: 5000,
                        isHit: 0,
                        connected: [],
                    },
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
                        hp: 1,
                        maxHp: 1,
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
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                        groundCollision: true,
                    },
                    {
                        id: 'armour1.5',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: 130},
                            {x: 5, y: 130},
                            {x: 15, y: 125},
                            {x: 15, y: 85},
                            {x: 5, y: 80},
                            {x: -5, y: 80},
                            {x: -15, y: 85},
                            {x: -15, y: 125},
                        ],
                        offset: {x: -100, y: 0},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour1.4',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: 30},
                            {x: 5, y: 30},
                            {x: 15, y: 35},
                            {x: 15, y: 85},
                            {x: 5, y: 80},
                            {x: -5, y: 80},
                            {x: -15, y: 85},
                            {x: -15, y: 35},
                        ],
                        offset: {x: -100, y: -2},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour1.3',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: 30},
                            {x: 5, y: 30},
                            {x: 15, y: 35},
                            {x: 15, y: -15},
                            {x: 5, y: -20},
                            {x: -5, y: -20},
                            {x: -15, y: -15},
                            {x: -15, y: 35},
                        ],
                        offset: {x: -100, y: -4},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour1.2',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: -70},
                            {x: 5, y: -70},
                            {x: 15, y: -65},
                            {x: 15, y: -15},
                            {x: 5, y: -20},
                            {x: -5, y: -20},
                            {x: -15, y: -15},
                            {x: -15, y: -65},
                        ],
                        offset: {x: -100, y: -6},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour1.1',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: -70},
                            {x: 5, y: -70},
                            {x: 15, y: -65},
                            {x: 15, y: -115},
                            {x: 5, y: -120},
                            {x: -5, y: -120},
                            {x: -15, y: -115},
                            {x: -15, y: -65},
                        ],
                        offset: {x: -100, y: -8},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour2.5',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: 130},
                            {x: 5, y: 130},
                            {x: 15, y: 125},
                            {x: 15, y: 85},
                            {x: 5, y: 80},
                            {x: -5, y: 80},
                            {x: -15, y: 85},
                            {x: -15, y: 125},
                        ],
                        offset: {x: 100, y: 0},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour2.4',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: 30},
                            {x: 5, y: 30},
                            {x: 15, y: 35},
                            {x: 15, y: 85},
                            {x: 5, y: 80},
                            {x: -5, y: 80},
                            {x: -15, y: 85},
                            {x: -15, y: 35},
                        ],
                        offset: {x: 100, y: -2},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour2.3',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: 30},
                            {x: 5, y: 30},
                            {x: 15, y: 35},
                            {x: 15, y: -15},
                            {x: 5, y: -20},
                            {x: -5, y: -20},
                            {x: -15, y: -15},
                            {x: -15, y: 35},
                        ],
                        offset: {x: 100, y: -4},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour2.2',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: -70},
                            {x: 5, y: -70},
                            {x: 15, y: -65},
                            {x: 15, y: -15},
                            {x: 5, y: -20},
                            {x: -5, y: -20},
                            {x: -15, y: -15},
                            {x: -15, y: -65},
                        ],
                        offset: {x: 100, y: -6},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'armour2.1',
                        type: 'polygon', 
                        facing: 'body',
                        rOffset: 0,
                        size: [
                            {x: -5, y: -70},
                            {x: 5, y: -70},
                            {x: 15, y: -65},
                            {x: 15, y: -115},
                            {x: 5, y: -120},
                            {x: -5, y: -120},
                            {x: -15, y: -115},
                            {x: -15, y: -65},
                        ],
                        offset: {x: 100, y: -8},
                        style: {
                            fill: 'rgba(210, 210, 210, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: true,
                        hp: 2500,
                        maxHp: 2500,
                        isHit: 0,
                        connected: [],
                        groundCollision: false,
                    },
                    {
                        id: 'rightSide',
                        type: 'circle', 
                        facing: 'body',
                        rOffset: 0,
                        size: 0,
                        offset: {x: 0, y: 0},
                        style: {
                            fill: 'rgba(0, 0, 0, 0)',
                            stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'leftSide',
                        type: 'circle', 
                        facing: 'body',
                        rOffset: 0,
                        size: 0,
                        offset: {x: 0, y: 0},
                        style: {
                            fill: 'rgba(0, 0, 0, 0)',
                            stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
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
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [
                    {
                        id: 'main',
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
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                ],
            }
        ],
        effects: [],
    },
    drone: {
        x: 0,
        y: 0,
        r: 0, // direction of motion
        vx: 0,
        vy: 0,
        mouseR: 0, // current Aim
        v: 7.5, // top speed
        tr: 360 / 60 / 180 * Math.PI, // rotation of turret (main body)
        keyboard: [],
        aimPos: {x: 69, y: 69},
        collisionR: 500,
        groundCollisionR: -1,
        tallCollisionR: 110,
        isMoving: false,
        directControl: false,
        type: 'drone',
        alive: true,
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
                core: true,
                hp: 1500,
                maxHp: 1000,
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
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                ],
            },
        ],
        effects: [],
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
                hp: 1,
                maxHp: 1,
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
                hp: 1,
                maxHp: 1,
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
                        hp: 1,
                        maxHp: 1,
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
                        hp: 1,
                        maxHp: 1,
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
                            reload: {c: 45, t: 1},
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
                        hp: 1,
                        maxHp: 1,
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
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                ],
            },
            BasicGun: {
                id: 'basicGun',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -10, y: 0},
                    {x: 10, y: 0},
                    {x: 10, y: 30},
                    {x: -10, y: 30},
                ],
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 6, t: 25},
                    spread: Math.PI/48/2,
                    bullet: {
                        type: 'circle', 
                        cType: 'point', 
                        size: 8,
                        style: {
                            fill: {r: 100, g: 100, b: 100, a: 1},
                            stroke: {colour: {r: 69, g: 69, b: 69, a: 1}, width: 3},
                        },
                        decay: {
                            life: 100, 
                            fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            size: 1
                        },
                        dmg: 50,
                        v: 20,
                        vDrag: 0.99,
                        vr: 0,
                        rDrag: 0,
                        friendly: true,
                    },
                },
                collision: false,
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [],
            },
            GunTurret: {
                id: 'gunTurretBase',
                facing: 'body',
                type: 'circle', 
                rOffset: 0,
                size: 15,
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                collision: false,
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [
                    {
                        id: 'basicGun',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -8, y: 0},
                            {x: 8, y: 0},
                            {x: 8, y: 60},
                            {x: -8, y: 60},
                        ],
                        offset: {x: 0, y: -50},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        cannon: {
                            keybind: 'click',
                            x: 0,
                            y: 0,
                            reload: {c: 6, t: 20},
                            spread: Math.PI/48/2,
                            bullet: {
                                type: 'circle', 
                                cType: 'point', 
                                size: 6,
                                style: {
                                    fill: {r: 100, g: 100, b: 100, a: 1},
                                    stroke: {colour: {r: 69, g: 69, b: 69, a: 1}, width: 3},
                                },
                                decay: {
                                    life: 100, 
                                    fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    size: 1
                                },
                                dmg: 50,
                                v: 30,
                                vDrag: 0.99,
                                vr: 0,
                                rDrag: 0,
                                friendly: true,
                            },
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'gunTurretBase',
                        facing: 'body',
                        type: 'circle', 
                        rOffset: 0,
                        size: 15,
                        offset: {x: 0, y: 0},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    }
                ],
            },
            LightMachineGun: {
                id: 'LightMachineGun',
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
                    reload: {c: 6, t: 15},
                    spread: Math.PI/48/4,
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
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [],
            },
            CannonSideMounted: {
                id: 'cannonSideMounted',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 5*Math.PI/180,
                size: [
                    {x: -10, y: -10},
                    {x: 10, y: -10},
                    {x: 10, y: 70},
                    {x: -10, y: 70},
                ],
                offset: {x: 5, y: -90},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 6, t: 15},
                    spread: Math.PI/48/4,
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
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [
                    {
                        id: 'mount',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: 30, y: -20},
                            {x: 30, y: 20},
                            {x: 0, y: 15},
                            {x: 0, y: -15},
                        ],
                        offset: {x: -10, y: -10},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                ],
            },
            MediumMachineGun: {
                id: 'mediumMachineGun',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -10, y: 0},
                    {x: 10, y: 0},
                    {x: 10, y: 100},
                    {x: -10, y: 100},
                ],
                offset: {x: 0, y: -170},
                style: {
                    fill: 'rgba(120, 120, 120, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 6, t: 5},
                    spread: Math.PI/48,
                    bullet: {
                        type: 'circle', 
                        cType: 'point', 
                        size: 6,
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
                        dmg: 60,
                        v: 40,
                        vDrag: 0.99,
                        vr: 0,
                        rDrag: 0,
                        friendly: true,
                    },
                },
                collision: false,
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [
                    {
                        id: 'lightMachineGunBarrel',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -15, y: -40},
                            {x: 15, y: -40},
                            {x: 15, y: 30},
                            {x: -15, y: 30},
                        ],
                        offset: {x: 0, y: -100},
                        style: {
                            fill: 'rgba(150, 150, 150, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco1.1',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: 6, y: -80},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco1.2',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: 6, y: -92},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco1.3',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: 6, y: -104},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco1.4',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: 6, y: -116},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco1.5',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: 6, y: -128},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco2.1',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: -6, y: -75},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco2.2',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: -6, y: -87},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco2.3',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: -6, y: -99},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco2.4',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: -6, y: -111},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco2.5',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: -6, y: -123},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                    {
                        id: 'lightMachineGunBarrelDeco2.6',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 5,
                        offset: {x: -6, y: -135},
                        style: {
                            fill: 'rgba(100, 100, 100, 1)',
                            stroke: {colour: '#696969', width: 1},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                ],
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
                offset: {x: 0, y: -70},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: '1',
                    x: 0,
                    y: -40,
                    reload: {c: 30, t: 5},
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
                hp: 1,
                maxHp: 1,
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
                    keybind: 'click',
                    x: 0,
                    y: -40,
                    reload: {c: 15, t: 2},
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
                hp: 1,
                maxHp: 1,
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
                    reload: {c: 5, t: 0},
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
                            fill: {r: 50, g: 200, b: 255, a: 0.5},
                            stroke: {colour: {r: 50, g: 200, b: 255, a: 0.7}, width: 5},
                        },
                        decay: {
                            life: 2, 
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
                hp: 1,
                maxHp: 1,
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
                    reload: {c: 30, t: 90},
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
                hp: 1,
                maxHp: 1,
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
                    reload: {c: 45, t: 30},
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
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [],
            },
            RPG: {
                id: 'rpg',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -22, y: 0},
                    {x: 22, y: 0},
                    {x: 15, y: 50},
                    {x: -15, y: 50},
                ],
                offset: {x: 40, y: -150},
                style: {
                    fill: 'rgba(130, 130, 130, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 180, t: 150},
                    spread: Math.PI/480,
                    bullet: {
                        type: 'polygon', 
                        cType: 'point', 
                        size: [
                            {x: -8*2.5, y: -10*2.5},
                            {x: 0, y: -20*2.5},
                            {x: 8*2.5, y: -10*2.5},
                            {x: 3*2.5, y: 5*2.5},
                            {x: 3*2.5, y: 7*2.5},
                            {x: 5*2.5, y: 10*2.5},
                            {x: -5*2.5, y: 10*2.5},
                            {x: -3*2.5, y: 7*2.5},
                            {x: -3*2.5, y: 5*2.5},
                        ],
                        style: {
                            fill: {r: 75*1.5, g: 83*1.5, b: 32*1.5, a: 1},
                            stroke: {colour: {r: 67.5*1.2, g: 74.7*1.2, b: 28.8*1.2, a: 1}, width: 5},
                        },
                        decay: {
                            life: 180, 
                            fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            size: 1
                        },
                        dmg: 150,
                        explosion: {
                            dmg: 75, // damage/tick in the explosion radius
                            maxR: 100,
                            expandSpeed: 5,
                            r:20,
                        },
                        v: 2,
                        vDrag: 1.075,
                        accel: true,
                        vr: 0,
                        rDrag: 0,
                        friendly: true,
                    },
                },
                collision: false,
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [
                    {
                        id: 'rpg',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -15, y: 120},
                            {x: 15, y: 120},
                            {x: 15, y: 300},
                            {x: -15, y: 300},
                        ],
                        offset: {x: 40, y: -220},
                        style: {
                            fill: 'rgba(130, 130, 130, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    }
                ],
            },
            Nuker: {
                id: 'nukeLauncher',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -22, y: 0},
                    {x: 22, y: 0},
                    {x: 15, y: 50},
                    {x: -15, y: 50},
                ],
                offset: {x: 40, y: -150},
                style: {
                    fill: 'rgba(130, 130, 130, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                cannon: {
                    keybind: 'click',
                    x: 0,
                    y: 0,
                    reload: {c: 180, t: 120},
                    spread: Math.PI/480,
                    bullet: {
                        type: 'polygon', 
                        cType: 'point', 
                        size: [
                            {x: -8*2.5, y: -10*2.5},
                            {x: 0, y: -20*2.5},
                            {x: 8*2.5, y: -10*2.5},
                            {x: 3*2.5, y: 5*2.5},
                            {x: 3*2.5, y: 7*2.5},
                            {x: 5*2.5, y: 10*2.5},
                            {x: -5*2.5, y: 10*2.5},
                            {x: -3*2.5, y: 7*2.5},
                            {x: -3*2.5, y: 5*2.5},
                        ],
                        style: {
                            fill: {r: 75*1.5, g: 83*1.5, b: 32*1.5, a: 1},
                            stroke: {colour: {r: 67.5*1.2, g: 74.7*1.2, b: 28.8*1.2, a: 1}, width: 5},
                        },
                        decay: {
                            life: 180, 
                            fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                            size: 1
                        },
                        dmg: 100,
                        explosion: {
                            dmg: 1000, // damage/tick in the explosion radius
                            maxR: 10000,
                            expandSpeed: 25,
                            r:20,
                        },
                        v: 5,
                        vDrag: 1.1,
                        accel: true,
                        vr: 0,
                        rDrag: 0,
                        friendly: true,
                    },
                },
                collision: false,
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [
                    {
                        id: 'rpg',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -15, y: 120},
                            {x: 15, y: 120},
                            {x: 15, y: 300},
                            {x: -15, y: 300},
                        ],
                        offset: {x: 40, y: -220},
                        style: {
                            fill: 'rgba(130, 130, 130, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    }
                ],
            },
            DualRPG: {
                id: 'rpgContainer',
                facing: 'body',
                type: 'circle', 
                rOffset: 0,
                size: 0,
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(0, 0, 0, 0)',
                    stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                },
                collision: false,
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [
                    {
                        id: 'rpg',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -22, y: 0},
                            {x: 22, y: 0},
                            {x: 15, y: 50},
                            {x: -15, y: 50},
                        ],
                        offset: {x: 40, y: -150},
                        style: {
                            fill: 'rgba(130, 130, 130, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        cannon: {
                            keybind: 'click',
                            x: 0,
                            y: 0,
                            reload: {c: 180, t: 150},
                            spread: Math.PI/480,
                            bullet: {
                                type: 'polygon', 
                                cType: 'point', 
                                size: [
                                    {x: -8*2.5, y: -10*2.5},
                                    {x: 0, y: -20*2.5},
                                    {x: 8*2.5, y: -10*2.5},
                                    {x: 3*2.5, y: 5*2.5},
                                    {x: 3*2.5, y: 7*2.5},
                                    {x: 5*2.5, y: 10*2.5},
                                    {x: -5*2.5, y: 10*2.5},
                                    {x: -3*2.5, y: 7*2.5},
                                    {x: -3*2.5, y: 5*2.5},
                                ],
                                style: {
                                    fill: {r: 75*1.5, g: 83*1.5, b: 32*1.5, a: 1},
                                    stroke: {colour: {r: 67.5*1.2, g: 74.7*1.2, b: 28.8*1.2, a: 1}, width: 5},
                                },
                                decay: {
                                    life: 180, 
                                    fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    size: 1
                                },
                                dmg: 150,
                                explosion: {
                                    dmg: 75, // damage/tick in the explosion radius
                                    maxR: 100,
                                    expandSpeed: 5,
                                    r:20,
                                },
                                v: 2,
                                vDrag: 1.075,
                                accel: true,
                                vr: 0,
                                rDrag: 0,
                                friendly: true,
                            },
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [
                            {
                                id: 'rpg',
                                facing: 'turret',
                                type: 'polygon', 
                                rOffset: 0,
                                size: [
                                    {x: -15, y: 120},
                                    {x: 15, y: 120},
                                    {x: 15, y: 300},
                                    {x: -15, y: 300},
                                ],
                                offset: {x: 40, y: -220},
                                style: {
                                    fill: 'rgba(130, 130, 130, 1)',
                                    stroke: {colour: '#696969', width: 5},
                                },
                                collision: false,
                                hp: 1,
                                maxHp: 1,
                                isHit: 0,
                                connected: [],
                            }
                        ],
                    },
                    {
                        id: 'rpg',
                        facing: 'turret',
                        type: 'polygon', 
                        rOffset: 0,
                        size: [
                            {x: -22, y: 0},
                            {x: 22, y: 0},
                            {x: 15, y: 50},
                            {x: -15, y: 50},
                        ],
                        offset: {x: -40, y: -150},
                        style: {
                            fill: 'rgba(130, 130, 130, 1)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        cannon: {
                            keybind: 'click',
                            x: 0,
                            y: 0,
                            reload: {c: 180, t: 150},
                            delay: {c: 75, t: 75},
                            spread: Math.PI/480,
                            bullet: {
                                type: 'polygon', 
                                cType: 'point', 
                                size: [
                                    {x: -8*2.5, y: -10*2.5},
                                    {x: 0, y: -20*2.5},
                                    {x: 8*2.5, y: -10*2.5},
                                    {x: 3*2.5, y: 5*2.5},
                                    {x: 3*2.5, y: 7*2.5},
                                    {x: 5*2.5, y: 10*2.5},
                                    {x: -5*2.5, y: 10*2.5},
                                    {x: -3*2.5, y: 7*2.5},
                                    {x: -3*2.5, y: 5*2.5},
                                ],
                                style: {
                                    fill: {r: 75*1.5, g: 83*1.5, b: 32*1.5, a: 1},
                                    stroke: {colour: {r: 67.5*1.2, g: 74.7*1.2, b: 28.8*1.2, a: 1}, width: 5},
                                },
                                decay: {
                                    life: 180, 
                                    fillStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    strokeStyle: {r: 0, g: 0, b: 0, a: 0}, 
                                    size: 1
                                },
                                dmg: 150,
                                explosion: {
                                    dmg: 75, // damage/tick in the explosion radius
                                    maxR: 100,
                                    expandSpeed: 5,
                                    r:20,
                                },
                                v: 2,
                                vDrag: 1.075,
                                accel: true,
                                vr: 0,
                                rDrag: 0,
                                friendly: true,
                            },
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [
                            {
                                id: 'rpg',
                                facing: 'turret',
                                type: 'polygon', 
                                rOffset: 0,
                                size: [
                                    {x: -15, y: 120},
                                    {x: 15, y: 120},
                                    {x: 15, y: 300},
                                    {x: -15, y: 300},
                                ],
                                offset: {x: -40, y: -220},
                                style: {
                                    fill: 'rgba(130, 130, 130, 1)',
                                    stroke: {colour: '#696969', width: 5},
                                },
                                collision: false,
                                hp: 1,
                                maxHp: 1,
                                isHit: 0,
                                connected: [],
                            }
                        ],
                    },
                ],
            },
            ShieldProjectorMech: {
                id: 'smallShieldBase',
                facing: 'turret',
                type: 'polygon', 
                rOffset: 0,
                size: [
                    {x: -30, y: 0},
                    {x: -30, y: 30},
                    {x: -20, y: 40},
                    {x: 20, y: 40},
                    {x: 30, y: 30},
                    {x: 30, y: 0},
                ],
                offset: {x: 0, y: 25},
                style: {
                    fill: 'rgba(150, 150, 150, 1)',
                    stroke: {colour: '#696969', width: 5},
                },
                collision: true,
                hp: 1000,
                maxHp: 1000,
                isHit: 0,
                connected: [
                    {
                        id: 'smallShieldProjector',
                        facing: 'turret',
                        type: 'circle', 
                        rOffset: 0,
                        size: 15,
                        offset: {x: 0, y: 45},
                        style: {
                            fill: 'rgba(0, 255, 2555, 0.9)',
                            stroke: {colour: '#696969', width: 5},
                        },
                        shield: {
                            type: 'circle', 
                            r: 150,
                            hp: 2000,
                            regen: 5,
                            minHp: 1000,
                            active: true,
                            cap: 2000,
                            style: {
                                fill: 'rgba(0, 255, 2555, 0.9)',
                                stroke: {colour: '#696969', width: 5},
                            },
                        },
                        collision: false,
                        hp: 1,
                        maxHp: 1,
                        isHit: 0,
                        connected: [],
                    },
                ],
            },
        },
        obstacles: {
            obstacle1: {
                type: 'polygon',
                cType: 'ground',
                size: [
                    {x: -500, y: -650},
                    {x: -450, y: -700},
                    {x: 950, y: -700},
                    {x: 1000, y: -650},
                    {x: 1000, y: -450},
                    {x: 950, y: -400},
                    {x: -450, y: -400},
                    {x: -500, y: -450},
                ],
                style: {
                    fill: 'rgba(50, 250, 250, 0.8)',
                    stroke: {colour: 'rgba(45, 225, 225, 0.8)', width: 10},
                },
            },
            obstacle2: {
                type: 'polygon',
                cType: 'ground',
                size: [
                    {x: -500+200, y: 650+200},
                    {x: -450+200, y: 700+200},
                    {x: 950+200, y: 700+200},
                    {x: 1000+200, y: 650+200},
                    {x: 1000+200, y: 450},
                    {x: 950+200, y: 400},
                    {x: -450+200, y: 400},
                    {x: -500+200, y: 450},
                ],
                style: {
                    fill: 'rgba(50, 250, 250, 0.8)',
                    stroke: {colour: 'rgba(45, 225, 225, 0.8)', width: 10},
                },
            },
            obstacle3: {
                type: 'polygon',
                cType: 'tall',
                size: circleToPolygon({x: -800, y: 0}, 250, 6),
                style: {
                    fill: 'rgba(128, 128, 128, 1)',
                    stroke: {colour: 'rgba(115, 115, 115, 1)', width: 10},
                },
            },
            obstacle4: {
                type: 'polygon',
                cType: 'tall',
                size: [
                    {x: 950+500, y: -500},
                    {x: 1000+500, y: -550},
                    {x: 1000+500, y: -1350},
                    {x: 950+500, y: -1400},
                    {x: 50+500, y: -1400},
                    {x: 0+500, y: -1350},
                    {x: 0+500, y: -1250},
                    {x: 50+500, y: -1200},
                    {x: 750+500, y: -1200},
                    {x: 800+500, y: -1150},
                    {x: 800+500, y: -550},
                    {x: 850+500, y: -500},
                ],
                style: {
                    fill: 'rgba(128, 128, 128, 1)',
                    stroke: {colour: 'rgba(115, 115, 115, 1)', width: 10},
                },
            },
            basicWall: {
                type: 'polygon',
                cType: 'tall',
                size: [
                    {x: -500, y: -100},
                    {x: 500, y: -100},
                    {x: 300, y: 100},
                    {x: -300, y: 100},
                ],
                style: {
                    fill: 'rgba(128, 128, 128, 1)',
                    stroke: {colour: 'rgba(115, 115, 115, 1)', width: 10},
                },
                collisionEdges: [0,2],
            },
            basicFiller: {
                type: 'polygon',
                cType: 'tall',
                size: [
                    {x: -200, y: -100},
                    {x: 200, y: -100},
                    {x: 0, y: 100},
                ],
                style: {
                    fill: 'rgba(128, 128, 128, 1)',
                    stroke: {colour: 'rgba(115, 115, 115, 1)', width: 10},
                },
                collisionEdges: [0],
            },
            level2Lake: {
                type: 'polygon',
                cType: 'ground',
                size: [
                    {x: -280, y: 100},
                    {x: 280, y: 100},
                    {x: 300, y: 80},
                    {x: 300, y: -80},
                    {x: 280, y: -100},
                    {x: -280, y: -100},
                    {x: -300, y: -80},
                    {x: -300, y: 80},
                ],
                style: {
                    fill: 'rgba(50, 250, 250, 0.8)',
                    stroke: {colour: 'rgba(45, 225, 225, 0.8)', width: 10},
                },
            },
        },
        parts: {
            empty: {
                id: 'placeholder',
                type: 'circle', 
                facing: 'body',
                rOffset: 0,
                size: 0,
                offset: {x: 0, y: 0},
                style: {
                    fill: 'rgba(0, 0, 0, 0)',
                    stroke: {colour: 'rgba(0, 0, 0, 0)', width: 1},
                },
                collision: false,
                hp: 1,
                maxHp: 1,
                isHit: 0,
                connected: [],
            },
        },
    }
};

var projectiles = [];
var particles = [];
var entities = [];
var obstacles = [];
var explosions = [];

obstacles.push(data.template.obstacles.obstacle1);
obstacles.push(data.template.obstacles.obstacle2);
obstacles.push(data.template.obstacles.obstacle3);
obstacles.push(data.template.obstacles.obstacle4);
let obstacle5 = JSON.parse(JSON.stringify(data.template.obstacles.obstacle4));
obstacle5.cType = 'ground';
obstacle5.style = {
    fill: 'rgba(50, 250, 250, 0.8)',
    stroke: {colour: 'rgba(45, 225, 225, 0.8)', width: 10},
};
obstacle5.size = offsetPoints(rotatePolygon(obstacle5.size, Math.PI/2), {x: 300, y: 500});
obstacles.push(obstacle5);

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
    //mech.directControl = true;
    let lWeapon = JSON.parse(JSON.stringify(data.template.weapons.SpikeLauncher));
    lWeapon.offset.x -= 100;
    mech.parts[1].connected[0].connected = [lWeapon];
    let rWeapon = JSON.parse(JSON.stringify(data.template.weapons.LightMachineGun));
    rWeapon.offset.x += 100;
    mech.parts[1].connected[1].connected = [rWeapon];
    entities.push(JSON.parse(JSON.stringify(mech)));
    tank.x += 1000;
    //tank.directControl = true;
    entities.push(JSON.parse(JSON.stringify(tank)));
    drone.x += 1500;
    //drone.directControl = true;
    entities.push(JSON.parse(JSON.stringify(drone)));
    player.directControl = true;
    
    player = addWeapon(player, 'MediumMachineGun', 'mech', 'leftArmMain');
    //player = addWeapon(player, 'Nuker', 'mech', 'leftArmMain');
    //player = addWeapon(player, 'Blaster', 'mech', 'leftArmMain');
    player = addWeapon(player, 'MediumMachineGun', 'mech', 'rightArmMain');
    player = addWeapon(player, 'Cannon', 'mech', 'leftArmSide');
    player = addWeapon(player, 'Cannon', 'mech', 'rightArmSide');
    player = addWeapon(player, 'GunTurret', 'mech', 'headTurret');
    player = addWeapon(player, 'DualRPG', 'mech', 'back');
    //player = addWeapon(player, 'ShieldProjectorMech', 'mech', 'back');
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
            e.preventDefault();
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

function loadLevel(n) {
    console.log('Startin the game...');
    replacehtml(`<canvas id="main" width="${display.x}" height="${display.y}" style="position: absolute; top: 0; left: 0; z-index: 1;"></canvas><canvas id="canvasOverlay" width="${display.x}" height="${display.y}" style="position: absolute; top: 0; left: 0; z-index: 2;"></canvas>`);
    switch (n) {
        case 1:
            level1({x: 0, y: -900});
            break;
        case 2:
            level2({x: 0, y: -900});
            break;
        case 3:
            level3({x: 0, y: -900});
            break;
        case 4:
            testing();
            break;
        default:
            throw `ERROR: Unknown level ${n}`;
    }
    game();
};

function placeObstacle(objId, r, coords) {
    let obj = JSON.parse(JSON.stringify(data.template.obstacles[objId]));
    obj.size = offsetPoints(rotatePolygon(obj.size, r), coords);
    for (let i = 0; i < obj.size.length; i++) {
        obj.size[i].x = Math.round(obj.size[i].x/10)*10;
        obj.size[i].y = Math.round(obj.size[i].y/10)*10;
    }

    obstacles.push(obj);
    return 0
};

function level1(pos={x: 0, y: 0}, scale=1) {
    const basicWall = 'basicWall';
    const basicFiller = 'basicFiller';

    obstacles = [];
    entities = [];
    projectiles = [];
    explosions = [];
    particles = [];
    
    placeObstacle(basicWall, 0, vMath(vMath({x: 0, y: -600}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2, vMath(vMath({x: 400, y: -200}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2*3, vMath(vMath({x: -400, y: -200}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2, vMath(vMath({x: 400, y: 800}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2*3, vMath(vMath({x: -400, y: 800}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI, vMath(vMath({x: 0, y: 1200}, pos, '+'), scale, '*'));
    placeObstacle(basicFiller, Math.PI/2*3, vMath(vMath({x: 400, y: 300}, pos, '+'), scale, '*'));
    placeObstacle(basicFiller, Math.PI/2, vMath(vMath({x: -400, y: 300}, pos, '+'), scale, '*'));

    player = JSON.parse(JSON.stringify(data.mech));
    player.directControl = true;
    entities.push(player);
    console.log('Loaded level 1');
};

function level2(pos={x: 0, y: 0}, scale=1) {
    const basicWall = 'basicWall';
    const basicFiller = 'basicFiller';

    obstacles = [];
    entities = [];
    projectiles = [];
    explosions = [];
    particles = [];
    
    placeObstacle('level2Lake', 0, vMath(vMath({x: 0, y: 0}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, 0, vMath(vMath({x: 0, y: -600}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2, vMath(vMath({x: 400, y: -200}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2*3, vMath(vMath({x: -400, y: -200}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2, vMath(vMath({x: 400, y: 800}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2*3, vMath(vMath({x: -400, y: 800}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI, vMath(vMath({x: 0, y: 1200}, pos, '+'), scale, '*'));
    placeObstacle(basicFiller, Math.PI/2*3, vMath(vMath({x: 400, y: 300}, pos, '+'), scale, '*'));
    placeObstacle(basicFiller, Math.PI/2, vMath(vMath({x: -400, y: 300}, pos, '+'), scale, '*'));

    player = JSON.parse(JSON.stringify(data.mech));
    let enemy = JSON.parse(JSON.stringify(data.mech));
    player.directControl = true;
    player = addWeapon(player, 'MediumMachineGun', 'mech', 'rightArmMain');
    enemy = addWeapon(enemy, 'MediumMachineGun', 'mech', 'leftArmMain');
    enemy = addWeapon(enemy, 'MediumMachineGun', 'mech', 'rightArmMain');
    enemy.aimPos = {x: enemy.x, y: enemy.y + 200};
    enemy.x = (0 + pos.x) * scale;
    enemy.y = (-300 + pos.y) * scale;
    entities.push(player);
    entities.push(enemy);
    console.log('Loaded level 2');
};

function level3(pos={x: 0, y: 0}, scale=1) {
    const basicWall = 'basicWall';
    const basicFiller = 'basicFiller';

    obstacles = [];
    projectiles = [];
    explosions = [];
    particles = [];
    entities = [];

    placeObstacle(basicWall, 0, vMath(vMath({x: 0, y: -600}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2, vMath(vMath({x: 400, y: -200}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2*3, vMath(vMath({x: -400, y: -200}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2, vMath(vMath({x: 400, y: 800}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI/2*3, vMath(vMath({x: -400, y: 800}, pos, '+'), scale, '*'));
    placeObstacle(basicWall, Math.PI, vMath(vMath({x: 0, y: 1200}, pos, '+'), scale, '*'));
    placeObstacle(basicFiller, Math.PI/2*3, vMath(vMath({x: 400, y: 300}, pos, '+'), scale, '*'));
    placeObstacle(basicFiller, Math.PI/2, vMath(vMath({x: -400, y: 300}, pos, '+'), scale, '*'));

    player = JSON.parse(JSON.stringify(data.mech));
    let enemy1 = JSON.parse(JSON.stringify(data.tank));
    player.directControl = true;
    player = addWeapon(player, 'RPG', 'mech', 'back');
    player = addWeapon(player, 'MediumMachineGun', 'mech', 'rightArmMain');
    enemy1.aimPos = {x: enemy1.x, y: enemy1.y + 200};
    enemy1.x = (0 + pos.x) * scale;
    enemy1.y = (-300 + pos.y) * scale;
    enemy1.r = Math.PI/2;
    let enemy2 = JSON.parse(JSON.stringify(data.mech));
    player.directControl = true;
    enemy2.aimPos = {x: enemy2.x, y: enemy2.y + 200};
    enemy2.x = (0 + pos.x) * scale;
    enemy2.y = (100 + pos.y) * scale;
    enemy2.r = Math.PI/2;
    entities.push(player);
    entities.push(enemy1);
    entities.push(enemy2);
    console.log('Loaded level 3');
};

function testing() {
    obstacles = [];
    entities = [];
    projectiles = [];
    explosions = [];
    particles = [];

    player = JSON.parse(JSON.stringify(data.tank));
    let enemy1 = JSON.parse(JSON.stringify(data.tank));
    player.directControl = true;
    player = addWeapon(player, 'RPG', 'tank', 'main');
    player = addWeapon(player, 'Cannon', 'tank', 'rightSide');
    player = addWeapon(player, 'Cannon', 'tank', 'leftSide');
    entities.push(player);
    entities.push(enemy1);
    console.log('Loaded testing area');
};

function recursiveAddParts(unit, parts, weapon) {
    for (let i = 0; i < parts.length; i++) {
        if (parts[i].id == weapon.id) {
            parts[i] = weapon;
        }
        parts[i].connected = recursiveAddParts(unit, parts[i].connected, weapon);
    }
    return parts;
};

function recursiveOffset(parts, offset) {
    for (let i = 0; i < parts.length; i++) {
        parts[i].offset = vMath(parts[i].offset, offset, '+');
        parts[i].connected = recursiveOffset(parts[i].connected, offset);
    }
    return parts;
};

function recursiveInvert(parts) {
    for (let i = 0; i < parts.length; i++) {
        parts[i].offset.x *= -1
        parts[i].rOffset *= -1;
        if (parts[i].type == 'polygon') {
            for (let j = 0; j < parts[i].size.length; j++) {
                parts[i].size[j].x *= -1;
            }
        }
        parts[i].connected = recursiveInvert(parts[i].connected);
    }
    return parts;
};

function recursiveModify(parts, facing=undefined, keybind=undefined) {
    for (let i = 0; i < parts.length; i++) {
        if (facing) {
            parts[i].facing = facing;
        }
        if (keybind) {
            if (parts[i].cannon) {
                parts[i].cannon.keybind = keybind;
            }
        }
        parts[i].connected = recursiveModify(parts[i].connected);
    }
    return parts;
}

function addWeapon(unit, weaponID, unitType, slot, keybind='click') {
    let weapon = JSON.parse(JSON.stringify(data.template.weapons[weaponID]));
    let offset = {x: 0, y: 0};
    let invert = false;
    let facing = 'turret';
    switch (unitType) {
        case 'mech':
            switch (slot) {
                case 'rightArmMain':
                    invert = true;
                case 'leftArmMain':
                    offset = vMath(offset, {x: -100, y: 0}, '+');
                    break;
                case 'rightArmSide':
                    invert = true;
                case 'leftArmSide':
                    weapon = JSON.parse(JSON.stringify(data.template.weapons[weaponID+'SideMounted']));
                    offset = vMath(offset, {x: -150, y: 0}, '+');
                    break;
                case 'headTurret':
                    break;
                case 'back':
                    offset = vMath(offset, {x: 0, y: 20}, '+');
                    break;
                default:
                    throw `tf is this slot type! ${slot[0]}`;
            }
            break;
        case 'tank':
            switch (slot) {
                case 'main':
                    offset = vMath(offset, {x: 0, y: -150}, '+');
                    if (weaponID == 'RPG') {
                        offset = vMath(offset, {x: -40, y: 0}, '+');
                    }
                    break;
                case 'rightSide':
                    invert = true;
                case 'leftSide':
                    weapon = JSON.parse(JSON.stringify(data.template.weapons[weaponID+'SideMounted']));
                    offset = vMath(offset, {x: -140, y: -0}, '+');
                    facing = 'body';
                    break;
                default:
                    throw `tf is this slot type! ${slot[0]}`;
            }
            break;
        default:
            throw `ERROR: Unsupported unit type for weapon assignment: ${unitType}!`;
    }
    weapon.facing = facing;
    weapon.keybind = keybind;
    weapon.connected = recursiveModify(weapon.connected, facing, keybind);
    weapon.offset = vMath(weapon.offset, offset, '+');
    weapon.connected = recursiveOffset(weapon.connected, offset);
    weapon.id = slot;
    if (invert) {
        weapon.offset.x *= -1
        if (weapon.type == 'polygon') {
            for (let i = 0; i < weapon.size.length; i++) {
                weapon.size[i].x *= -1;
            }
        }
        weapon.rOffset *= -1;
        weapon.connected = recursiveInvert(weapon.connected);
    }
    unit.parts = recursiveAddParts(unit, unit.parts, weapon);
    //console.log(unit);
    return unit;
};

function handlePlayerMotion(unit, obstacles) {
    //console.log(unit.keyboard);
    if (unit.directControl) {
        unit.aimPos = mousepos;
    } else {
        if (unit.keyboard.aimPos) {
            unit.aimPos = unit.keyboard.aimPos;
        }
    }
    unit.mouseR = rotateAngle(unit.mouseR, aim(vMath(vMath(vMath(display,0.5,'multiply'),player,'subtract'),unit,'add'), vMath(vMath(unit.aimPos,player,'subtract'),unit,'add')), unit.tr);
    unit.lastMoved += 1;
    unit.r = correctAngle(unit.r);
    unit.mouseR = correctAngle(unit.mouseR);
    switch (unit.type) {
        case 'mech':
            unit.vx = 0;
            unit.vy = 0;
            let mechSpeed = unit.v;
            if (unit.keyboard.capslock) {
                mechSpeed *= 1.2;
            }
            if (unit.keyboard.shift) {
                mechSpeed *= 1.2;
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
            //console.log('before', unit.r);
            if (mechIsMoving) {
                if (unit.lastMoved >= 20) {
                    unit.r = aim({x:0, y: 0}, mechVector);
                } else {
                    unit.r = rotateAngle(unit.r, aim({x:0, y: 0}, mechVector), unit.vr);
                }
                unit.r = correctAngle(unit.r);
                let mechVelocity = toComponent(mechSpeed, unit.r);
                unit.x += mechVelocity.x;
                unit.y += mechVelocity.y;
                unit.vx = mechVelocity.x;
                unit.vy = mechVelocity.y;
                unit.lastMoved = -1;
                /* // Old unrealistic collision (use if new version doesn't work)
                if (handleGroundCollisions(unit, obstacles)) {
                    unit.x -= mechVelocity.x;
                    unit.y -= mechVelocity.y;
                    unit.vx = 0;
                    unit.vy = 0;
                }*/
                let res = handleGroundCollisions(unit, obstacles, true, mechVelocity);
                if (res) {
                    unit.x -= mechVelocity.x;
                    unit.y -= mechVelocity.y;
                    if (res != 'well, shit') {
                        let mechWallVector = {x: res.end.x - res.start.x, y: res.end.y - res.start.y};
                        let mechSlideVector = vMath(vMath(mechVelocity, mechWallVector, 'projection'), 0.75, 'multiply');
                        unit.x += mechSlideVector.x;
                        unit.y += mechSlideVector.y;
                        unit.vx = mechSlideVector.x;
                        unit.vy = mechSlideVector.y;
                    }
                }
            }
            //console.log('after', unit.r);
            return unit;
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
            if (handleGroundCollisions(unit, obstacles)) {
                unit.x -= tankVelocity.x;
                unit.y -= tankVelocity.y;
                unit.vx = 0;
                unit.vy = 0;
            }
            return unit;
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
            if (handleGroundCollisions(unit, obstacles)) {
                unit.x -= unit.vx;
                unit.y -= unit.vy;
                unit.vx = 0;
                unit.vy = 0;
            }
            unit.vx *= 0.995;
            unit.vy *= 0.995;
            return unit;
        default:
            throw 'ERROR: are you f*king retarded? Tf is that unit type?';

    };
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

function lineCollision(l1, l2) { // dis do be broken tho...
    console.log('START######################################################');
    console.log(l1,l2);
    let l1Data = {min: {x: Math.min(l1.start.x, l1.end.x), y: Math.min(l1.start.y, l1.end.y)}, max: {x: Math.max(l1.start.x, l1.end.x), y: Math.max(l1.start.y, l1.end.y)}};
    let l2Data = {min: {x: Math.min(l2.start.x, l1.end.x), y: Math.min(l2.start.y, l2.end.y)}, max: {x: Math.max(l2.start.x, l2.end.x), y: Math.max(l2.start.y, l2.end.y)}};
    if (l1Data.max.x >= l2Data.min.x || l2Data.max.x >= l1Data.min.x) {
        console.log('pass1');
        if (l1Data.max.y >= l2Data.min.y || l2Data.max.y >= l1Data.min.y) {
            console.log('pass2');
            if (Math.round(l1.start.x*100) == Math.round(l1.end.x*100) || Math.round(l2.start.x*100) == Math.round(l2.end.x*100)) { // vertical lines
                console.log('vertical lines recognised');
                if (Math.round(l1.start.x*100) == Math.round(l1.end.x*100) && Math.round(l2.start.x*100) == Math.round(l2.end.x*100)) {
                    console.log('both');
                    if (Math.round(l1.start.x*100) == Math.round(l2.start.x*100)) {
                        return true;
                    }
                    console.log('v parallel');
                    return false;
                }
                if (Math.round(l1.start.x*100) == Math.round(l1.end.x*100)) {
                    console.log('l1');
                    if (l2.end.x <= l1.end.x && l2.start.x >= l1.end.x) {
                        return true;
                    }
                    console.log('v no intersect');
                    return false;
                } else {
                    console.log('l2');
                    if (l1.end.x <= l2.end.x && l1.start.x >= l2.end.x) {
                        return true;
                    }
                    console.log('v no intersect');
                    return false;
                }
            }
            let l1Grad = (l1.start.y - l1.end.y) / (l1.start.x - l1.end.x);
            let l2Grad = (l2.start.y - l2.end.y) / (l2.start.x - l2.end.x);
            let l1Intercept = l1.end.y - l1Grad * l1.end.x;
            let l2Intercept = l2.end.y - l2Grad * l2.end.x;
            if (Math.round(l1Grad*100) == Math.round(l2Grad*100) && Math.round(l1Intercept*100) == Math.round(l2Intercept*100)) {
                console.log('parallel');
                return false;
            }
            let intersection = {x: (l2Intercept - l1Intercept) / (l1Grad - l2Grad), y: l1Grad * (l2Intercept - l1Intercept) / (l1Grad - l2Grad) + l1Intercept};
            console.log(intersection);
            if (
                ((l1.end.x <= intersection.x && l1.start.x >= intersection.x) || (l1.start.x <= intersection.x && l1.end.x >= intersection.x)) &&
                ((l2.end.x <= intersection.x && l2.start.x >= intersection.x) || (l2.start.x <= intersection.x && l2.end.x >= intersection.x)) &&
                ((l1.end.y <= intersection.y && l1.start.y >= intersection.y) || (l1.start.y <= intersection.y && l1.end.y >= intersection.y)) &&
                ((l2.end.y <= intersection.y && l2.start.y >= intersection.y) || (l2.start.y <= intersection.y && l2.end.x >= intersection.y))
            ) {
                return true;
            } else {
                console.log('no collision');
                return false;
            }
        }
    }
    console.log('ignore');
    return false;
};

function polygonCircleIntersect(polygon, circle, round=false, collisionEdges) {
    for (let i = 0; i < polygon.length; i++) {
        if (collisionEdges) {
            if (isin(i, collisionEdges) == false) {
                continue;
            }
        }
        let l1 = {start: polygon[i], end: i == polygon.length-1 ? polygon[0] : polygon[i+1]};
        if (round) {
            l1.start.x = Math.round(l1.start.x);
            l1.start.y = Math.round(l1.start.y);
            l1.end.x = Math.round(l1.end.x);
            l1.end.y = Math.round(l1.end.y);
            circle.x = Math.round(circle.x);
            circle.y = Math.round(circle.y);
        }
        if (lineCircleIntersectV2(l1, circle)) {
            return l1;
        }
    }
    return false;
};

function lineCircleIntersectV2(line, circle) { // HAIL OUR AI OVERLORDS
    //console.log(line, circle);
    // Calculate the direction vector of the line
    const dx = line.end.x - line.start.x;
    const dy = line.end.y - line.start.y;

    // Calculate the vector from the circle's center to the line's start point
    const cx = circle.x - line.start.x;
    const cy = circle.y - line.start.y;

    // Calculate the dot product of the line direction vector and the circle-to-start vector
    const dotProduct = cx * dx + cy * dy;

    // Calculate the squared length of the line
    const lineLengthSq = dx * dx + dy * dy;

    // Calculate the closest point on the line to the circle's center
    let closestX, closestY;

    if (lineLengthSq === 0) {
        // If the line is just a point, set the closest point to be the line's start point
        closestX = line.start.x;
        closestY = line.start.y;
    } else {
        const t = Math.max(0, Math.min(1, dotProduct / lineLengthSq));
        closestX = line.start.x + t * dx;
        closestY = line.start.y + t * dy;
    }

    // Calculate the distance between the closest point and the circle's center
    const distance = Math.sqrt((closestX - circle.x) ** 2 + (closestY - circle.y) ** 2);

    // Check if the distance is less than or equal to the circle's radius
    return distance <= circle.r;
}

function polyCollisionAdv(polygon1, polygon2) { // dis also do be broken...
    for (let i = 0; i < polygon1.length; i++) {
        let l1 = {start: polygon1[i], end: i == polygon1.length-1 ? polygon1[0] : polygon1[i+1]};
        for (let j = 0; j < polygon2.length; j++) {
            let l2 = {start: polygon2[j], end: j == polygon2.length-1 ? polygon2[0] : polygon2[j+1]};
            if (lineCollision(l1, l2)) {
                return true;
            }
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
        let stroke = JSON.parse(JSON.stringify(part.style.stroke));
        if (part.hp != part.maxHp) {
            if (part.hp > part.maxHp) {
                stroke.colour = 'rgba(0,255,255,1)';
            } else {
                // hp colours modeled by https://www.desmos.com/calculator/icqpr5wi1k
                //let change = Math.round(2950/(0.25*(1-part.hp/part.maxHp)*255+10)-40); 
                //let change = (255/Math.log(255)) * Math.log(-(1-part.hp/part.maxHp)*255+255);
                let change = -0.004 * ((1-part.hp/part.maxHp)*255)**2 + 255;
                //console.log(change);
                stroke.colour = `rgba(${255-change},${change},0,1)`;
                //let change = Math.round(255*(1-part.hp/part.maxHp));
                //stroke.colour = `rgba(${change},${255-change},0,1)`;
            }
        }
        drawPolygon(np, {x: unit.x, y: unit.y}, facing, part.style.fill, stroke, false);
        if (part.hp > part.maxHp) {
            stroke.width += 10;
            stroke.colour = 'rgba(0,255,255,0.3)';
            drawPolygon(np, {x: unit.x, y: unit.y}, facing, 'rgba(0,255,255,0.2)', stroke, false);
        }
    } else {
        let facing = unit.r;
        if (part.facing == 'turret') {
            facing = unit.mouseR;
        }
        let stroke = JSON.parse(JSON.stringify(part.style.stroke));
        if (part.hp != part.maxHp) {
            if (part.hp > part.maxHp) {
                stroke.colour = 'rgba(0,255,255,1)';
            } else {
                let change = -0.004 * ((1-part.hp/part.maxHp)*255)**2 + 255;
                stroke.colour = `rgba(${255-change},${change},0,1)`;
            }
        }
        let offset = rotatePolygon([part.offset], facing)[0];
        drawCircle(display.x/2 - player.x + unit.x + offset.x, display.y/2 - player.y + unit.y + offset.y, part.size, part.style.fill, stroke.colour, stroke.width, 1);
        if (part.hp > part.maxHp) {
            stroke.width += 10;
            stroke.colour = 'rgba(0,255,255,0.3)';
            drawCircle(display.x/2 - player.x + unit.x + offset.x, display.y/2 - player.y + unit.y + offset.y, part.size, 'rgba(0,255,255,0.3)', stroke.colour, stroke.width, 1);
        }
    }
    return part;
};

function renderUnit(unit) {
    unit.parts = recursiveParts(unit, unit.parts, renderPart);
    if (unit.collisionR > 0 && false) {
        drawCircle(display.x/2 - player.x + unit.x, display.y/2 - player.y + unit.y, unit.collisionR, 'rgba(255, 255, 255, 0.1)', 'rgba(255, 0, 0, 0.9)', 5, 1);
    }
    if (unit.groundCollisionR > 0) {
        drawCircle(display.x/2 - player.x + unit.x, display.y/2 - player.y + unit.y, unit.groundCollisionR, 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.1)', 5, 1);
    }
    if (unit.tallCollisionR > 0) {
        drawCircle(display.x/2 - player.x + unit.x, display.y/2 - player.y + unit.y, unit.tallCollisionR, 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.1)', 5, 1);
    }
};

function shoot(unit, part) {
    if (part.cannon) {
        if (part.cannon.reload.c > 0) {
            part.cannon.reload.c -= 1;
        } else {
            if (!part.cannon.delay || part.cannon.delay.c <= 0) {
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
                    if (bullet.accel) {
                        bullet.vx -= unit.vx;
                        bullet.vy -= unit.vy;
                    }
                    bullet.r = facing + part.rOffset;
                    /*
                    bullet.vr = part.cannon.bullet.vr;
                    bullet.rDrag = part.cannon.bullet.rDrag;*/
                    projectiles.push(bullet);
                }
            }
            if (part.cannon.delay) {
                if (unit.keyboard[part.cannon.keybind]) {
                    part.cannon.delay.c -= 1;
                } else {
                    part.cannon.delay.c = part.cannon.delay.t;
                }
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
                        //drawCircle(display.x/2 - player.x + obj.x, display.y/2 - player.y + obj.y, 5, 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 1)', 2, 1);
                        if (pointInPolygon(obj, points)) {
                            collide = true;
                        }
                        break;
                    case 'circle':
                        let r = 0;
                        if (obj.size) {
                            r = obj.size;
                        } else if (obj.r) {
                            r = obj.r;
                        } else {
                            console.warn('WARNING: can\'t find radius!');
                        }
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
                    case 'line': // TODO: make it actual line collision (currently many point collisions)
                        let s = offsetPoints(rotatePolygon([JSON.parse(JSON.stringify(obj.cSize.start)), JSON.parse(JSON.stringify(obj.cSize.end))], obj.r), obj);
                        let segment = {start: s[0], end: s[1]};
                        let diff = vMath(segment.end, segment.start, '-');
                        for (let i = 0.1; i < 1; i += 0.2) {
                            let point = vMath(JSON.parse(JSON.stringify(segment.start)), vMath(JSON.parse(JSON.stringify(diff)), i, '*'), '+');
                            //drawCircle(display.x/2 - player.x + point.x, display.y/2 - player.y + point.y, 5, 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 1)', 2, 1);
                            //drawPolygon(points, {x: 0, y: 0}, 0, 'rgba(0, 0, 0, 1)', 'rgba(0, 0, 0, 1)', false, true);
                            if (pointInPolygon(point, points)) {
                                collide = true;
                                break;
                            } 
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
                    case 'line':
                        let s = offsetPoints(rotatePolygon([JSON.parse(JSON.stringify(obj.cSize.start)), JSON.parse(JSON.stringify(obj.cSize.end))], obj.r), obj);
                        let segment = {start: s[0], end: s[1]};
                        if (lineCircleIntersectV2(segment, {x: unit.x, y: unit.y, r: unit.size})) {
                            collide = true;
                        }
                        break;
                    default:
                        throw `ERROR: wtf is this object type2! ${cType}`;
                }
            }
            if (collide) {
                pts[i].hp -= obj.dmg;
                console.log(pts[i].id, pts[i].hp);
                pts[i].isHit=5;
                if (obj.explosion) {
                    obj.explosion.x = obj.x;
                    obj.explosion.y = obj.y;
                    obj.explosion.transparancy = 1;
                    obj.explosion.active = true;
                    obj.explosion.type = 'circle';
                    obj.explosion.isExplosion = true;
                    explosions.push(obj.explosion);
                } 
                if (!obj.isExplosion || !obj.active) {
                    obj.dmg = 0; // have to do this to stop it hitting multiple pts (this is inefficient but hard to fix. maybe rework this to not use recursion? bfs?)
                    return [pts, obj];
                }
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

function handleBulletWallCollisions(obstacles, projectiles) {
    let newProj = [];
    if (projectiles.length && obstacles.length) {
        for (let i = 0; i < projectiles.length; i++) {
            let noHit = true;
            for (let j = 0; j < obstacles.length; j++) {
                if (obstacles[j].cType == 'tall') {
                    if (pointInPolygon(projectiles[i], obstacles[j].size)) {
                        noHit = false;
                        break;
                    }
                }
            }
            if (noHit) {
                newProj.push(projectiles[i]);
            }
        }
        return newProj;
    }
    return projectiles;
};

function obstacleCollision(unit, obstacle) {
    let collisionR = 0;
    if (obstacle.cType == 'ground') {
        if (unit.groundCollisionR <= 0) {
            return false;
        }
        collisionR = unit.groundCollisionR;
    } else {
        collisionR = unit.tallCollisionR;
    }
    //let notCircle = circleToPolygon(unit, collisionR, 12); // a dodecagon is close enough to a circle
    //return polygonCollision(notCircle, obstacle.size);
    //return polyCollisionAdv(notCircle, obstacle.size);
    return polygonCircleIntersect(obstacle.size, {x: unit.x, y: unit.y, r: collisionR}, true, obstacle.collisionEdges);
};

function handleGroundCollisions(u, obstacles, smort=false, prevMotion=null) {
    let unit = JSON.parse(JSON.stringify(u));
    // If man somehow collides with multiple obstacles at once, I will end myself
    let hasCollided = false;
    for (let i = 0; i < obstacles.length; i++) {
        let obstacle = obstacles[i];
        let res = obstacleCollision(unit, obstacle);
        if (res) {
            hasCollided = true;
            let thisVectorWorks = true;
            if (smort) { // f*ck optimisation, if it works it works
                unit.x -= prevMotion.x;
                unit.y -= prevMotion.y;
                let mechWallVector = {x: res.end.x - res.start.x, y: res.end.y - res.start.y};
                let mechSlideVector = vMath(vMath(prevMotion, mechWallVector, 'projection'), 0.75, 'multiply');
                unit.x += mechSlideVector.x;
                unit.y += mechSlideVector.y;
                unit.vx = mechSlideVector.x;
                unit.vy = mechSlideVector.y;
                for (let j = 0; j < obstacles.length; j++) {
                    if (obstacleCollision(unit, obstacles[j])) {
                        thisVectorWorks = false;
                        break;
                    }
                }
            }
            if (thisVectorWorks) {
                return res;
            }
        }
    }
    if (hasCollided) {
        return 'well, shit'; // this just means a suitable vector was not found and the unit is rooted in place as a last resort
    }
    return false; 
};

function checkDeadParts(unit, parts) {
    //console.log(unit, parts);
    if (parts) {
        let newParts = [];
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].hp > 0) {
                parts[i].connected = checkDeadParts(unit, parts[i].connected);
                newParts.push(parts[i]);
            } else {
                if (parts[i].core) {
                    unit.alive = false;
                }
            }
        }
        //console.log(newParts);
        return newParts;
    }
    return [];
};

function detectCollision(unit, part, obj) { // UNFINISHED, shields were ababdoned due to self collision issues.
    let cType = '';
    if (obj.cType) {
        cType = obj.cType;
    } else {
        cType = obj.type;
    }
    let psize = 0;
    if (part.size) {
        psize = part.size;
    } else if (part.r) {
        psize = part.r;
    } else {
        console.warn('WARNING: Can\'t find radius!');
    }
    switch (cType) {
        case 'point':
            if (getDist(vMath(JSON.parse(JSON.stringify(part.offset)), unit, 'add'), obj) <= psize) {
                return true;
            }
            break;
        case 'circle':
            let r = obj.size;
            if (getDist(vMath(JSON.parse(JSON.stringify(part.offset)), unit, 'add'), obj) <= psize + r) {
                return true;
            }
            break;
        case 'polygon':
            let notCircle = circleToPolygon(part, psize, 10); // a decagon is close enough to a circle
            if (polygonCollision(notCircle, obj.size)) {
                return true;
            }
            break;
        case 'line':
            let s = offsetPoints(rotatePolygon([JSON.parse(JSON.stringify(obj.cSize.start)), JSON.parse(JSON.stringify(obj.cSize.end))], obj.r), obj);
            let segment = {start: s[0], end: s[1]};
            if (lineCircleIntersectV2(segment, {x: unit.x, y: unit.y, r: unit.size})) {
                return true;
            }
            break;
        default:
            throw `ERROR: wtf is this object type2! ${cType}`;
    }
    return false;
}

function handleShields(unit, parts, projectiles, explosions) { // UNFINISHED, shields were ababdoned due to self collision issues.
    //console.log(unit, parts);
    if (parts) {
        for (let i = 0; i < parts.length; i++) {
            if (parts[i].shield) {
                if (parts[i].shield.active) {
                    // center the shield around the unit
                    parts[i].shield.x = unit.x;
                    parts[i].shield.y = unit.y;
                    for (let j = 0; j < projectiles.length; j++) {
                        if (detectCollision(unit, parts[i], projectiles[j])) {
                            parts[i].shield.hp -= projectiles[j].dmg;
                            if (parts[i].shield.hp <= 0) {
                                parts[i].shield.hp = 0;
                                parts[i].shield.active = false;
                            }
                            projectiles[j].dmg = 0;
                        }
                    }
                    for (let j = 0; j < explosions.length; j++) {
                        if (detectCollision(unit, parts[i], explosions[j])) {
                            parts[i].shield.hp -= explosions[j].dmg;
                            if (parts[i].shield.hp <= 0) {
                                parts[i].shield.hp = 0;
                                parts[i].shield.active = false;
                            }
                        }
                    }
                }
                parts[i].shield.hp += parts[i].shield.regen;
                if (parts[i].shield.hp > parts[i].shield.cap) {
                    parts[i].shield.hp = parts[i].shield.cap;
                }
                
            } 
            parts[i].connected = handleShields(unit, parts[i].connected);
        }
        return newParts;
    }
    return [];
};

function main() {
    // draw the background
    clearCanvas('main');
    clearCanvas('canvasOverlay');
    grid(500);

    // Render ground obstacles
    for (let i = 0; i < obstacles.length; i++) {
        if (obstacles[i].cType == 'ground') {
            //console.log(obstacles[i]);
            drawPolygon(obstacles[i].size, {x: 0, y: 0}, 0, obstacles[i].style.fill, obstacles[i].style.stroke, false);
        }
    }

    // Process entities
    let newEntities = [];
    for (let i = 0; i < entities.length; i++) {
        entities[i].parts = checkDeadParts(entities[i], entities[i].parts);
        entities[i] = handlePlayerMotion(entities[i], obstacles);
        entities[i] = handleShooting(entities[i]);
        if (entities[i].alive) {
            newEntities.push(entities[i]);
        }
    }
    entities = newEntities;
    // Process Projectiles
    renderParticles(projectiles);
    projectiles = simulatePhysics(projectiles);
    projectiles = handleDecay(projectiles);
    // Render Entities
    for (let i = 0; i < entities.length; i++) {
        renderUnit(entities[i]);
    }

    // Handle Collisions
    projectiles = handleBulletWallCollisions(obstacles, projectiles);
    let res = handleCollisions(entities, projectiles);
    entities = res[0];
    projectiles = res[1];

    res = handleCollisions(entities, explosions);
    entities = res[0];

    // Render Shields

    // Render Tall obstacles
    for (let i = 0; i < obstacles.length; i++) {
        if (obstacles[i].cType == 'tall') {
            //console.log(obstacles[i]);
            drawPolygon(obstacles[i].size, {x: 0, y: 0}, 0, obstacles[i].style.fill, obstacles[i].style.stroke, false);
        }
    }

    // Handle explosions
    let newExpl = [];
    for (let i = 0; i < explosions.length; i++) {
        let res = handleExplosion(explosions[i]);
        if (res) {
            newExpl.push(res);
        }
    }
    explosions = newExpl;
};

var t=0;
async function game() {
    while (1) {
        main();
        await sleep(1000/60);
        t++;
    }
};

// #1220DE

