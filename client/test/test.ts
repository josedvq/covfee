import { CircularDataCaptureBuffer} from '../buffers/circular_dc_buffer'
var assert = require('assert')

// simulates a fetch function using timeouts
class dummy_fetcher {
  delay: number
  stats: any
  lastData: any
  constructor(delay:number) {
    this.delay = delay
    this.clear()
  }
  clear = () => {
    this.stats = {
      fetch_success: 0
    }
  }
  fetch = (url: string, options: any) =>{
    const parsed = JSON.parse(options.body).data
    this.lastData = {
      counters: parsed.data.map(record=>record[1]),
      samples: parsed.data.map(record => record[2])
    }
    this.stats.fetch_success += 1
    return new Promise((resolve) => {
      setTimeout(()=>{
        resolve({
          json: ()=>{return {}},
          ok: true
        })
      }, this.delay)
    })
  }
}

const fetcher = new dummy_fetcher(0)

beforeEach(async function () {
  fetcher.clear()
})

describe('CircularBuffer(5,4)', function() {
  describe('#data()', function() {
    it('should cause no calls to fetch if given 19 samples', async function() {
      const cb = new CircularDataCaptureBuffer(5, 4, '')
      cb.fetch_fn = fetcher.fetch
      for(let i=0; i<19; i++) {
        cb.data(i, [i, i, i])
      }
      await cb.awaitClear(2000)
      assert.equal(fetcher.stats.fetch_success, 0)
    })

    it('should cause 4 calls to fetch if given 19 samples and flushed', async function () {
      const cb = new CircularDataCaptureBuffer(5, 4, '')
      cb.fetch_fn = fetcher.fetch
      for (let i = 0; i < 19; i++) {
        cb.data(i, [i*2])
      }
      cb.flush()
      await cb.awaitClear(2000)
      assert.equal(fetcher.stats.fetch_success, 4)
      assert.deepEqual(fetcher.lastData.counters, [15,16,17,18])
      assert.deepEqual(fetcher.lastData.samples, [[30], [32], [34], [36]])
    })

    it('should cause one call to fetch with the first 5 samples if given 20 samples', async function () {
      const cb = new CircularDataCaptureBuffer(5, 4, '')
      cb.fetch_fn = fetcher.fetch
      let firstChunk = []
      for (let i = 0; i < 20; i++) {
        const ds = [i, i, i]
        cb.data(i, ds)
        if(i < 5) firstChunk.push(ds)
      }

      assert.equal(fetcher.stats.fetch_success, 1)
      assert.deepEqual(fetcher.lastData.counters, [0,1,2,3,4])
      assert.deepEqual(fetcher.lastData.samples, firstChunk)
    })

    it('last call to fetch should contain the (n-3)rd chunk when given n chunks ', async function () {
      const cb = new CircularDataCaptureBuffer(5, 4, '')
      cb.fetch_fn = fetcher.fetch
      let lastSubmittedChunk = []
      let k = 0
      for (let i = 0; i < 10; i++) {
        for(let j = 0; j < 5; j++) {
          cb.data(k, [k * 3])
          if (i == 6) lastSubmittedChunk.push([k * 3])
          k+=1
        }
      }
      await cb.awaitClear(2000)
      assert.equal(fetcher.stats.fetch_success, 7)
      assert.deepEqual(fetcher.lastData.samples, lastSubmittedChunk)
    })
  })

  describe('#rewind()', function () {
    it('should rewind to sample with ts=10 if given 20 samples', async function () {
      const cb = new CircularDataCaptureBuffer(5, 4, '')

      // first send a few data
      cb.fetch_fn = fetcher.fetch
      for (let i = 0; i < 20; i++) { // size = 20
        cb.data(i, [i+2])
      } 
      await cb.awaitClear(2000)
      assert.equal(fetcher.stats.fetch_success, 1)
      assert.deepEqual(fetcher.lastData.counters, [0, 1, 2, 3, 4])
      assert.deepEqual(fetcher.lastData.samples, [[2], [3], [4], [5], [6]])

      // rewind to correct data starting at ts=10
      const ds = cb.rewind(10) // headptr = 10, return value should be 12 (10+2)
      assert.deepEqual(ds, [12])
      // correct the third chunk
      // no output should happen because data is being overwritten
      let rwnd_data = [] // should be 12, 13, 14, 15, 16 (the overwritten data)
      for (let i = 10; i < 15; i++) { // size = 15
        rwnd_data.push(cb.data(i, [1]))
      }
      await cb.awaitClear(2000)
      assert.deepEqual(rwnd_data, [[12],[13],[14],[15],[16]])
      assert.equal(fetcher.stats.fetch_success, 1)

      // fill in two more chunks. This should cause the second submitted chunk (before correction) to be submitted
      for (let i = 25; i < 35; i++) { // size = 25
        cb.data(i, [2])
      }
      await cb.awaitClear(2000)
      assert.equal(fetcher.stats.fetch_success, 2)
      assert.deepEqual(fetcher.lastData.counters, [5, 6, 7, 8, 9])
      assert.deepEqual(fetcher.lastData.samples, [[7], [8], [9], [10], [11]])

      // fill in another chunk which should cause the third (corrected) chunk to be submitted.
      for (let i = 35; i < 40; i++) { // size = 30
        cb.data(i, [3])
      }
      await cb.awaitClear(2000)
      assert.equal(fetcher.stats.fetch_success, 3)
      assert.deepEqual(fetcher.lastData.counters, [20, 21, 22, 23, 24])
      assert.deepEqual(fetcher.lastData.samples, [[1], [1], [1], [1], [1]])
    })
  })
})