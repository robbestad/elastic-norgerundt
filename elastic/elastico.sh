#!/usr/bin/env bash
INDEX="norgerundt"

AUTH=elastic:A39k7lVTRMiEXtia4zREGznj

ADDRESS=57e71220df27cc6ca6912bfb750b0c4b.eu-west-1.aws.found.io:9200

# Check that Elasticsearch is running
echo curl -s -u $AUTH "http://$ADDRESS"
curl -s -u $AUTH "http://$ADDRESS" 2>&1 > /dev/null
if [ $? != 0 ]; then
    echo "Unable to contact Elasticsearch on port 9200."
    echo "Please ensure Elasticsearch is running and can be reached at http://localhost:9200/"
    exit -1
fi

echo "WARNING, this script will delete the 'norgerundt' and the 'myindex' indices and re-index all data!"
echo "Press Control-C to cancel this operation."
echo
echo "Press [Enter] to continue."
read

# Delete the old index, swallow failures if it doesn't exist
curl -s -u $AUTH  -XDELETE "$ADDRESS/$INDEX" > /dev/null

# Create the next index using mapping.json
echo "Creating 'norgerundt' index..."
curl -s -u $AUTH  -XPOST "$ADDRESS/$INDEX/index" -d@$(dirname $0)/mapping.json

# Wait for index to become yellow
curl -s -u $AUTH  "$ADDRESS/$INDEX/_health?wait_for_status=yellow&timeout=10s" > /dev/null
echo
echo "Done creating '$INDEX' index."

echo
echo "Done creating '$INDEX' index."

echo
echo "Indexing data..."

echo "Indexing groups..."
python transform.py

# 0. Some constants to re-define to match your environment
JSON_FILE_IN=data.json
JSON_FILE_OUT=bulk.json

# 1. Python code to transform your JSON file
PYTHON="import json,sys;
out = open('$JSON_FILE_OUT', 'w');
with open('$JSON_FILE_IN') as json_in:
    docs = json.loads(json_in.read());
    for doc in docs:
        out.write('%s\n' % json.dumps({'index': {}}));
        out.write('%s\n' % json.dumps(doc, indent=0).replace('\n', ''));
"

# 2. run the Python script from step 1
python -c "$PYTHON"

# 3. use the output file from step 2 in the curl command
curl -s -u $AUTH -XPOST $ADDRESS/norgerundt/type/_bulk --data-binary @$JSON_FILE_OUT > /dev/null

rm $JSON_FILE_OUT
rm $JSON_FILE_IN

