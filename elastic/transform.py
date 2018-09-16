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
        line = line.replace("'","\'")
        line = line.replace("\"","")
        split = line.split(";")
        if i > 0:
            data += '{ "year": "' + split[0] + '", \
"url":  "' + split[1] + '", \
"kommune":  "' + split[2] + '", \
"tittel":  "' + split[3] + '", \
"hovedtema":  "' + split[4].replace('"','') + '", \
"opplevelse":  "' + split[6] + '", \
"antrekk":  "' + split[7] + '", \
"dyr":  "' + split[18] + '", \
"antall_menn":  "' + split[19] + '", \
"antall_kvinner":  "' + split[20] + '", \
"alder":  "' + split[28] + '", \
"tema":  { \
"politikk": "' + split[31] + '", \
"offentlig": "' + split[24] + '", \
"landbruk": "' + split[23] + '", \
"handel": "' + split[22] + '", \
"frilufsliv": "' + split[21] + '", \
"entusiaster": "' + split[13] + '", \
"idrett": "' + split[12] + '", \
"kunst": "' + split[11] + '", \
"vitenskap": "' + split[14] + '", \
"natur": "' + split[10] + '", \
"historisk": "' + split[9] + '", \
"industri": "' + split[8] + '", \
"opplevelse": "' + split[6] + '", \
"spesielt": "' + split[5] + '" \
         } }'
            if i+1 < num_lines:
                data += ",\n"
data += "]\n"

file = codecs.open("data.json", "w", "utf8")
file.write(data)
file.close()

