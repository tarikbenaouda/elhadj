import json
import random

with open('registrations/users.json','r') as f:
    data2 = json.load(f)
quota = {"Sidi Bel-Abbes":60,"Ain Thrid":45,"Telagh":35,"Relizane":57,"Yellel":36,"Oued-Rhiou":41}
for i in range(1,7):
    with open(f'registrations/registrations{i}.json','r') as f:
        data = json.load(f)

    users = {"Sidi Bel-Abbes":[],"Ain Thrid":[],"Telagh":[],"Relizane":[],"Yellel":[],"Oued-Rhiou":[]}
    selected = []
    for reg in data:
        if reg['selected'] == True:
            del reg['selected']
            selected.append(reg)

    for user in selected:
        for u in data2:
            if u['nationalNumber'] == user['nationalNumber']:
                user['commune'] = u['commune']
                break
    for user in selected:
        users[user['commune']].append(user)
    for commune in users:
        random.shuffle(users[commune])
        users[commune] = users[commune][:quota[commune]]
    all = []
    for commune in users:
        all += users[commune]
    random.shuffle(all)
    with open(f'registrations/hadj{i}.json','w') as f:
        print(len(all))
        json.dump(all,f,indent=4)