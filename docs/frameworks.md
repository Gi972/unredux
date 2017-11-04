# Frameworks Comparison

## Agenda

[Synopsis](https://github.com/ivan-kleshnin/dataflows)

### Types of state management

Passive PULL-PULL (passive input, passive output):

```js
let state = new State()
state.set(foo)        // pull input
let foo = state.get() // pull output
```

Hybrid PULL-PUSH (passive input, reactive output):

```js
let state = new State()

state.subscribe(doSomething) // push output: ==foo==bar==>

state.set(foo) // pull input
state.set(bar) //
```

Reactive PUSH-PUSH (reactive input, reactive output):

```js
let actions = O.of(foo, bar) // push input

let state = new State(actions)

state.subscribe(doSomething) // push output: ==foo==bar==>
```

#### Reactive view + Internal Hybrid state + Proactive actions

`Action => State <- View => Action`

* ReactJS (default approach)

```js
// View => Action
onClick = {() => handleAdd(2)}

// Action => State
function handleAdd(v) {
  state.over(["counter"], R.add(v))
  // or
  // this.setState({counter: R.add(this.state.counter, v)})
}

// State <- View
// implicit DOM reconcilation
```

#### Reactive view + External Hybrid state (no explicit actions)

`State <- View => State`

* Angular
* CalmmJS
* Cycle-React
* MobX (default approach)
* Flux
* Redux
* VueJS
* (... thousands of them)

```js
// View => Action
onClick = {() => state.over("counter", R.add(2))}

// State <- View
// implicit DOM reconcilation
```

#### Reactive view + Reactive state + Proactive actions

`Action <- State <- View => Action`

* Earlier versions of this project
* *(Not aware of other examples)*

```js
// View => Action
onClick = {() => actions.add(2)}

// Action <- State
let state = State(O.merge(
  actions.inc,
  actions.add,
  // ...
))

// State <- View
// implicit DOM reconcilation
```

#### Reactive view + Reactive state + Reactive actions

`Intent <- State <- View <- Intent`

* CycleJS
* Unredux
* *(Not aware of other examples)*

```js
// View <- Intent
let intents = {
  inc: DOM.fromKey("inc").listen("click"),
  dec: DOM.fromKey("dec").listen("click"),
}

// Intent <- State
let state = State(O.merge(
  intents.inc(_ => R.inc),
  intents.add(v => R.add(v)),
  // ...
))

// State <- View
// implicit DOM reconcilation
```

## How Unredux looks like in comparison to _

### [Cycle-React](https://github.com/pH200/cycle-react)

The Cycle-React is a vanilla React + some streaming facilities.

* Pros: ?
* Cons: [imperative](https://github.com/pH200/cycle-react/blob/master/examples/web/todomvc/todo-model.js#L22) state updates,
[imperative](https://github.com/pH200/cycle-react/blob/master/examples/web/todomvc/todo-view.js#L57-L64) actions/intents.

### [CalmmJS](https://github.com/calmm-js)

Redux-like.

* Pros: allows multiple stores.
* Cons: obscure non-loggable actions, a lot of magic.

### [CycleJS](https://github.com/cyclejs/cyclejs/)

The design of Unredux is heavily inspired by CycleJS. I think CycleJS is based on two great and
one bad ideas. The great ideas are: reactive dataflow and isolation approach. The bad idea is drivers.

I believe the Driver concept is broken on the very fundamental level. CycleJS drivers are said to
"remove side effects from your code". And they really do it, but not in the sense you want.

* Haskell(-like) + "do" syntax: *write code that looks like imperative, but is actually pure*.
* CycleJS + drivers: *write code that looks like pure, but is actually imperative*.

And no, this is not caused by monad vs observable API distinction. This is a design difference.

Haskell approach is very grounded: side effects are sequential by nature so it's convenient to express
them so. Meanwhile we don't want to break the language purity, so we express effects as functions under
the carpet. For example, effectful function may have a type like `a -> RealWorld -> (b, RealWorld)` and
be called like

```hs
do {
  x1 <- doThis
  x2 <- doThat
}
```

Note that you not only express (natural) sequences in a convenient syntax, but also accumulate the action
results in scope! Both of these features are missing in CycleJS.

CycleJS' approach allows you to isolate side-effects in the library code so you can test your app
without mocking. Sounds good, but the HUGE drawback is that you can no longer express effectful
sequences sequentially. It's trivial to make a one-off side effect and DOM stuff is mostly like that.
It's already hard to express two sequential effects (think optimistic updates where you affect STATE and SERVER)
and HTTP stuff is mostly like that. In pseudo-code:

```
make doThis
take response of doThis
  make doThat
take response of doThat
  final

request doThis
request doThat
```

And it's a complete spaghettified mess with 3+ steps.

I wonder why CycleJS community is so concerned about drivers. Most drivers, with a few exceptions,
incapsulate fairly trivial code. They simply can't take complex premises to do something more useful
than hiding subscription lines except for DOM where sinks of effects has a single form of "render that"
(in simplest case, ater on you'll be screwed by non-incapsulable animations). The fact is: the IO layer
is often **less** predictable than Logic layer, so it's not a benefit to have 2nd class side-effects in your framework.

Going further, anything with 2+ effect types can't be exressed as driver, and will be classified as...
middleware? Nothing of that is even mentioned in the docs. `cycle-onionify` and `isolate` are
"secret" examples of middlewares.

Now state management is the biggest unsolved frontend topic since 2014 and it is all about multiple
effect sources and targets: memory, localStorage, REST, etc. CycleJS is not prepared to them "by design"
but YOU aren't expected to write one.

TODO describe the lack of lifecycle events

Our decision is to ditch the drivers completely. When it's about *harder unit testing* vs *harder development*
choice you should always choose the first. The benefit of unit tests is overrated, the pain of messy development
is underrated. CycleJS will force you to manually marshal N+ effectful streams from your components.
And, without a compiler help, it's not trivial at all (TypeScript won't help you because effects are still
untyped).

In Unredux, most components will have 1 or 2 streams: `$ (state-action)` (like in Cycle-Onionify)
and `DOM` (like in basic CycleJS). HTTP, logging, etc are kept inside the components. Their
resources can still be handled and properly released via `DOM` stream or React lifecycle events.

We don't support the claim that "imperative is bad, so imperative in time is also bad". We think
imperative syntax is the best to express sequential side effects (like in Haskell) so non-reactive
paradigm has it's place in code. With our approach, we'll have **reactivity** where it fits the best
(DOM + DOM events) and **control** where it fits the best (HTTP + optimistic updates).