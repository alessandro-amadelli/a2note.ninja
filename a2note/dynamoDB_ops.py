"""
This script contains all the functions used to fetch, insert, update or delete data
from the DynamoDB table.

Author: Ama
"""

import os
from datetime import datetime
import string
import random

import boto3
from boto3.dynamodb.conditions import Key, Attr

#Using production DATABASE if environment is PRODUCTION
#otherwise using local test db
if os.environ['A2NOTE_ENVIRONMENT'] == 'PRODUCTION':
    AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
    AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
    dynamodb = boto3.resource('dynamodb', region_name='eu-central-1',
        aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY)
else:
    dynamodb = boto3.resource('dynamodb', endpoint_url="http://localhost:8080")


table = dynamodb.Table('a2note_ninja')

# -- SELECT OPERATIONS - #
def select_elements_by_type(element_type):
    response = table.query(
    ScanIndexForward=True,
    KeyConditionExpression=Key('element_type').eq(element_type)
    )
    return response['Items']

def select_products_by_category(category):
    response = table.query(
    IndexName='element_category-element_id-index',
    ScanIndexForward=True,
    KeyConditionExpression=Key('element_category').eq(category)
    )
    return response['Items']

def select_element_by_id(element_id, element_type="ALL"):
    if element_type == "ALL":
        response = table.query(
        IndexName='element_id-index',
        ScanIndexForward=True,
        KeyConditionExpression=Key('element_id').eq(element_id)
        )
    else:
        response = table.query(
        ScanIndexForward=True,
        KeyConditionExpression=Key('element_type').eq(element_type) & Key('element_id').eq(element_id)
        )

    if len(response['Items']) > 0:
        return response['Items']

    return []

def select_lists_by_author(author, filter="ALL"):
    if filter == "ALL":
        response = table.query(
        IndexName='author-element_id-index',
        ScanIndexForward=True,
        KeyConditionExpression=Key('author').eq(author)
        )

        return response['Items']

    response = table.query(
    IndexName='author-element_id-index',
    ScanIndexForward=True,
    KeyConditionExpression=Key('author').eq(author),
    FilterExpression=Attr('element_type').eq(filter)
    )

    return response['Items']

# -- INSERT OPERATIONS -- #
def generate_UID():
    """
    This function generates a new Unique IDentifier for an element that has to
    be inserted into the DB.
    """
    UID_LENGTH = 9
    charset = string.ascii_uppercase + string.ascii_lowercase + string.digits + "-_"

    return "".join(random.SystemRandom().choices(charset, k=UID_LENGTH))

def insert_item(item):
    """
    This function takes a table item in input:
      _adds the current timestamp
      _if the element_id is empty or not present (eg: for shopping lists or to-do lists)
       it assigns a new element_id
    """
    timestamp = datetime.now().strftime("%Y-%m-%d h.%H:%M:%S.%f")
    item["creation_timestamp"] = timestamp

    element_id = ""
    if "element_id" in item:
        element_id = item["element_id"]


    if element_id == "":
        while(element_id == ""):
            new_UID = generate_UID()
            # print("new_UID", new_UID)

            if select_element_by_id(new_UID) == []:
                element_id = new_UID

        if item["element_type"] == "TODOLIST":
            item["element_id"] = "TL#" + element_id
        elif item["element_type"] == "SHOPLIST":
            item["element_id"] = "SL#" + element_id
        else:
            item["element_id"] = "A2#" + element_id

    table.put_item(Item=item)
    return item
