from neo4j import GraphDatabase

URI = "neo4j+s://4dfe28ab.databases.neo4j.io"
USER = "neo4j" # often the username is neo4j even if the UI showed the DB ID
PWD = "2MZjOHkS9b9-4_3WBg0fBZDWQVpLLhHSS_VXFBPu9DM"

try:
    print("Testing with username 'neo4j'...")
    driver = GraphDatabase.driver(URI, auth=(USER, PWD))
    driver.verify_connectivity()
    print("Connection successful with 'neo4j'!")
    driver.close()
except Exception as e:
    print(f"Failed with 'neo4j': {e}")
    try:
        USER = "4dfe28ab"
        print(f"Testing with username '{USER}'...")
        driver = GraphDatabase.driver(URI, auth=(USER, PWD))
        driver.verify_connectivity()
        print(f"Connection successful with '{USER}'!")
        driver.close()
    except Exception as e2:
        print(f"Failed with '{USER}': {e2}")
