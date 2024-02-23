orders = []
target = entities[0]
orders.append({'id': 'aim', 'value': {'x': target.x, 'y': target.y}})
orders.append({'id': 'click', 'value': True})
nr = adjustAngle(correctAngle(aim(unit, target) - unit.r))
if abs(nr) > math.pi/48:
    if nr > 0:
        orders.append({'id': 'd', 'value': True})
        orders.append({'id': 'a', 'value': False})
    else:
        orders.append({'id': 'a', 'value': True})
        orders.append({'id': 'd', 'value': False})
dist = getDist(unit, target)
if abs(nr) < math.pi/6 and dist > 750:
    orders.append({'id': 'w', 'value': True})
    orders.append({'id': 's', 'value': False})
if dist < 500:
    orders.append({'id': 's', 'value': True})
    orders.append({'id': 'w', 'value': False})
return orders