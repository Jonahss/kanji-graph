require('babel-polyfill')
let _ = require('lodash')
let ForceGraph3D = require('3d-force-graph')

// redis objects looks like
// {
//   ID(w),
//   w.kanji,
//   labels(w),
//   ID(k),
//   k.character,
//   labels(k)
// }
// and for d3 we want nodes/links arrays
// {
//     "nodes": [
//         {
//           "id": "id1",
//           "name": "name1",
//           "val": 1
//         },
//         {
//           "id": "id2",
//           "name": "name2",
//           "val": 10
//         },
//         (...)
//     ],
//     "links": [
//         {
//             "source": "id1",
//             "target": "id2"
//         },
//         (...)
//     ]
// }
let convertToD3GraphData = (rawRedisResults) => {
  let d3GraphData = {
    nodes: [],
    links: []
  }

  let nodesAsHash = {}

  for (let redisResult of rawRedisResults) {
    // if word is not yet defined, add it to node list
    if (!nodesAsHash[redisResult['ID(w)']]) {
      nodesAsHash[redisResult['ID(w)']] = {
        id: redisResult['ID(w)'],
        val: 1,
        name: redisResult['w.kanji'],
        color: 'cyan'
      }
    }

    // if kanji is not yet deinfed, add it to node list
    if (!nodesAsHash[redisResult['ID(k)']]) {
      nodesAsHash[redisResult['ID(k)']] = {
        id: redisResult['ID(k)'],
        val: 1,
        name: redisResult['k.character'],
        color: 'yellow'
      }
    }

    // add relationship to links list
    d3GraphData.links.push({
      source: redisResult['ID(w)'],
      target: redisResult['ID(k)'],
      color: 'red'
    })
  }

  d3GraphData.nodes = _.values(nodesAsHash)

  return d3GraphData
}

document.addEventListener('DOMContentLoaded', async () => {
  let windowId = 'id' + Math.floor((Math.random() * 10000000));
  let socket = new WebSocket('ws://localhost:4000/query/' + windowId);

  socket.onopen = function () {
    console.log('socket open');
    socket.onmessage = (msg) => {
    //  console.log(msg)
      let data = JSON.parse(msg.data);

      if (data.status != 'ok') {
        throw new Error(`response from server did not have status: 'ok'. message: ${data.message}`)
      }

      let graphData = convertToD3GraphData(data.results)
    //  console.log(graphData)

      let Graph = ForceGraph3D()(document.getElementById('3d-graph'))
        .linkOpacity(.3)
        .linkWidth(5)
        .graphData(graphData)
      Graph
        .d3Force('link')
        .distance(50)
      Graph
        .d3Force('charge')
        .strength(-400)

    // if (data.status === 'ok') {
      //   let relationships = data.results;
      //   let queryTime = data.time;
      //   let nodesAsObject = {};
      //   relationships.forEach((o) => {
      //     o.forEach((e) => {
      //       let node = {};
      //       node.id = e[1][1];
      //       node.extended = {};
      //       e.forEach(function (aPair) {
      //         node.extended[aPair[0]] = aPair[1];
      //       });
      //       nodesAsObject['_' + e[0][1]] = node;
      //     });
      //   });
      //   Object.keys(nodesAsObject).forEach(function (aNode, i) {
      //     nodesAsObject[aNode].linearId = i;
      //     nodes.push(nodesAsObject[aNode]);
      //   });
      //   relationships.forEach((o) => {
      //     o.forEach((e, i) => {
      //       if ((o.length - 1) !== i) {
      //         links.push({ source: nodesAsObject['_' + e[0][1]].linearId, target: nodesAsObject['_' + o[i + 1][0][1]].linearId });
      //       }
      //     });
      //   });



        // textEls = texts.selectAll('text').data(nodes, function (node) { return node.id })
        // textEls.exit().remove()
        // var textEnter = textEls
        //   .enter()
        //   .append('text')
        //   .text(function (node) { return node.id })
        //   .attr('font-size', 15);
        // textEls = textEnter.merge(textEls);
    //    restart();
  //      console.log(queryTime);
      // } else {
      //   console.error(data.message)
      // }
    }

    let askForGraph = (query, chunkSize) => {
      socket.send(JSON.stringify({ graphName: 'kanji' }));
      console.log('asked server for graph');
    };

    askForGraph()
  };
});
