require('babel-polyfill')
let _ = require('lodash')


document.addEventListener('DOMContentLoaded', async () => {
  let windowId = 'id' + Math.floor((Math.random() * 10000000));
  let socket = new WebSocket('ws://localhost:4000/query/' + windowId);

  socket.onopen = function () {
    console.log('socket open');
    socket.onmessage = (msg) => {
      console.log(msg)
      nodes = [];
      links = [];
      let data = JSON.parse(msg.data);

      if (data.status != 'ok') {
        throw new Error(`response from server did not have status: 'ok'. message: ${data.message}`)
      }


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
