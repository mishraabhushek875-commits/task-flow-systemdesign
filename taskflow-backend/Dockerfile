# Node.js ka halka (alpine) version use kar rahe hain — image chhoti rahegi
FROM node:20-alpine

# Container ke andar working folder
WORKDIR /app

# Pehle sirf package.json copy karo (dependencies install karne ke liye)
# Isse Docker "layer caching" use karta hai — agar code badle par package.json na badle,
# to dependencies dobara install nahi karni padtin, build fast hoti hai
COPY package*.json ./

RUN npm install --production

# Ab baaki poora code copy karo
COPY . .

# Container ke andar app kis port pe chalega
EXPOSE 5000

# Container start hote hi ye command chalegi
CMD ["node", "src/server.js"]