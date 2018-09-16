#!/usr/bin/env python
# -*- coding: utf-8 -*-
import codecs
import sys
reload(sys)
sys.setdefaultencoding('utf-8')

def file_len(fname):
    with open(fname) as f:
        for i, l in enumerate(f):
            pass
    return i + 1
i = -1;
data = "[\n"
file_name = 'norgerundt.csv'
num_lines = file_len(file_name)
with open('norgerundt.csv') as fp:
    for line in fp:
        i = i + 1
        line = line.decode('ISO8859').encode('utf-8')
        line = line.replace("(mellomstikk)","")
        line = line.replace("'","\'")
        line = line.replace("\"","")
        split = line.split(";")
        if i > 0:
            data += '{ "item": "' + str(i) + '", "text_field": ["' + split[3] + '"] } '
            if i+1 < num_lines:
                data += ",\n"
data += "]\n"

file = codecs.open("ac.json", "w", "utf8")
file.write(data)
file.close()

