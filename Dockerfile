# Use a imagem oficial do Node.js como base
FROM node

# Defina o diretório de trabalho dentro do container
WORKDIR /app

# Copie o package.json e o package-lock.json para o diretório de trabalho
COPY package*.json ./

# Instale as dependências do projeto
RUN npm install

# Copie o restante do código da aplicação para o diretório de trabalho
COPY . .

# Exponha as portas que a aplicação irá rodar
EXPOSE 3000
EXPOSE 9229

# Defina o comando para rodar a aplicação
CMD ["npm", "run", "dev"]