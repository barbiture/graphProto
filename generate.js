const fs = require('fs');
const faker = require('faker/locale/en');
function generateGraf () {
  const graph = {
    nodes: [],
    links: []
  };
  const direction = ["forward", "reverse"];
  const weight = ["normal", "heavy"];
  const distance = ["short", "long"];
  const graphSize = 10;
  for (let item = 0; item < graphSize; item++)  {
    // const id = faker.random.uuid();
    const id = item+1;
    const title = faker.random.words(2);
    const paragraphsLength = faker.random.number({ min: 0, max: 1 });
    const description = faker.lorem.paragraphs(paragraphsLength);
    let nodes = {};
    if(description.length)
      nodes = {
        'id': id,
        'title': title,
        'description': description
      }
    else
      nodes = {
        'id': id,
        'title': title,
      }
    graph.nodes.push(nodes);
  }
  for (let item = 0; item < graph.nodes.length; item++) {
    const linksLength = faker.random.number({ min: 0, max: 9 });
    for(let edge = 1; edge < linksLength; edge++) {
      const directionLength = faker.random.number({ min: 0, max: 1 })
      const weightLength = faker.random.number({ min: 0, max: 1 })
      const distanceLength = faker.random.number({ min: -1, max: 1 })
      const randomTo = faker.random.number({ min: 1, max: graph.nodes.length })
      let links = {};
      const nodeId = graph.nodes[item].id;
      if(distance[distanceLength])
        links = {
          'source': nodeId,
          'target': randomTo!== nodeId ? randomTo: randomTo + 1,
          'direction': direction[directionLength],
          'weight': weight[weightLength],
          'distance': distance[distanceLength]
        }
      else
        links = {
          'source': nodeId,
          'target': edge,
          'direction': direction[directionLength],
          'weight': weight[weightLength]
        }
      graph.links.push(links);
    }
  }
  let data = JSON.stringify({graph: graph})
  fs.writeFileSync('./fixtures/tmp.json', data);
  return {graph: graph};
}
module.exports = generateGraf;
