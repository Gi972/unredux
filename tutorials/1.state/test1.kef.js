import * as R from "ramda"
import K from "kefir"

let action$ = K.sequentially(200, [R.inc, R.inc, R.inc, R.inc, R.dec, R.dec, R.dec, R.dec])

let seed = 0
let state = action$
  .merge(K.constant(seed))
  .diff((state, fn) => fn(state))

state.log()

// Next: support multiple subscribers...
