from intel_reports import reports
from fastapi import FastAPI 
from fastapi.staticfiles import StaticFiles    

app = FastAPI()



@app.get('/reports')
def get_reports():
    return reports

@app.get('/summaries')
def get_summaries(classification):
    summaries = []
    for report in reports:
        if report['classification'] == classification:
            dictionary = {
                'region': report['region'],
                'classification': report['classification'],
                'summary': report['summary']
            }
            summaries.append(dictionary)
    return summaries







  

app.mount("/", StaticFiles(directory="static", html=True), name="static")      