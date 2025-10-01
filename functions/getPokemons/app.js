const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, QueryCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

exports.handler = async (event) => {
  try {
    // pegar userId do JWT via API Gateway Authorizer
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const command = new QueryCommand({
      TableName: process.env.TABLE_NAME,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId }
    });

    const data = await docClient.send(command);
    const items = data.Items.map(item => ({
      pokemonId: item.pokemonId,
      pokemonName: item.pokemonName,
      sprite: item.sprite,
      types: item.types || [],
      isLegendary: item.isLegendary === "true",
      isMythical: item.isMythical === "true",
      capturedAt: item.capturedAt
    }));

    return { 
      statusCode: 200,
      body: JSON.stringify(items) 
    };
  } catch (err) {
    console.error(err);
    return { 
      statusCode: 500,
      body: JSON.stringify({ error: "Internal Server Error" }) 
    };
  }
};