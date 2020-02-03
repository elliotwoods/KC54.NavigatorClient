import json
import os

try:
	os.makedirs('frames')
except:
	pass

input_filename = "spiral.json"

with open(input_filename) as input_file:
	data = json.load(input_file)
	count = len(data)
	for i in range(count):
		output_filename = "frames/{1}.json".format(str(i).zfill(5))
		print("Writing frame {0} to {1}".format(i, output_filename))

		data_frame = data[i]
		with open(output_filename, 'w') as output_file:
			json.dump(data_frame, output_file)

	report = {
		'frameCount' : count
	}
	with open('frames/report.json', 'w') as output_file:
			json.dump(report, output_file)