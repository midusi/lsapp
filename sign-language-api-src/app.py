from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from typing import List, Dict, Any
from type_hints import KeypointData
from data.transforms import (
  get_frames_reduction_transform, 
  get_keypoint_format_transform,
  keypoint_norm_to_center_transform, 
)
from itertools import repeat, chain

def keypoints_flatten_transform(keypoints: List[Dict[str, float]]) -> List[float]:
  return [values for keypoint in keypoints for _,values in keypoint.items()]

def add_score_to_keypoints(keypoints: List[float], n : int = 2) -> List[float]:
  return list(chain.from_iterable(zip(*(keypoints[s::n] for s in range(n)), repeat(0.0))))

def frame_format_transform(frame: Dict[str, List[dict]]) -> KeypointData:
  return {
    "image_id": "", "category_id": 0, "score": 0.0, "box": [], "idx": [],
    "keypoints": add_score_to_keypoints(keypoints_flatten_transform(frame['keypoints'])) }

max_frames = 75
keypoints_to_use = [i for i in range(94, 136)]

# Init app
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

# Send Data to Model
@app.route('/model', methods=['POST'])
@cross_origin()
def post_data():
  '''Struct of keypoint: request.json['frames'][0]['keypoints'][0]['x']'''
  frames = list(map(frame_format_transform, request.json['frames']))
  # for frame in frames:
  #   for k,v in frame.items():
  #     print(k,v)
  frames = get_frames_reduction_transform(max_frames)(frames)
  frames = keypoint_norm_to_center_transform(frames)
  src = list(map(get_keypoint_format_transform(keypoints_to_use), frames))
  print(src)
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