from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from translate import translate
import keras

from data.transforms import get_frames_reduction_transform


max_frames = 75


model = keras.models.load_model("asd")

# Init app
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Send Data to Model
@app.route('/model', methods=['POST'])
@cross_origin()
def post_data():
  '''Struct of keypoint: request.json['frames'][0]['keypoints'][0]['x']'''
  frames = get_frames_reduction_transform(max_frames)(request.json['frames'])
  return { "response": model.predict(frames)}

@app.route('/', methods=['GET'])
@cross_origin()
def get_hpage():
  return jsonify({'msg': 'Hello World'})

# Run Server
if __name__ == '__main__':
  app.run(debug=True)

#http://127.0.0.1:5000/             GET
#http://127.0.0.1:5000/model/       POST