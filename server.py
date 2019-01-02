from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS
import password

import psycopg2
import json
import urllib2 #Kan slettes, hvis ikke den bruges
#import sys

# import configparser
import requests
# import sys


app = Flask(__name__)
CORS(app)

@app.route("/")
def hello():
    return "Hello World!"

@app.route("/openweathermap")
def openweathermap():

    lat = request.args.get('lat')
    lng = request.args.get('lng')

    owmKey = "ee67f8f53521d94193aa7d8364b7f5d9"

    owmAddress = requests.get('http://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lng + '&appid=' + owmKey)

    print(owmAddress)


    return Response(owmAddress, content_type='application/json; charset=UTF-8')

@app.route("/darksky")
def darksky():

    lat = request.args.get('lat')
    lng = request.args.get('lng')

    dsKey = "b843700cbe82111c47584343a224adcf"


    dsAddress = requests.get("https://api.darksky.net/forecast/" + dsKey + "/" + lat +"," + lng)

    print(dsAddress)


    return Response(dsAddress, content_type='application/json; charset=UTF-8')


@app.route("/findstation")
def findstation():

    lat = request.args.get('lat')
    lng = request.args.get('lng')


    conn = psycopg2.connect("dbname='Destinations' \
                             host='localhost' \
                             user='postgres' \
                             password='"+password.kode+"'")

    cur = conn.cursor() #What is the meaning of this?#

    cur.execute("""SELECT id, navn, navnekate0, ST_AsText(geom)
FROM station
ORDER BY ST_DISTANCE(ST_SetSRID(
	ST_MakePoint(%s, %s), 4326)::geography, geom::geography)
LIMIT 1;""", (lng, lat ))

    res = cur.fetchone()
    print(res)
    navn = res[1]
    navnekate0 = res[2]

    closest_station = json.dumps(res[3]) #What is the meaning of these numbers?

#print(closest_station, file = sys.stderr)
    closest_coords = closest_station.split("(")[1] ##[ removed

    coords = closest_coords.split(")")[0]##] removed
    x = coords.split()[0]
    y = coords.split()[1]

    json_response = '{"type": "Feature","geometry": {"type": "Point","coordinates": ['+x+','+y+']},"properties": {"vejnavn": "'+navn+'", "type": "'+navnekate0+'"}}'

    return Response(json_response, content_type='application/json; charset=UTF-8')


    cur.close()
    conn.close()
