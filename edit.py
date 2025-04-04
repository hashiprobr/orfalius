import json
import os
import subprocess
import sys


INPUT_NAME = 'edit.json'

SOURCE_NAME = 'edit.txt'

PARTS_NAME = 'parts'

CONCAT_NAME = 'index.txt'

OUTPUT_NAME = 'index.mp4'


class PreProcessor:
    def __init__(self):
        self.last = None

    def write(self, file, inname, inpoint, outpoint):
        if inpoint < outpoint:
            if self.last != inname:
                self.last = inname
                self.index = 0
            outname = os.path.join(PARTS_NAME, '{}_{}.mp4'.format(inname[:inname.rfind('.')].replace(' ', '_'), self.index))
            subprocess.run(['ffmpeg', '-i', inname, '-ss', str(inpoint), '-t', str(outpoint - inpoint), outname])
            file.write('file {}\n'.format(outname))
            self.index += 1
        return outpoint - inpoint


def main():
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
            if filename not in [INPUT_NAME, SOURCE_NAME, PARTS_NAME, CONCAT_NAME, OUTPUT_NAME]:
                filenames.append(filename)

        pp = PreProcessor()

        with open(INPUT_NAME) as file:
            data = json.load(file)

        with open(SOURCE_NAME, 'w') as file:
            file.write(f'////////////////// {OUTPUT_NAME}\n')
            for time in data['times']:
                file.write('{}\n'.format(time))
            file.write('//////////////////\n')

        if not os.path.exists(PARTS_NAME):
            os.mkdir(PARTS_NAME)

        with open(CONCAT_NAME, 'w') as file:
            shift = 0
            for filename, subtimes in zip(filenames, data['timeline']):
                last = 0
                total = 0
                inpoint = 0
                outpoint = 0
                for time in subtimes:
                    if time < 0:
                        if last > 0:
                            total += pp.write(file, filename, inpoint, outpoint)
                            inpoint = outpoint
                        inpoint -= time
                    else:
                        if last < 0:
                            outpoint = inpoint
                        outpoint += time
                    last = time
                total += pp.write(file, filename, inpoint, outpoint)
                shift += total

        subprocess.run(['ffmpeg', '-f', 'concat', '-i', CONCAT_NAME, '-filter:v', 'crop=iw-{}:ih:{}:0,scale=384:trunc((384/iw)*ih/2)*2'.format(leftcrop + rightcrop, leftcrop), OUTPUT_NAME])


if __name__ == '__main__':
    main()
