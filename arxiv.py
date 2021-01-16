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
    return {
        'title': cleanSpaces(paper['title']),
        'author': [author['name'] for author in paper['author']],
        'abstract': cleanSpaces(paper['summary']),
        'lastUpdated': paper['updated'],
        'category': [category['@term'] for category in paper['category']],
        'url': paper['id']
    }

if __name__ == "__main__":
    url = 'http://export.arxiv.org/api/query'

    keyword = input("Enter the keyword to search papers: ")
    queryParams = {
        'search_query': 'all:{}'.format(keyword),
        'start': 0,
        'max_results': 200
    }

    outLs = []
    batch = 1
    while batch <= 10:
        try:
            resp = requests.get(url, params=queryParams)
            resp = xmltodict.parse(resp.text)
            resp = resp['feed']
            if 'entry' in resp:
                for paper in resp['entry']:
                    paper = createPaper(paper)
                    outLs.append(paper)
                print("Batch-{}: processed {} papers".format(batch, len(resp['entry'])))
            else:
                break
        except:
            print("Error while processing batch-{}".format(batch))
        batch += 1
        queryParams['start'] += 200
        time.sleep(0.5)
    print("Total processed papers:", len(outLs))
    try:
        with open('{}.json'.format(keyword), mode='w', encoding='utf-8') as jsonFile:
            json.dump(outLs, jsonFile, indent=2, ensure_ascii=False)
            print("Successfully created the json dump file !")
    except:
        print("Error while creating json dump file")
