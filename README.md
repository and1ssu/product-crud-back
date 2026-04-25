# Produtos Back

API REST para gerenciamento de produtos, categorias e usuários, desenvolvida como teste técnico para vaga Backend/Fullstack.

O foco do projeto é demonstrar organização de código, separação de responsabilidades, validação de entrada, autenticação, persistência relacional e decisões técnicas para evolução da aplicação.

## Sumário

- [Objetivo](#objetivo)
- [Tecnologias utilizadas](#tecnologias-utilizadas)
- [Requisitos](#requisitos)
- [Como rodar o projeto](#como-rodar-o-projeto)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts disponíveis](#scripts-disponíveis)
- [Documentação da API](#documentação-da-api)
- [Principais rotas](#principais-rotas)
- [Arquitetura](#arquitetura)
- [Uso de Inteligência Artificial](#uso-de-inteligência-artificial)
- [Decisões técnicas](#decisões-técnicas)
- [Testes](#testes)
- [Melhorias futuras](#melhorias-futuras)

## Objetivo

Desenvolver uma aplicação simples de gerenciamento de produtos, com foco em:

- qualidade e organização do código;
- arquitetura clara e modular;
- autenticação e autorização;
- persistência em banco relacional;
- tratamento padronizado de erros;
- documentação para execução e manutenção.

## Tecnologias utilizadas

- **Node.js 20+**: runtime JavaScript usado pela aplicação.
- **TypeScript**: tipagem estática para reduzir erros e melhorar manutenção.
- **NestJS 11**: framework backend com arquitetura modular, injeção de dependência, controllers, providers, pipes, guards e interceptors.
- **PostgreSQL 16**: banco de dados relacional.
- **Prisma ORM 6**: modelagem do banco, migrations, seed e acesso tipado aos dados.
- **JWT**: autenticação com access token e refresh token.
- **Cookies HTTP-only**: armazenamento dos tokens com menor exposição a scripts no navegador.
- **Passport**: integração das estratégias JWT no NestJS.
- **bcrypt**: hash de senhas e refresh tokens.
- **class-validator e class-transformer**: validação e transformação dos DTOs.
- **Swagger/OpenAPI**: documentação interativa da API.
- **Docker e Docker Compose**: execução do PostgreSQL e opção de build da aplicação.
- **Jest**: testes unitários.
- **ESLint e Prettier**: padronização e qualidade de código.

## Requisitos

- Node.js 20 ou superior
- npm
- Docker
- Docker Compose

## Como rodar o projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/and1ssu/product-crud-back
cd produtos-back
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

O arquivo `.env.example` já contém valores suficientes para rodar localmente com Docker Compose.

### 4. Subir o banco PostgreSQL

```bash
npm run db:up
```

Esse comando sobe apenas o serviço `postgres` definido no `docker-compose.yml`.

### 5. Aplicar migrations

```bash
npm run prisma:migrate
```

### 6. Gerar o Prisma Client

```bash
npm run prisma:generate
```

### 7. Popular dados iniciais

```bash
npm run db:seed
```

O seed cria categorias, produtos e um usuário inicial:

```text
E-mail: admin@seed.com
Senha: password123
```

### 8. Iniciar a API em desenvolvimento

```bash
npm run start:dev
```

A API ficará disponível em:

```text
http://localhost:3000
```

A documentação Swagger ficará disponível em:

```text
http://localhost:3000/api/docs
```

## Rodando com Docker

Para subir PostgreSQL e backend via Docker Compose:

```bash
docker compose up --build
```

Em uma primeira execução, aplique as migrations antes de usar a API:

```bash
docker compose run --rm backend npx prisma migrate deploy
docker compose run --rm backend npx prisma db seed
```

Depois disso, suba os serviços novamente se necessário:

```bash
docker compose up
```

## Variáveis de ambiente

Exemplo de `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/produtos?schema=public"
PORT=3000

JWT_SECRET=change-this-to-a-long-random-string
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=change-this-to-another-long-random-string
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

Descrição:

- `DATABASE_URL`: URL de conexão com o PostgreSQL.
- `PORT`: porta em que a API será iniciada.
- `JWT_SECRET`: segredo para assinar access tokens.
- `JWT_EXPIRES_IN`: tempo de expiração do access token.
- `JWT_REFRESH_SECRET`: segredo para assinar refresh tokens.
- `JWT_REFRESH_EXPIRES_IN`: tempo de expiração do refresh token.
- `CORS_ORIGIN`: origem liberada no CORS.

## Scripts disponíveis

```bash
npm run start          # inicia a aplicação com Nest
npm run start:dev      # inicia em modo desenvolvimento com watch
npm run start:prod     # inicia o build em dist/main
npm run build          # compila o projeto
npm run test           # executa testes unitários
npm run test:watch     # executa testes em modo watch
npm run test:cov       # executa testes com cobertura
npm run lint           # executa ESLint com correção automática
npm run format         # formata arquivos com Prettier
npm run prisma:generate # gera o Prisma Client
npm run prisma:migrate # aplica/cria migrations em desenvolvimento
npm run prisma:studio  # abre o Prisma Studio
npm run db:up          # sobe PostgreSQL via Docker Compose
npm run db:down        # derruba os containers do Docker Compose
npm run db:seed        # executa o seed do banco
```

## Documentação da API

Com a aplicação rodando, acesse:

```text
http://localhost:3000/api/docs
```

A API usa cookies HTTP-only para autenticação:

- `access_token`: usado nas rotas protegidas.
- `refresh_token`: usado apenas em `/auth/refresh`.

As respostas de sucesso são padronizadas pelo `ResponseInterceptor`:

```json
{
  "data": {},
  "timestamp": "2026-04-24T12:00:00.000Z"
}
```

As respostas de erro são padronizadas pelo `AppExceptionFilter`:

```json
{
  "statusCode": 400,
  "message": "Mensagem do erro",
  "timestamp": "2026-04-24T12:00:00.000Z",
  "path": "/product"
}
```

## Principais rotas

### Health check

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/health` | Verifica se a API está online |

### Autenticação

| Método | Rota | Protegida | Descrição |
| --- | --- | --- | --- |
| `POST` | `/auth/register` | Não | Registra um usuário |
| `POST` | `/auth/login` | Não | Autentica e grava cookies |
| `GET` | `/auth/me` | Sim | Retorna o usuário autenticado |
| `PATCH` | `/auth/me` | Sim | Atualiza perfil do usuário autenticado |
| `POST` | `/auth/refresh` | Refresh token | Renova os tokens |
| `POST` | `/auth/logout` | Sim | Remove refresh token e limpa cookies |

Exemplo de login:

```bash
curl -i -c cookies.txt \
  -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@seed.com","password":"password123"}'
```

Exemplo de rota protegida:

```bash
curl -b cookies.txt http://localhost:3000/auth/me
```

### Categorias

| Método | Rota | Protegida | Descrição |
| --- | --- | --- | --- |
| `GET` | `/category` | Não | Lista categorias com paginação e filtros |
| `GET` | `/category/:id` | Não | Busca categoria por ID |
| `POST` | `/category` | Sim | Cria categoria |
| `PATCH` | `/category/:id` | Sim | Atualiza categoria |
| `DELETE` | `/category/:id` | Sim | Remove categoria |

Filtros disponíveis em `GET /category`:

- `page`
- `limit`
- `name`
- `parentId`

Exemplo:

```bash
curl "http://localhost:3000/category?page=1&limit=10&name=Eletr"
```

### Produtos

| Método | Rota | Protegida | Descrição |
| --- | --- | --- | --- |
| `GET` | `/product` | Não | Lista produtos com paginação e filtros |
| `GET` | `/product/:id` | Não | Busca produto por ID |
| `POST` | `/product` | Sim | Cria produto vinculado ao usuário autenticado |
| `PATCH` | `/product/:id` | Sim | Atualiza produto apenas se o usuário for dono |
| `DELETE` | `/product/:id` | Sim | Remove produto apenas se o usuário for dono |

Filtros disponíveis em `GET /product`:

- `page`
- `limit`
- `name`
- `categoryId`
- `status`: `ACTIVE`, `INACTIVE` ou `DRAFT`
- `order`: `asc` ou `desc`

Exemplo:

```bash
curl "http://localhost:3000/product?page=1&limit=10&status=ACTIVE&order=desc"
```

Exemplo de criação de produto:

```bash
curl -b cookies.txt \
  -X POST http://localhost:3000/product \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Produto Teste",
    "description": "Produto criado via API",
    "price": 99.9,
    "stock": 10,
    "status": "ACTIVE",
    "categoryIds": ["uuid-da-categoria"]
  }'
```

## Modelo de dados

Entidades principais:

- `User`: usuário autenticado, dono dos produtos criados.
- `Category`: categoria com suporte a hierarquia por `parentId`.
- `Product`: produto com preço, estoque, status e dono.
- `ProductCategory`: tabela de relacionamento N:N entre produtos e categorias.

```mermaid
erDiagram
  User ||--o{ Product : owns
  Product ||--o{ ProductCategory : has
  Category ||--o{ ProductCategory : groups
  Category ||--o{ Category : parent

  User {
    string id
    string name
    string email
    string password
    string refreshToken
  }

  Product {
    int id
    string name
    decimal price
    int stock
    ProductStatus status
    string ownerId
  }

  Category {
    string id
    string name
    string description
    string parentId
  }

  ProductCategory {
    int productId
    string categoryId
  }
```

## Arquitetura

### Estrutura do backend

```text
src/
  app.module.ts
  main.ts
  auth/
    dto/
    guards/
    strategies/
    auth.controller.ts
    auth.module.ts
    auth.service.ts
  categories/
    dto/
    categories.controller.ts
    categories.module.ts
    categories.service.ts
  products/
    dto/
    products.controller.ts
    products.module.ts
    products.service.ts
  prisma/
    prisma.module.ts
    prisma.service.ts
  common/
    exceptions/
    filters/
    helpers/
    interceptors/
prisma/
  schema.prisma
  seed.ts
  migrations/
```

### Diagrama da estrutura do backend

```mermaid
flowchart TD
  Main["main.ts"]
  AppModule["AppModule"]
  AuthModule["AuthModule"]
  CategoriesModule["CategoriesModule"]
  ProductsModule["ProductsModule"]
  PrismaModule["PrismaModule"]
  Common["Common: filtros, interceptors, helpers"]
  Database[("PostgreSQL")]

  Main --> AppModule
  AppModule --> AuthModule
  AppModule --> CategoriesModule
  AppModule --> ProductsModule
  AppModule --> PrismaModule
  AppModule --> Common
  AuthModule --> PrismaModule
  CategoriesModule --> PrismaModule
  ProductsModule --> PrismaModule
  PrismaModule --> Database
```

### Fluxo de requisição

```mermaid
sequenceDiagram
  participant Client as Cliente
  participant Controller as Controller
  participant Guard as JWT Guard
  participant Pipe as ValidationPipe
  participant Service as Service
  participant Prisma as PrismaService
  participant DB as PostgreSQL
  participant Filter as ExceptionFilter
  participant Interceptor as ResponseInterceptor

  Client->>Controller: Requisição HTTP
  Controller->>Guard: Valida cookie JWT se rota protegida
  Controller->>Pipe: Valida DTO e query params
  Controller->>Service: Executa regra de negócio
  Service->>Prisma: Consulta ou persiste dados
  Prisma->>DB: SQL
  DB-->>Prisma: Resultado
  Prisma-->>Service: Dados tipados
  Service-->>Controller: Retorno
  Controller-->>Interceptor: Padroniza sucesso
  Interceptor-->>Client: JSON com data e timestamp
  Service-->>Filter: Exceção de domínio ou HTTP
  Filter-->>Client: JSON de erro padronizado
```

### Organização de módulos

```mermaid
flowchart LR
  Auth["Auth Module<br/>registro, login, refresh, perfil"]
  Category["Category Module<br/>CRUD, filtros, hierarquia"]
  Product["Product Module<br/>CRUD, filtros, dono do produto"]
  Prisma["Prisma Module<br/>acesso ao banco"]
  Common["Common<br/>erros, paginação, resposta"]

  Auth --> Prisma
  Category --> Prisma
  Product --> Prisma
  Category --> Common
  Product --> Common
  Auth --> Common
```

## Uso de Inteligência Artificial

Para este teste técnico, foi utilizada IA como apoio de produtividade e revisão.

### IA utilizada

- ChatGPT/Codex da OpenAI.

### Em quais partes foi utilizada

- Organização e escrita deste README.
- Revisão da estrutura do projeto para documentar corretamente scripts, rotas e arquitetura.
- Apoio na descrição das decisões técnicas.
- Apoio na criação dos diagramas Mermaid.

### Exemplos de prompts utilizados

```text
Analise este projeto NestJS com Prisma e gere um README completo para teste técnico,
incluindo como rodar, tecnologias, arquitetura, rotas e decisões técnicas.
```

```text
Crie diagramas Mermaid simples para explicar a estrutura do backend,
o fluxo de requisição e a organização de módulos.
```

```text
Explique de forma objetiva as decisões técnicas de um backend NestJS com Prisma,
PostgreSQL, JWT, cookies HTTP-only, filters e interceptors.
```

### O que foi adaptado por mim

- Conferência dos arquivos reais do projeto antes de documentar.
- Ajuste das rotas para refletir a implementação atual: `/product`, `/category`, `/auth` e `/health`.
- Adaptação dos comandos para os scripts existentes no `package.json`.
- Inclusão do fluxo real de autenticação por cookies HTTP-only.
- Inclusão do seed existente com usuário `admin@seed.com`.
- Ajuste das decisões técnicas para refletir o código implementado.

### O que foi corrigido da IA

- Correção de nomes de rotas que poderiam ser assumidos no plural, mas no projeto estão no singular.
- Remoção de comandos ou ferramentas não existentes no projeto.
- Ajuste da explicação de Docker para deixar claro que migrations precisam ser aplicadas.
- Revisão dos diagramas para representar os módulos reais do backend.
- Revisão dos exemplos para usar os DTOs e campos existentes.

## Decisões técnicas

### Escolha de ORM

O Prisma foi escolhido por oferecer:

- tipagem forte integrada ao TypeScript;
- migrations versionadas;
- modelagem clara no `schema.prisma`;
- Prisma Client com autocomplete e segurança de tipos;
- boa produtividade para CRUDs e relacionamentos;
- suporte simples a seed e Prisma Studio.

Para um teste técnico, o Prisma também ajuda a deixar explícito o modelo de dados e reduz código repetitivo de acesso ao banco.

### Organização do projeto

O projeto segue a arquitetura modular do NestJS:

- `auth`: autenticação, registro, login, refresh, guards e strategies.
- `products`: regras de produto, filtros, paginação e validação de dono.
- `categories`: CRUD de categorias e hierarquia com `parentId`.
- `prisma`: centralização do acesso ao banco.
- `common`: recursos transversais como filtros, interceptors, exceções e paginação.

Essa separação facilita manutenção, testes e evolução independente dos módulos.

### Tratamento de erros

O projeto usa:

- `AppException` para erros de domínio com status HTTP definido;
- exceções nativas do NestJS, como `NotFoundException`;
- captura de erros conhecidos do Prisma, como `P2002` para conflitos de unicidade;
- `AppExceptionFilter` global para padronizar respostas de erro.

Com isso, a API retorna erros consistentes e evita expor detalhes internos desnecessários.

### Validação e segurança

- DTOs validam payloads com `class-validator`.
- `ValidationPipe` global usa `whitelist`, `forbidNonWhitelisted` e `transform`.
- Senhas são armazenadas com hash usando `bcrypt`.
- Refresh tokens também são armazenados com hash.
- Rotas de escrita são protegidas com `JwtAuthGuard`.
- Produtos só podem ser alterados ou removidos pelo usuário dono.
- Tokens são enviados em cookies HTTP-only.

### Escalabilidade

A estrutura atual permite evoluir o projeto com baixo acoplamento:

- novos módulos podem ser adicionados seguindo o mesmo padrão de `controller`, `service`, `dto` e `module`;
- regras de negócio ficam concentradas nos services;
- acesso ao banco fica centralizado no Prisma;
- filtros, interceptors e helpers reduzem duplicação;
- paginação e filtros já existem nas listagens principais;
- autenticação pode ser expandida com roles e permissões.

### Melhorias para produção

Para um ambiente de produção, seriam recomendadas as seguintes melhorias:

- usar secrets fortes e gerenciados por ambiente seguro;
- configurar `secure: true` nos cookies atrás de HTTPS;
- ajustar `sameSite` conforme o domínio do frontend;
- adicionar rate limit em login e refresh;
- adicionar logs estruturados e correlação por request;
- adicionar monitoramento, métricas e tracing;
- adicionar testes end-to-end;
- configurar CI/CD com lint, testes, build e migrations;
- usar `prisma migrate deploy` no pipeline de deploy;
- adicionar health check mais completo com verificação do banco;
- separar ambientes de desenvolvimento, staging e produção;
- revisar política de CORS para domínios reais.

## Testes

Executar testes unitários:

```bash
npm run test
```

Executar testes com cobertura:

```bash
npm run test:cov
```

Arquivos de teste existentes:

- `src/app.controller.spec.ts`
- `src/products/products.service.spec.ts`
- `src/categories/categories.service.spec.ts`

## Melhorias futuras

- Implementar testes end-to-end para fluxos completos de autenticação, categorias e produtos.
- Adicionar paginação padronizada em mais retornos se novos módulos forem criados.
- Criar sistema de roles, por exemplo `ADMIN` e `USER`.
- Adicionar soft delete para produtos e categorias.
- Adicionar auditoria de criação e alteração.
- Adicionar busca textual mais avançada para produtos.
- Adicionar logs estruturados.
- Adicionar cache em consultas públicas de leitura.
- Adicionar pipeline de CI com lint, testes e build.
# product-crud-back
