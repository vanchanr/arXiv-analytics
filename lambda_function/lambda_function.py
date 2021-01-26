import xmltodict
import requests
import json
import re
import matplotlib.pyplot as plt
from datetime import datetime
import base64
from io import BytesIO
from urllib.parse import unquote
import boto3
import time

PROCESSING = "processing"
SUCCESS = "success"
ERROR = "error"

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
            'url': paper['id'].replace('abs', 'pdf')
        }
    else:
        return None

def plotHelper(keyword, plotBy, countData):
    fig, ax = plt.subplots()
    
    keys = list(countData.keys())
    keys = ['\n'.join(item.split(' ', 1)) for item in keys]
    ypos = [i for i in range(len(keys))]
    values = list(countData.values())
    ax.barh(ypos, values, height=0.5)
    ax.set_yticks(ypos)
    ax.set_yticklabels(keys)
    ax.invert_yaxis()
    for i in ypos:
        ax.text(values[i], i , str(values[i]), va='center', ha='left')
    ax.set_title(f'Number of {keyword} Papers by {plotBy}')
    ax.set_xlabel('Count')
    ax.set_ylabel(plotBy)

    tmpFile = BytesIO()
    fig.set_tight_layout(True)
    fig.savefig(tmpFile, format='png')
    return base64.b64encode(tmpFile.getvalue()).decode('utf-8')

def plotYearWise(keyword, jsonDump):
    yearCountData = {}
    for paper in jsonDump:
        lastUpdated = paper['lastUpdated']
        dt = datetime.strptime(lastUpdated, '%Y-%m-%dT%H:%M:%SZ')
        year = str(dt.year)
        if year in yearCountData:
            yearCountData[year] += 1
        else:
            yearCountData[year] = 1
    
    yearCountData = dict(sorted(yearCountData.items()))
    return plotHelper(keyword, 'year', yearCountData)

#field: 'author', 'category'
#plot top 10
def plotFieldWise(keyword, jsonDump, field):
    if field in ['author', 'category']:
        data = {}
        for paper in jsonDump:
            for name in paper[field]:
                if name in data:
                    data[name] += 1
                else:
                    data[name] = 1
        data = dict(sorted(data.items(), key=lambda x: x[1], reverse=True)[:10])
        return plotHelper(keyword, field, data)

def setRequestStatusInS3(requestId, requestStatus):
    client = boto3.client('s3')
    response = client.put_object(
        Body=requestStatus,
        Bucket='arxiv-analytics',
        Key='request_status/' + requestId
    )
    print(response)

def lambda_handler(event, context):
    keyword = event['params']['path']['keyword']
    request_id = event['context']['request-id']
    
    setRequestStatusInS3(request_id, PROCESSING)

    time.sleep(20)

    if (int(time.time()) % 2) == 0:
        setRequestStatusInS3(request_id, SUCCESS)
    else:
        setRequestStatusInS3(request_id, ERROR)

    # keyword = unquote(keyword)
    # url = 'http://export.arxiv.org/api/query'
    # queryParams = {
    #     'search_query': f'all:"{keyword}"',
    #     'start': 0,
    #     'max_results': 500
    # }
    
    # outLs = []
    # batch = 1
    # while batch <= 100:
    #     try:
    #         resp = requests.get(url, params=queryParams) #sort by latest first
    #         resp = xmltodict.parse(resp.text)
    #         resp = resp['feed']
    #         if 'entry' in resp:
    #             curBatch = []
    #             for paper in resp['entry']:
    #                 paper = createPaper(paper)
    #                 if paper is not None:
    #                     curBatch.append(paper)
    #             outLs.extend(curBatch)
    #             print(f"Batch-{batch}: Added {len(curBatch)} CS papers")
    #         else:
    #             break
    #     except Exception as ex:
    #         print(f"Error while processing batch-{batch}: {ex}")
    #     batch += 1
    #     queryParams['start'] += 500
    #     time.sleep(0.1)
    # print(f"Total CS papers matching '{keyword}':", len(outLs))
    # # try:
    # #     with open(f'{keyword}.json', mode='w', encoding='utf-8') as jsonFile:
    # #         json.dump(outLs, jsonFile, indent=2, ensure_ascii=False)
    # #         print("Successfully created the json dump file !")
    # # except Exception as ex:
    # #     print(f"Error while creating json dump file: {ex}")
    
    # return {
    #     'statusCode': 200,
    #     'headers': {
    #         'Access-Control-Allow-Headers': 'Content-Type',
    #         'Access-Control-Allow-Origin': 'http://arxiv-analytics.s3-website.ap-south-1.amazonaws.com',
    #         'Access-Control-Allow-Methods': 'OPTIONS,POST,GET'
    #     },
    #     'body': json.dumps({
    #         # "yearPlot": plotYearWise(keyword, outLs),
    #         # "authorPlot": plotFieldWise(keyword, outLs, 'author'),
    #         # "categoryPlot": plotFieldWise(keyword, outLs, 'category'),
    #         # "allPapers": outLs,
    #         # "topKeywords": event['requestId']
    #     })
    # }
