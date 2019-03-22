require('babel-polyfill')

let _ = require('lodash')
let ForceGraph3D = require('3d-force-graph')
let SpriteText = require('three-spritetext')

// redis objects looks like
// {
//   ID(w),
//   w.kanji,
//   w.jlptLevel,
//   ID(k),
//   k.character,
//   k.jlptLevel
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
        jlptLevel: redisResult['w.jlptLevel'],
        color: 'cyan'
      }
    }

    // if kanji is not yet deinfed, add it to node list
    if (!nodesAsHash[redisResult['ID(k)']]) {
      nodesAsHash[redisResult['ID(k)']] = {
        id: redisResult['ID(k)'],
        val: 0,
        name: redisResult['k.character'],
        jlptLevel: redisResult['k.jlptLevel'],
        color: 'yellow'
      }
    }

    // add relationship to links list
    d3GraphData.links.push({
      source: redisResult['ID(w)'],
      target: redisResult['ID(k)'],
      color: 'red',
      jlptLevel: redisResult['k.jlptLevel']
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
          sprite.visible = !!Graph.nodeOpacity()
        //  obj.add(sprite)
          return sprite
        })
      Graph
        .d3Force('link')
        .distance(400)
      Graph
        .d3Force('charge')
        .strength(-1000)

      Graph.kanjiGraph = {} // for personal use
      window.Graph = Graph // let's play in console

      Graph.onEngineStop(() => {
        console.log('engine stop')
        if (!Graph.kanjiGraph.opacityAnimationTimer) {
          Graph.kanjiGraph.opacityAnimationTimer = startOpacityAnimation(Graph)
        }
      })
    }

    let askForGraph = (query, chunkSize) => {
      socket.send(JSON.stringify({ graphName: 'kanji' }));
      console.log('asked server for graph');
    };

    askForGraph()
  };
});

function getColorBasedOnLevel (level) {
  switch (level) {
    case 'N5':
      return 'red'
    case 'N4':
      return 'orange'
    case 'N3':
      return 'yellow'
    case 'N2':
      return 'green'
    case 'N1':
      return 'blue'
  }
}

let getJlptLevel = (function * () {
  let level = 'N5'
  while (true) {
    yield level

    switch (level) {
      case 'N5':
        level = 'N4'
        break
      case 'N4':
        level = 'N3'
        break
      case 'N3':
        level = 'N2'
        break
      case 'N2':
        level = 'N1'
        break
      case 'N1':
        level = 'N5'
        break
    }
  }
})()

function startOpacityAnimation (Graph) {
  let opacity = 1
  let toggle = () => {
    let level = getJlptLevel.next().value
    Graph.jlptLevel = level
    console.log(`now rendering level ${Graph.jlptLevel}`)

    Graph.nodeOpacity(opacity)
         .linkOpacity((link) => {
           return link.jlptLevel >= Graph.jlptLevel ? 1 : 0
         })
  }

  return setInterval(toggle, 7 * 1000)
}
