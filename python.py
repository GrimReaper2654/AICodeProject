entities = []
newEntities = []
for i in range(len(entities)):
    #print(entities[i])
    entities[i].parts = checkDeadParts(entities[i], entities[i].parts)
    entities[i] = handleScript(entities[i])
    entities[i] = handlePlayerMotion(entities[i], obstacles)
    entities[i] = handleShooting(entities[i])
    if entities[i]['alive']:
        newEntities.push(entities[i])
    
entities = newEntities

