import json
import os
import subprocess
import sys


INPUT_NAME = 'edit.json'

SOURCE_NAME = 'edit.txt'

CONCAT_NAME = 'concat.txt'

OUTPUT_NAME = 'concat.mp4'


length = len(sys.argv)

if length != 4:
    print('Usage: python <dirname> <leftcrop> <rightcrop>'.format(sys.argv[0]))
else:
    dirname = sys.argv[1]
    leftcrop = int(sys.argv[2])
    rightcrop = int(sys.argv[3])

    os.chdir(dirname)

    filenames = []
    for filename in sorted(os.listdir()):
        if filename not in [INPUT_NAME, SOURCE_NAME, CONCAT_NAME, OUTPUT_NAME]:
            if ' ' in filename:
                src = filename
                filename = filename.replace(' ', '_')
                os.rename(src, filename)
            filenames.append(filename)

    with open(INPUT_NAME) as file:
        data = json.load(file)

    with open(SOURCE_NAME, 'w') as file:
        file.write('//////////////////////////////////////////\n')
        for time in data['times']:
            file.write('{}\n'.format(time))
        file.write('//////////////////////////////////////////\n')

    with open(CONCAT_NAME, 'w') as file:
        start = 0
        for filename, subtimes in zip(filenames, data['timeline']):
            if subtimes:
                file.write('file {}\n'.format(filename))
                file.write('outpoint {}\n'.format(subtimes[-1] - start))
                start = subtimes[-1]

    subprocess.run(['ffmpeg', '-f', 'concat', '-i', CONCAT_NAME, '-filter:v', 'crop=iw-{}:ih:{}:0,scale=384:trunc((384/iw)*ih/2)*2'.format(leftcrop + rightcrop, leftcrop), OUTPUT_NAME])
