######
# dump information of arXiv research papers in json format for the given keyword (first 2k search results)
####

import xmltodict
import requests
import json
import time
import re

def cleanSpaces(s):
    s = s.replace('\n', ' ')
    s = re.sub(r'\s\s+', ' ', s)
    return s

def createPaper(paper):
    for field in ['author', 'category']:
        if type(paper[field]) is not list:
            paper[field] = [paper[field]]
    isCsPaper = False
    allCategories = []
    for category in paper['category']:
        allCategories.append(category['@term'])
        if category['@term'].startswith('cs.'):
            isCsPaper = True
    if isCsPaper:
        return {
            'title': cleanSpaces(paper['title']),
            'author': [author['name'] for author in paper['author']],
            'abstract': cleanSpaces(paper['summary']),
            'lastUpdated': paper['updated'],
            'category': allCategories,
            'url': paper['id']
        }
    else:
        return None

if __name__ == "__main__":
    url = 'http://export.arxiv.org/api/query'

    keyword = input("Enter the keyword to search papers: ")
    queryParams = {
        'search_query': f'all:"{keyword}"',
        'start': 0,
        'max_results': 500
    }

    outLs = []
    batch = 1
    while batch <= 100:
        try:
            resp = requests.get(url, params=queryParams)
            resp = xmltodict.parse(resp.text)
            resp = resp['feed']
            if 'entry' in resp:
                curBatch = []
                for paper in resp['entry']:
                    paper = createPaper(paper)
                    if paper is not None:
                        curBatch.append(paper)
                outLs.extend(curBatch)
                print(f"Batch-{batch}: Added {len(curBatch)} CS papers")
            else:
                break
        except Exception as ex:
            print(f"Error while processing batch-{batch}: {ex}")
        batch += 1
        queryParams['start'] += 500
        time.sleep(0.5)
    print(f"Total CS papers matching '{keyword}':", len(outLs))
    try:
        with open(f'{keyword}.json', mode='w', encoding='utf-8') as jsonFile:
            json.dump(outLs, jsonFile, indent=2, ensure_ascii=False)
            print("Successfully created the json dump file !")
    except Exception as ex:
        print(f"Error while creating json dump file: {ex}")
