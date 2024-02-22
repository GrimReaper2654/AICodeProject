orders = []

target = None
minDist = 9999999
minR = 9999999
for i in range(1, len(entities)):
    dist = getDist(unit, entities[i])
    r = aim(unit, entities[i])
    if dist < minDist or (dist < 475 and abs(r - unit.r) < minR):
        target = entities[i]
        minDist = dist
        minR = r

if not target:
    target = checkpoint

xdist = target.x - unit.x
ydist = target.y - unit.y

if xdist > 150:
    orders.append({'id': 'd', 'value': True})
    orders.append({'id': 'a', 'value': False})
elif xdist < -150:
    orders.append({'id': 'a', 'value': True})
    orders.append({'id': 'd', 'value': False})
else:
    orders.append({'id': 'a', 'value': False})
    orders.append({'id': 'd', 'value': False})

if ydist > 150:
    orders.append({'id': 's', 'value': True})
    orders.append({'id': 'w', 'value': False})
elif ydist < -150:
    orders.append({'id': 'w', 'value': True})
    orders.append({'id': 's', 'value': False})
else:
    orders.append({'id': 'w', 'value': False})
    orders.append({'id': 's', 'value': False})

dist = getDist(unit, target)

offset = toPol(100, 0)
offset.r += aim(unit, {'x': target.x, 'y': target.y})
offset = toComponent(offset.m, offset.r)
newpos = vMath(unit, offset, '+')
aimr = aim(newpos, {'x': target.x, 'y': target.y})

orders.append({'id': 'aim', 'value': vMath(vMath(unit, toComponent(dist, aimr), '+'), {'x': randint(0,10)-5, 'y': randint(0,10)-5}, '+')})
if dist < 600:
    orders.append({'id': 'click', 'value': True})
else:
    orders.append({'id': 'click', 'value': False})

return orders