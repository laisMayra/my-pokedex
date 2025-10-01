# 📋 myPokedex
Backend completo para o sistema de coleção de Pokémon, construído com AWS Serverless Application Model (SAM).

## 📋 Sobre o Projeto
Backend serverless que fornece APIs seguras para gerenciamento de coleção de Pokémon, com autenticação via Cognito e armazenamento em DynamoDB.

## Serviços AWS Utilizados
- API Gateway HTTP API - Endpoints RESTful com CORS
- AWS Lambda - Funções serverless em Node.js 18.x
- DynamoDB - Banco de dados NoSQL com streams
- Cognito - Autenticação JWT e gerenciamento de usuários
- Lambda Layers - Dependências compartilhadas
- CloudWatch - Logs e monitoramento

## 📁 Estrutura do Projeto
backend/
├── template.yaml              # Template SAM principal
├── functions/                 # Lambda functions
│   ├── addPokemon/
│   │   └── app.js            # Adiciona Pokémon à coleção
│   ├── getPokemons/
│   │   └── app.js            # Lista Pokémon do usuário
│   ├── updateRanking/
│   │   └── app.js            # Atualiza ranking via DynamoDB Stream
│   └── getRanking/
│       └── app.js            # Retorna ranking global
├── layers/                   # Dependências compartilhadas
│   └── commonModules/
│       └── nodejs/
│           ├── package.json
│           ├── node_modules/ # @aws-sdk/client-dynamodb, etc.
|           └─ utils.js      # Funções utilitárias
└── README.md


## 🚀 Deployment
### Pré-requisitos
- AWS CLI configurado com credenciais
- SAM CLI instalado
- Node.js 18.x ou superior
- User Pool do Cognito previamente configurado

### Build do Projeto
```bash
SAM build
```

### Deploy da Stack
```bash
sam deploy --guided
```

### Parâmetros Necessários:
- CognitoUserPoolId: ID do User Pool do Cognito (ex: us-east-1_XXXXXX)
- CognitoUserPoolClientId: ID do App Client do Cognito (ex: XXXXXXXXXXXXX)
- CognitoUserPoolArn: ARN do User Pool do Cognito (ex: arn:aws:cognito-idp:us-east-1:123456789012:userpool/us-east-1_XXXXXX)
- FrontendDomain: Domínio do frontend para CORS (ex: meu-front-no-amplify.amplifyapp.com)  

### Deploy Rápido (após primeira configuração)
```bash
sam build && sam deploy
```

## 📝 DynamoDB Tables
- PokemonsTable - Armazena coleção de Pokémon por usuário
- UserRankingsTable - Armazena ranking de usuários

## 🔧 Recursos Criados

### Lambda Functions
- AddPokemonFunction - POST /pokemon (autenticado)
- GetPokemonsFunction - GET /pokemon (autenticado)
- GetRankingFunction - GET /ranking (público)
- UpdateRankingFunction - Trigger de DynamoDB Stream

### API Gateway
- HTTP API com configuração CORS
- Authorizer JWT integrado com Cognito
- Endpoints protegidos e públicos

### Lambda Layer
- CommonModulesLayer - Dependências compartilhadas entre funções

## 📡 Endpoints da API
Base URL: https://{api-id}.execute-api.{region}.amazonaws.com/Prod

### POST /pokemon
Autenticação: ✅ Requer Bearer Token JWT
Descrição: Adiciona Pokémon à coleção do usuário
```json
Request:
{
  "name": "pikachu"
}
```
Response:
```json
{
    "pokemonId": 25,
    "pokemonName": "pikachu",
    "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    "types": "electric",
    "isLegendary": false,
    "isMythical": false
}
```

### GET /pokemon
Autenticação: ✅ Requer Bearer Token JWT
Descrição: Retorna todos os Pokémon do usuário autenticado
Response:
```json
[
  {
    "pokemonId": 25,
    "pokemonName": "pikachu",
    "sprite": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png",
    "types": "electric",
    "isLegendary": false,
    "isMythical": false,
    "capturedAt": "2025-10-01T13:32:00.438Z"
  }
]
```

### GET /ranking
Autenticação: ✅ Requer Bearer Token JWT
Descrição: Retorna ranking global de colecionadores
```json
{
    "rankings": [
        {
            "position": 1,
            "userId": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
            "userName": "user name",
            "userEmail": "user@email.com",
            "pokemonCount": 12,
            "lastActivity": "2025-10-01T13:08:04.915Z"
        }
    ],
    "totalUsers": 1,
    "timestamp": "2025-10-01T13:34:27.750Z"
}
```

## 🔐 Autenticação
### Configuração do Cognito
- User Pool com atributos customizados:
  - email (required, verified)
  - name (custom attribute, required)

- App Client configurado com:
  - OAuth grant types: Authorization Code Grant
  - OpenID Connect scopes: openid, email, phone
  - Callback URLs: Domínio do frontend

## 🗄️ Modelos de Dados
### PokemonsTable Schema:
┌───────────────┬─────────────┬─────────────────────────────────────┐
│   Atributo    │    Tipo     │            Descrição                │
├───────────────┼─────────────┼─────────────────────────────────────┤
│   userId      │   String    │  Partition Key (sub do Cognito)     │
│   pokemonId   │   Number    │  Sort Key (ID do Pokémon)           │
│  pokemonName  │   String    │  Nome do Pokémon                    │
│    sprite     │   String    │  URL da imagem oficial              │
│     types     │   String    │  Tipo(s) do Pokémon                 │
│  capturedAt   │   String    │  Data/hora da captura               │
│ isLegendary   │   String    │  Indica se é lendário ("true/false")│
│  isMythical   │   String    │  Indica se é mítico ("true/false")  │
└───────────────┴─────────────┴─────────────────────────────────────┘

### UserRankingsTable Schema
┌───────────────┬─────────┬────────────────────────────────────┐
│   Atributo    │  Tipo   │            Descrição               │
├───────────────┼─────────┼────────────────────────────────────┤
│    userId     │ String  │  Partition Key                     │
│   userName    │ String  │  Nome do usuário                   │
│   userEmail   │ String  │  Email do usuário                  │
│  pokemonCount │ Number  │  Quantidade de Pokémon capturados  │
│ lastActivity  │ String  │  Data/hora da última atividade     │
└───────────────┴─────────┴────────────────────────────────────┘