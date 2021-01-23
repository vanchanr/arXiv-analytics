import json
import matplotlib.pyplot as plt
from datetime import datetime

def plotHelper(plotBy, countData):
    plt.bar(countData.keys(), countData.values())
    for key in countData:
        plt.text(key, countData[key], str(countData[key]), va='bottom', ha='center')
    plt.title('Number of Papers by {}'.format(plotBy))
    plt.xlabel(plotBy)
    plt.ylabel('Count')
    plt.xticks(rotation=30)
    plt.show()

def plotYearWise(jsonDump):
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
    plotHelper('year', yearCountData)

#field: 'author', 'category'
#plot top 10
def plotFieldWise(jsonDump, field):
    if field in ['author', 'category']:
        data = {}
        for paper in jsonDump:
            for name in paper[field]:
                if name in data:
                    data[name] += 1
                else:
                    data[name] = 1
        data = dict(sorted(data.items(), key=lambda x: x[1], reverse=True)[:10])
        plotHelper(field, data)

if __name__ == "__main__":
    researchArea = input("Enter the filename without '.json': ")
    jsonDump = {}
    with open('{}.json'.format(researchArea), mode='r') as jsonFile:
        jsonDump = json.load(jsonFile)
    plotYearWise(jsonDump)
    plotFieldWise(jsonDump, 'author')
    plotFieldWise(jsonDump, 'category')
    