import A from "axios"
import * as F from "framework"
import K from "kefir"
import * as D from "selfdb"
import * as R from "ramda"
import React from "react"
import UserDetail from "./UserDetail"

export default (sources, key) => {
  let {params} = sources.props
  let baseLens = ["users", params.id]

  let intents = {
    fetch$: sources.state$
      .filter(s => !R.view(baseLens, s))
      .flatMapLatest(_ => K.fromPromise(A.get(`/api/users/${params.id}`)))
      .map(resp => resp.data.models[params.id])
      .mapErrors(err => {
        console.warn(err) // TODO
        return K.never()
      }),
  }

  let action$ = K.merge([
    intents.fetch$.map(user => {
      return function afterFetch(state) {
        return R.set(baseLens, user, state)
      }
    }),
  ])

  let detail$ = D.run(
    () => D.makeStore({}),
    // D.withLog({key}),
  )(
    D.init({id: params.id}),
  ).$

  let user$ = D.derive(
    {
      table: sources.state$.map(s => s.users),
      detail: detail$,
    },
    ({table, detail}) => {
      return table[detail.id]
    }
  )

  let Component = F.connect(
    {
      user: user$,
    },
    UserDetail,
  )

  return {action$, Component}
}