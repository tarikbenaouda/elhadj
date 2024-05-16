import json


with open('./data/posts/algeria_postcodes.json') as f:
    posts = json.load(f)

print(posts)