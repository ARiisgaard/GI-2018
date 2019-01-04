#Here the used modules are imported
from flask import Flask
from flask import request
from flask import Response
from flask_cors import CORS
import psycopg2
import json
import requests

#This is the name of the file, where the password for the database is stored. This was nessercery since we didn't have the same passwords
import password


app = Flask(__name__)
CORS(app)

@app.route("/")
def hello():
    return "Hello World!"

@app.route("/openweathermap")
def openweathermap():

    lat = request.args.get('lat')
    lng = request.args.get('lng')

    owmKey = "62a05daa14ce3d041c511ba34f91e936"

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
                             password='"+password.kode+"'")#Connects to our database with stations

    cur = conn.cursor()

    cur.execute("""SELECT id, navn, navnekate0, ST_AsText(geom)
FROM station
ORDER BY ST_DISTANCE(ST_SetSRID(
	ST_MakePoint(%s, %s), 4326)::geography, geom::geography)
LIMIT 1;""", (lng, lat ))#This is the request send to the database - sort all stations by distance from the "ideal destination" and return one value

    res = cur.fetchone() #Gets the one result from the database
    print(res)
    navn = res[1] #This is the name of the station
    navnekate0 = res[2] #This is the station-type

    closest_station = json.dumps(res[3]) #This is the coordinates of the station converted to the json information

    #Since pgadmin keeps its coordinates stored in a different way, than Leaflet is used to work with, we return the lat and long one by one

    closest_coords = closest_station.split("(")[1]

    coords = closest_coords.split(")")[0]
    x = coords.split()[0]
    y = coords.split()[1]

    #This is the response that is going to be send back to js
    json_response = '{"type": "Feature","geometry": {"type": "Point","coordinates": ['+x+','+y+']},"properties": {"vejnavn": "'+navn+'", "type": "'+navnekate0+'"}}'

    return Response(json_response, content_type='application/json; charset=UTF-8')

    #This ends the connection to the database - otherwise it would keep running, and we would keep making new connections every time we look for a new station
    cur.close()
    conn.close()
