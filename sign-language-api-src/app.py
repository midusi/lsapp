from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin

# Init app
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Send Data to Model
@app.route('/model', methods=['POST'])
@cross_origin()
def post_data():
  return request.json

@app.route('/', methods=['GET'])
@cross_origin()
def get_hpage():
  return jsonify({'msg': 'Hello World'})

# Run Server
if __name__ == '__main__':
  app.run(debug=True)

#http://127.0.0.1:5000/             GET
#http://127.0.0.1:5000/model/       POST