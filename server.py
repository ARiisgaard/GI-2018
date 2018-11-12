from flask import Flask
from flask import request
from flask_cors import CORS

import psycopg2
import json
import sys


app = Flask(__name__)
CORS(app)

@app.route("/")
def hello():
    return "Hello World!"


@app.route("/findstation")
def findstation():

    lat = request.args.get('lat')
    lng = request.args.get('lng')


    conn = psycopg2.connect("dbname='Destinations' \
                             host='localhost' \
                             user='postgres' \
                             password='hxs46xzp'")

    cur = conn.cursor() #What is the meaning of this?#

    cur.execute("""SELECT *
FROM station
ORDER BY ST_DISTANCE(ST_SetSRID(
	ST_MakePoint(%s, %s), 4326)::geography, geom::geography)
LIMIT 1;""", (lng, lat ))

    res = cur.fetchone()

    navn = res[0]
    navnekate0 = res[1]

    closest_station = json.dumps(res[2]) #What is the meaning of these numbers?

print(closest_station, file=sys.stderr)
    closest_coords = closest_station.split("[")[1] ##[ removed

    coords = closest_coords.split("]")[0]##] removed

    response = '{"type": "Feature","geometry": {"type": "Point","coordinates": ['+coords+']},"properties": {"vejnavn": "'+navn+'", "type": "'+navnekate0+'"}}'




    cur.close()
    conn.close()


    return response





    #return "Find a machine at " + lat + ", " +lng