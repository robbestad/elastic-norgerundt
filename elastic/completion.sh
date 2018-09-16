#curl -s -XDELETE 'localhost:9200/norgerundt' >> dev/null

curl -XPUT 'localhost:9200/norgerundt?pretty' -d'
{
    "mappings": {
        "tittel" : {
            "properties" : {
                "suggest" : {
                    "type" : "completion"
                },
                "title" : {
                    "type": "keyword"
                }
            }
        }
    }
}'

curl -XPUT 'localhost:9200/norgerundt/tittel/1?refresh&pretty' -d'
{
    "suggest" : [
        {
            "input": "Asker",
            "weight" : 10
        }
    ]
}'

curl -XPOST 'localhost:9200/norgerundt/_suggest?pretty&pretty' -d'
{
    "tittel-suggest" : {
        "prefix" : "a",
        "completion" : {
            "field" : "tittel-suggest"
        }
    }
}'



