import json
import random

years = ['06-18-2023','06-29-2022','08-03-2019','08-24-2018','09-05-2017','09-17-2016']
for i in range(1,7):
    with open(f'./registrations/registrations{i}.json','r') as f:
        users = json.load(f)
        print(len(users))



# with open('./registrations/registrations6.json','w') as f:
#     json.dump(registrations,f,indent=4)
