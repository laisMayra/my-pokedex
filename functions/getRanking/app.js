const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({});

exports.handler = async (event) => {
    console.log('Get ranking event received');
    
    try {
        const command = new ScanCommand({
            TableName: process.env.RANKINGS_TABLE
        });
        
        const result = await client.send(command);
        
        const rankings = result.Items.map(item => ({
            userId: item.userId.S,
            userName: item.userName?.S || `Treinador_${item.userId.S.substring(0, 8)}`,
            userEmail: item.userEmail?.S,
            pokemonCount: item.pokemonCount ? parseInt(item.pokemonCount.N) : 0,
            lastActivity: item.lastActivity?.S || new Date().toISOString()
        }));
        
        // Ordenar por pokemonCount (decrescente)
        rankings.sort((a, b) => b.pokemonCount - a.pokemonCount);
        
        const rankedResults = rankings.map((user, index) => ({
            position: index + 1,
            ...user
        }));
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                rankings: rankedResults,
                totalUsers: rankings.length,
                timestamp: new Date().toISOString()
            })
        };
        
    } catch (error) {
        console.error('Error getting ranking:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};