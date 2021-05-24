"""
This script contains all the functions used to fetch, insert, update or delete data
from the DynamoDB table.

Author: Ama
"""

import os

import boto3
from boto3.dynamodb.conditions import Key, Attr

# AWS_ACCESS_KEY_ID = os.environ["AWS_ACCESS_KEY_ID"]
# AWS_SECRET_ACCESS_KEY = os.environ["AWS_SECRET_ACCESS_KEY"]
# dynamodb = boto3.resource('dynamodb', region_name='eu-central-1',
#     aws_access_key_id=AWS_ACCESS_KEY_ID, aws_secret_access_key=AWS_SECRET_ACCESS_KEY)

dynamodb = boto3.resource('dynamodb', endpoint_url="http://localhost:8080")

table = dynamodb.Table('a2note_ninja')

# -- SELECT OPERATIONS - #
def select_all_products():
    response = table.query(
    ScanIndexForward=True,
    KeyConditionExpression=Key('element_type').eq('PRODUCT')
    )
    return response['Items']

def select_products_by_category(category):
    response = table.query(
    IndexName='element_type-element_category-index',
    ScanIndexForward=True,
    KeyConditionExpression=Key('element_type').eq('PRODUCT') & Key('element_category').eq(category)
    )
    return response['Items']

def select_element_by_id(element_type, element_id):
    response = table.query(
    ScanIndexForward=True,
    KeyConditionExpression=Key('element_type').eq(element_type) & Key('element_id').eq(element_id)
    )
    if len(response['Items']) > 0:
        return response['Items'][0]

    return []

def select_list_by_author(author, filter="ALL"):
    if filter == "ALL":
        #Temporary and inefficient solution in which 2 distinct queries are made and then the results are merged into one list
        response0 = table.query(
        IndexName='element_type-author-index',
        ScanIndexForward=True,
        KeyConditionExpression=Key('element_type').eq('SHOPLIST') & Key('author').eq(author)
        )

        response1 = table.query(
        IndexName='element_type-author-index',
        ScanIndexForward=True,
        KeyConditionExpression=Key('element_type').eq('TODOLIST') & Key('author').eq(author)
        )

        return response0['Items'] + response1['Items']

    response = table.query(
    IndexName='element_type-author-index',
    ScanIndexForward=True,
    KeyConditionExpression=Key('element_type').eq(filter) & Key('author').eq(author)
    )

    return response['Items']

# -- INSERT OPERATIONS -- #
def insert_item(item):
    table.put_item(Item=item)
