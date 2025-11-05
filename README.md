# Metrohedron
## web app to track a user's travels on the NYC subway system

### stack
app is next.js with typescript
db is postgres managed with prisma orm
auth managed with auth0

frontend start
`npm run dev`
server start
`node src/server.js`
db start
make sure "metrohedron" image is running in Docker
target correct db with connection string in local settings
`prisma client start`
npx prisma