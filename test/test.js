import polyfill from 'babel-polyfill'
import { expect }  from 'chai'
import scullionWeb from '../src/index'


describe('scullion-web basics', function () {
  it('should exist', function () {
    expect(scullionWeb).to.be.function
  })
})
