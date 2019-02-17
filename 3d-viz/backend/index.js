//redis websocket server lifted from demo: https://github.com/K-Jo/redisgraph-iam-demo
const
  express = require('express'),
  app = express(),
  RedisGraph = require('ioredisgraph'),
  _ = require('lodash'),
  argv = require('yargs')
    .default('p', 6379)
    .default('h', '127.0.0.1')
    .argv;

require('express-ws')(app)  // Allows Express to handle websockets

app.ws('/query/:windowId', function (ws) {
  console.log('established')
  ws.on('message', async function (sentJson) {
    let request = JSON.parse(sentJson)
    console.log(`Received request for graph: ${request.graphName}`);
    let graph = new RedisGraph({ port: argv.p, password: argv.P, host: argv.h, graphName: request.graphName });

    //example from demo: 'MATCH (n:Team {teamId:2})<-[r]-(m:User) RETURN ID(n), n.name, n.type, ID(m), m.name, m.type'
    let graphDump = await graph.query(`MATCH (w:word)-[r]->(k:kanji) RETURN ID(w), w.kanji, labels(w), ID(k), k.character, labels(k)`)

    ws.send(JSON.stringify({
      status: 'ok',
      results: graphDump,
      time: graphDump.meta
    }))
  })
})

app.listen(4000);
console.log('server listening on port 4000')
