const { DynamoDBClient, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const { CognitoIdentityProviderClient, AdminGetUserCommand } = require("@aws-sdk/client-cognito-identity-provider");

const dynamoClient = new DynamoDBClient({});
const cognitoClient = new CognitoIdentityProviderClient({});

const getUserInfoFromCognito = async (userId) => {
    console.log(`[DEBUG] Fetching user info for: ${userId}`);
    console.log(`[DEBUG] User Pool ID: ${process.env.USER_POOL_ID}`);
    
    try {
        const command = new AdminGetUserCommand({
            UserPoolId: process.env.USER_POOL_ID,
            Username: userId
        });
        
        console.log(`[DEBUG] Sending AdminGetUser command...`);
        const userData = await cognitoClient.send(command);
        console.log(`[DEBUG] Cognito response:`, JSON.stringify(userData, null, 2));
        
        const attributes = userData.UserAttributes.reduce((acc, attr) => {
            acc[attr.Name] = attr.Value;
            return acc;
        }, {});
        
        const userInfo = {
            userName: attributes.name || attributes.email?.split('@')[0] || `Treinador_${userId.substring(0, 8)}`,
            userEmail: attributes.email || userId
        };
        
        console.log(`[DEBUG] Extracted user info:`, userInfo);
        return userInfo;
        
    } catch (error) {
        console.error(`[ERROR] Failed to fetch user from Cognito:`, error);
        console.error(`[ERROR] Error details:`, error.message, error.stack);
        
        return {
            userName: `Treinador_${userId.substring(0, 8)}`,
            userEmail: userId
        };
    }
};

exports.handler = async (event) => {
    console.log('[DEBUG] Ranking update event received');
    console.log('[DEBUG] Full event:', JSON.stringify(event, null, 2));
    
    try {
        for (const record of event.Records) {
            if (record.eventName === 'INSERT') {
                const newPokemon = record.dynamodb.NewImage;
                const userId = newPokemon.userId.S;
                
                console.log(`[DEBUG] Processing new pokemon for user: ${userId}`);
                
                // Buscar informações do usuário no Cognito
                const userInfo = await getUserInfoFromCognito(userId);
                
                console.log(`[DEBUG] Updating ranking with:`, userInfo);
                
                const command = new UpdateItemCommand({
                    TableName: process.env.RANKINGS_TABLE,
                    Key: { userId: { S: userId } },
                    UpdateExpression: 'ADD pokemonCount :inc SET lastActivity = :now, userName = :name, userEmail = :email',
                    ExpressionAttributeValues: {
                        ':inc': { N: '1' },
                        ':now': { S: new Date().toISOString() },
                        ':name': { S: userInfo.userName },
                        ':email': { S: userInfo.userEmail }
                    },
                    ReturnValues: 'NONE'
                });
                
                console.log(`[DEBUG] Sending DynamoDB update command...`);
                await dynamoClient.send(command);
                console.log(`[DEBUG] Successfully updated ranking for: ${userInfo.userName}`);
            }
        }
        
        return { success: true, processed: event.Records.length };
        
    } catch (error) {
        console.error('[ERROR] Critical error in handler:', error);
        console.error('[ERROR] Stack trace:', error.stack);
        throw error;
    }
};