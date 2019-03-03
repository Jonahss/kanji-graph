require('babel-polyfill')
let _ = require('lodash')
let ForceGraph3D = require('3d-force-graph')
let SpriteText = require('three-spritetext')

// redis objects looks like
// {
//   ID(w),
//   w.kanji,
//   labels(w),
//   ID(k),
//   k.character,
//   labels(k)
// }
//
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
        val: 0,
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

    // add 1 to the target node's `val` property.
    // this sets node.val to the number of incoming connections to the node.
    nodesAsHash[redisResult['ID(k)']].val++
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
      let data = JSON.parse(msg.data);

      if (data.status != 'ok') {
        throw new Error(`response from server did not have status: 'ok'. message: ${data.message}`)
      }

      let graphData = convertToD3GraphData(data.results)
    //  console.log(graphData)

      let Graph = ForceGraph3D()(document.getElementById('3d-graph'))
        .linkOpacity(.2)
        .linkWidth(4)
        .graphData(graphData)
      Graph
        .nodeThreeObject(node => {
          //console.log(node)
          // // use a sphere as a drag handle
          // const obj = new THREE.Mesh(
          //   new THREE.SphereGeometry(10),
          //   new THREE.MeshBasicMaterial({ depthWrite: false, transparent: true, opacity: 0 })
          // );
          // add text sprite as child
          const sprite = new SpriteText(node.name)
          sprite.color = node.color
          sprite.textHeight = (node.val*1.5) + 8
        //  obj.add(sprite)
          return sprite
        })
      Graph
        .d3Force('link')
        .distance(400)
      Graph
        .d3Force('charge')
        .strength(-1000)


    }

    let askForGraph = (query, chunkSize) => {
      socket.send(JSON.stringify({ graphName: 'kanji' }));
      console.log('asked server for graph');
    };

    askForGraph()
  };
});
