const component1 = require('../../components/component1')
const component2 = require('../../components/component2')
// const component3 = require('../../components/component3')

const page1 = () => {
  component1()
  component2()
  // component3()

  console.log('Page 1')
}

module.exports.page1 = page1
module.exports = page1
