import { BinaryDataCaptureBuffer} from '../buffers/binary_dc_buffer'
var assert = require('assert')
var sinon = require('sinon')

// simulates a fetch function using timeouts
class dummy_fetcher {
  delay: number
  stats: any
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
const slow_fetcher = new dummy_fetcher(1000000)
var clock: any;

before(function () {
  clock = sinon.useFakeTimers();
});
after(function () {
  clock.restore();
});

beforeEach(async function () {
  fetcher.clear()
})



describe('BinaryDataCaptureBuffer(1000, false, 1, 100, 100, null, 5, 1, 4, null, false)', function() {
  describe('#data()', function() {

    it('should write a value that is readable via read()', async function() {
      const cb = new BinaryDataCaptureBuffer(1000, false, 2, 100, 100, null, 5, 1, 4, null, false)
      cb.data(1, [0, 5])
      const [val, logs] = cb.read(1)
      assert.deepEqual(val, [1,0,5])
      cb.destroy()
    })

    it('should fail when provided a data sample that is too long', async function() {
      const cb = new BinaryDataCaptureBuffer(1000, false, 2, 100, 100, null, 5, 1, 4, null, false)
      assert.throws(() => {
        cb.data(1, [0, 5, 10])
      }, Error)
      cb.destroy()
    })

    it('should submit the correct chunk when provided a single sample, only after 5 seconds', async function() {
      const cb = new BinaryDataCaptureBuffer(1000, false, 2, 100, 100, null, 5, 1, 4, null, false)
      cb.fetch_fn = fetcher.fetch
      await clock.tickAsync(4500)
      cb.data(6, [22, 22])
      await clock.tickAsync(1000)
      // should queue dirty chunks, but still no chunks older than 1s
      assert.equal(fetcher.stats.fetch_success, 0)

      // wait another 5 seconds
      await clock.tickAsync(5000)
      assert.equal(fetcher.stats.fetch_success, 1)
      cb.destroy()
    })

    // it('should call onError when the output buffer has more than 4 chunks when dirty chunks are enqueued', async function() {
    //   let onErrorCalled = 0
    //   const onError = (err: any) => {
    //     console.log(err)
    //     onErrorCalled += 1
    //   }
    //   const cb = new BinaryDataCaptureBuffer(1000, false, 1, 100, 100, null, 5, 1, 4, onError, false)
    //   cb.fetch_fn = slow_fetcher.fetch
    //   cb.data(0.5, [22])
    //   cb.data(1.5, [22])
    //   cb.data(2.5, [22])
    //   cb.data(3.5, [22])
    //   clock.tick(6000)
    //   // assert.equal(slow_fetcher.stats.fetch_success, 0)
    //   assert.equal(onErrorCalled, 0)

    //   // wait another 5 seconds
    //   cb.data(3.5, [22])
    //   clock.tick(5000)
    //   assert.equal(onErrorCalled, 0)

    //   cb.data(4.5, [22])
    //   clock.tick(5000)
    //   assert.equal(onErrorCalled, 0)

    //   clock.tick(5000)
    //   assert.equal(onErrorCalled, 1)
    //   cb.destroy()
    // })

    // it('should cause no calls to fetch if given 19 samples', async function() {
    //   const cb = new BinaryDataCaptureBuffer(1000, false, 2, 100, 25, null, 5, 4, null, true)
    //   cb.fetch_fn = fetcher.fetch
    //   for(let i=0; i<19; i++) {
    //     cb.data(i, [i, i, i])
    //   }
    //   await cb.awaitClear(2000)
    //   assert.equal(fetcher.stats.fetch_success, 0)
    // })
  })
})

// describe('CircularBuffer(5,4)', function() {
//   describe('#data()', function() {
//     it('should cause no calls to fetch if given 19 samples', async function() {
//       const cb = new BinaryDataCaptureBuffer(5, 4, '')
//       cb.fetch_fn = fetcher.fetch
//       for(let i=0; i<19; i++) {
//         cb.data(i, [i, i, i])
//       }
//       await cb.awaitClear(2000)
//       assert.equal(fetcher.stats.fetch_success, 0)
//     })

//     it('should cause 4 calls to fetch if given 19 samples and flushed', async function () {
//       const cb = new BinaryDataCaptureBuffer(5, 4, '')
//       cb.fetch_fn = fetcher.fetch
//       for (let i = 0; i < 19; i++) {
//         cb.data(i, [i*2])
//       }
//       cb.flush()
//       await cb.awaitClear(2000)
//       assert.equal(fetcher.stats.fetch_success, 4)
//       assert.deepEqual(fetcher.lastData.counters, [15,16,17,18])
//       assert.deepEqual(fetcher.lastData.samples, [[30], [32], [34], [36]])
//     })

//     it('should cause one call to fetch with the first 5 samples if given 20 samples', async function () {
//       const cb = new BinaryDataCaptureBuffer(5, 4, '')
//       cb.fetch_fn = fetcher.fetch
//       let firstChunk = []
//       for (let i = 0; i < 20; i++) {
//         const ds = [i, i, i]
//         cb.data(i, ds)
//         if(i < 5) firstChunk.push(ds)
//       }

//       assert.equal(fetcher.stats.fetch_success, 1)
//       assert.deepEqual(fetcher.lastData.counters, [0,1,2,3,4])
//       assert.deepEqual(fetcher.lastData.samples, firstChunk)
//     })

//     it('last call to fetch should contain the (n-3)rd chunk when given n chunks ', async function () {
//       const cb = new BinaryDataCaptureBuffer(5, 4, '')
//       cb.fetch_fn = fetcher.fetch
//       let lastSubmittedChunk = []
//       let k = 0
//       for (let i = 0; i < 10; i++) {
//         for(let j = 0; j < 5; j++) {
//           cb.data(k, [k * 3])
//           if (i == 6) lastSubmittedChunk.push([k * 3])
//           k+=1
//         }
//       }
//       await cb.awaitClear(2000)
//       assert.equal(fetcher.stats.fetch_success, 7)
//       assert.deepEqual(fetcher.lastData.samples, lastSubmittedChunk)
//     })
//   })
// })