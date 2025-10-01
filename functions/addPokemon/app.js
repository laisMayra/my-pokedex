const fetch = require("node-fetch");
const { DynamoDBClient, PutItemCommand } = require("@aws-sdk/client-dynamodb");
const { formatPokemonData } = require("/opt/nodejs/utils");

const client = new DynamoDBClient({});

exports.handler = async (event) => {
  try {
    // pegar userId do JWT via API Gateway Authorizer
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const body = JSON.parse(event.body || "{}");
    const pokemonName = body.name?.toLowerCase();
    if (!pokemonName) return { statusCode: 400, body: "Pokemon name required" };

    // buscar dados no PokéAPI
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
    if (!response.ok) return { statusCode: 404, body: "Pokemon not found" };

    // buscar dados no PokéAPI - pokemon-species
    const responseSpecies = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
    if (!responseSpecies.ok) return { statusCode: 404, body: "Pokemon not found" };

    const rawData = await response.json();
    const rawDataSpecies = await responseSpecies.json();
    const pokemonData = formatPokemonData(rawData, rawDataSpecies);

    // salvar no DynamoDB
    const command = new PutItemCommand({
      TableName: "PokemonsTable",
      Item: {
        userId: { S: userId },
        pokemonId: { N: pokemonData.pokemonId.toString() },
        pokemonName: { S: pokemonData.pokemonName },
        sprite: { S: pokemonData.sprite },
        types: { S: pokemonData.types},
        isLegendary: { S: pokemonData.isLegendary.toString() },
        isMythical: { S: pokemonData.isMythical.toString() },
        capturedAt: { S: new Date().toISOString() }
      }
    });

    await client.send(command);

    return { 
      statusCode: 200, 
      body: JSON.stringify(pokemonData)
    };
  } catch (err) {
    console.error(err);
    return { 
      statusCode: 500, 
      body: "Internal Server Error"
    };
  }
};
